const { Stasi } = require('../../models');

const stasiController = {
  getAllStasi: async (req, res) => {
    try {
      const stasis = await Stasi.findAll({
        attributes: ['id', 'nama_stasi', 'kode_stasi', 'latitude', 'longitude'],
        order: [['nama_stasi', 'ASC']]
      });
      res.status(200).json({ success: true, data: stasis });
    } catch (error) {
      console.error('Error fetching Stasis:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch Stasis' });
    }
  },

  createStasi: async (req, res) => {
    try {
      const { nama_stasi, kode_stasi, latitude, longitude } = req.body;
      const stasi = await Stasi.create({
        nama_stasi,
        kode_stasi,
        latitude: latitude || null,
        longitude: longitude || null
      });
      res.status(201).json({ success: true, data: stasi, message: 'Stasi berhasil ditambahkan' });
    } catch (error) {
      console.error('Error creating Stasi:', error);
      res.status(500).json({ success: false, message: 'Gagal menambahkan Stasi' });
    }
  },

  updateStasi: async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_stasi, kode_stasi, latitude, longitude } = req.body;
      const stasi = await Stasi.findByPk(id);
      if (!stasi) return res.status(404).json({ success: false, message: 'Stasi tidak ditemukan' });

      await stasi.update({
        nama_stasi,
        kode_stasi,
        latitude: latitude || null,
        longitude: longitude || null
      });
      res.status(200).json({ success: true, data: stasi, message: 'Stasi berhasil diperbarui' });
    } catch (error) {
      console.error('Error updating Stasi:', error);
      res.status(500).json({ success: false, message: 'Gagal memperbarui Stasi' });
    }
  },

  deleteStasi: async (req, res) => {
    try {
      const { id } = req.params;
      const { Kbg } = require('../../models');

      const kbgCount = await Kbg.count({ where: { stasi_id: id } });
      if (kbgCount > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Tidak bisa menghapus Stasi. Terdapat ${kbgCount} KBG yang masih terdaftar di bawah Stasi ini.` 
        });
      }

      const stasi = await Stasi.findByPk(id);
      if (!stasi) return res.status(404).json({ success: false, message: 'Stasi tidak ditemukan' });

      await stasi.destroy();
      res.status(200).json({ success: true, message: 'Stasi berhasil dihapus' });
    } catch (error) {
      console.error('Error deleting Stasi:', error);
      res.status(500).json({ success: false, message: 'Gagal menghapus Stasi' });
    }
  }
};

module.exports = stasiController;
