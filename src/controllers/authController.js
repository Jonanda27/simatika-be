const { User } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // Cari user berdasarkan username
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Cek password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Buat JWT payload
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    // Tanda tangani token (Gunakan JWT_SECRET dari .env atau fallback)
    const secret = process.env.JWT_SECRET || 'simatika_super_secret_key_123';
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: payload
    });

  } catch (error) {
    error.message = 'Internal server error: ' + error.message;
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    // req.user diset oleh authMiddleware
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // Jangan kembalikan password
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      user: user
    });
  } catch (error) {
    error.message = 'Internal server error: ' + error.message;
    next(error);
  }
};
