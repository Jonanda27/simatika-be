const { Kbg, KbgPengurus, Umat } = require('../../models');

const kbgController = {
  getAllKbgs: async (req, res) => {
    try {
      const { stasi_id, no_stasi } = req.query;
      const whereClause = {};
      
      const user = req.user;
      
      // Jika user adalah ADMIN_STASI, paksakan agar hanya bisa melihat KBG dari stasinya sendiri
      if (user && user.role === 'ADMIN_STASI' && user.stasi_id) {
        whereClause.stasi_id = user.stasi_id;
      } else if (stasi_id) {
        whereClause.stasi_id = stasi_id;
      } else if (no_stasi === 'true') {
        whereClause.stasi_id = null;
      }

      const kbgs = await Kbg.findAll({
        where: whereClause,
        attributes: ['id', 'nama_kbg', 'kode_kbg', 'stasi_id', 'ketua_id', 'latitude', 'longitude'],
        include: [
          {
            model: KbgPengurus,
            as: 'Pengurus',
            where: { is_active: true, jabatan: 'Ketua' },
            required: false,
            include: [
              {
                model: Umat,
                attributes: ['nama_lengkap']
              }
            ]
          }
        ],
        order: [['nama_kbg', 'ASC']]
      });
      res.status(200).json({ success: true, data: kbgs });
    } catch (error) {
      console.error('Error fetching KBGs:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch KBGs' });
    }
  },

  updateKbgLocation: async (req, res) => {
    try {
      const { id } = req.params;
      const { latitude, longitude } = req.body;

      const kbg = await Kbg.findByPk(id);
      if (!kbg) {
        return res.status(404).json({ success: false, message: 'KBG not found' });
      }

      await kbg.update({ latitude, longitude });
      res.status(200).json({ success: true, message: 'KBG location updated successfully', data: kbg });
    } catch (error) {
      console.error('Error updating KBG location:', error);
      res.status(500).json({ success: false, message: 'Failed to update KBG location' });
    }
  },

  createKbg: async (req, res) => {
    try {
      const { nama_kbg, kode_kbg, stasi_id, latitude, longitude } = req.body;
      const kbg = await Kbg.create({
        nama_kbg,
        kode_kbg,
        stasi_id,
        latitude: latitude || null,
        longitude: longitude || null
      });
      res.status(201).json({ success: true, data: kbg, message: 'KBG berhasil ditambahkan' });
    } catch (error) {
      console.error('Error creating KBG:', error);
      res.status(500).json({ success: false, message: 'Gagal menambahkan KBG' });
    }
  },

  updateKbg: async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_kbg, kode_kbg, stasi_id, latitude, longitude } = req.body;
      const kbg = await Kbg.findByPk(id);
      if (!kbg) return res.status(404).json({ success: false, message: 'KBG tidak ditemukan' });

      await kbg.update({
        nama_kbg,
        kode_kbg,
        stasi_id,
        latitude: latitude || null,
        longitude: longitude || null
      });
      res.status(200).json({ success: true, data: kbg, message: 'KBG berhasil diperbarui' });
    } catch (error) {
      console.error('Error updating KBG:', error);
      res.status(500).json({ success: false, message: 'Gagal memperbarui KBG' });
    }
  },

  deleteKbg: async (req, res) => {
    try {
      const { id } = req.params;
      const { KbgPengurus } = require('../../models');

      const pengurusCount = await KbgPengurus.count({ where: { kbg_id: id } });
      if (pengurusCount > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Tidak bisa menghapus KBG. Terdapat ${pengurusCount} data Pengurus yang masih terkait dengan KBG ini.` 
        });
      }

      const kbg = await Kbg.findByPk(id);
      if (!kbg) return res.status(404).json({ success: false, message: 'KBG tidak ditemukan' });

      await kbg.destroy();
      res.status(200).json({ success: true, message: 'KBG berhasil dihapus' });
    } catch (error) {
      console.error('Error deleting KBG:', error);
      res.status(500).json({ success: false, message: 'Gagal menghapus KBG' });
    }
  }
};

module.exports = kbgController;
