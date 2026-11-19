const { User } = require('../../models');
const bcrypt = require('bcryptjs');

// Mendapatkan semua pengguna
exports.getAllUsers = async (req, res) => {
  try {
    const { Stasi, Kbg } = require('../../models');
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        { model: Stasi, attributes: ['nama_stasi'] },
        { model: Kbg, as: 'Kbg', attributes: ['id', 'nama_kbg'] }
      ]
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Mendapatkan satu pengguna berdasarkan ID
exports.getUserById = async (req, res) => {
  try {
    const { Stasi, Kbg } = require('../../models');
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Stasi, attributes: ['nama_stasi'] },
        { model: Kbg, as: 'Kbg', attributes: ['id', 'nama_kbg'] }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Membuat pengguna baru
exports.createUser = async (req, res) => {
  try {
    const { username, password, role, stasi_id, kbg_id } = req.body;
    
    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: 'Username, password, and role are required' });
    }

    // Cek jika username sudah ada
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      role,
      stasi_id: role === 'ADMIN_STASI' ? stasi_id : null
    });

    if (role === 'KETUA_KBG' && kbg_id) {
      const { Kbg } = require('../../models');
      await Kbg.update({ ketua_id: newUser.id }, { where: { id: kbg_id } });
    }

    const userResponse = newUser.toJSON();
    delete userResponse.password;

    res.status(201).json({ success: true, message: 'User created successfully', data: userResponse });
  } catch (error) {
    console.error('Error in createUser:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Memperbarui data pengguna
exports.updateUser = async (req, res) => {
  try {
    const { username, password, role, stasi_id, kbg_id } = req.body;
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Jika update username, cek apakah sudah dipakai
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
      }
      user.username = username;
    }

    if (role) {
      user.role = role;
    }
    
    if (user.role === 'ADMIN_STASI' && stasi_id !== undefined) {
      user.stasi_id = stasi_id;
    } else if (user.role !== 'ADMIN_STASI') {
      user.stasi_id = null;
    }

    if (user.role === 'KETUA_KBG') {
      const { Kbg } = require('../../models');
      // Kosongkan ketua_id di KBG yang sebelumnya dipegang oleh user ini
      await Kbg.update({ ketua_id: null }, { where: { ketua_id: user.id } });
      
      // Update ketua_id di KBG yang baru dipilih
      if (kbg_id) {
        await Kbg.update({ ketua_id: user.id }, { where: { id: kbg_id } });
      }
    } else {
      // Jika rolenya diubah dari KETUA_KBG menjadi role lain, lepaskan KBG-nya
      const { Kbg } = require('../../models');
      await Kbg.update({ ketua_id: null }, { where: { ketua_id: user.id } });
    }

    // Jika ganti password
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json({ success: true, message: 'User updated successfully', data: userResponse });
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Menghapus pengguna
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Jangan izinkan hapus diri sendiri jika diperlukan (opsional, ditiadakan sementara)

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.destroy();
    
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
