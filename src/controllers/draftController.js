const { CensusDraft, Kbg, User } = require('../../models');

const draftController = {
  // Paroki/Gereja: Import data ke KBG tertentu
  importDrafts: async (req, res) => {
    try {
      const { drafts, kbg_id } = req.body;
      const created_by = req.user.id;

      if (!drafts || !Array.isArray(drafts) || drafts.length === 0) {
        return res.status(400).json({ success: false, message: 'Drafts data is required' });
      }

      if (!kbg_id) {
        return res.status(400).json({ success: false, message: 'KBG ID is required' });
      }

      const kbg = await Kbg.findByPk(kbg_id, { attributes: ['id', 'nama_kbg', 'ketua_id'] });
      if (!kbg) {
        return res.status(404).json({ success: false, message: 'KBG not found' });
      }

      // Map to DB schema
      const insertData = drafts.map(draft => ({
        kbg_id,
        payload_data: draft.data,
        created_by
      }));

      await CensusDraft.bulkCreate(insertData);

      res.status(201).json({
        success: true,
        message: 'Drafts imported successfully',
        count: insertData.length
      });
    } catch (error) {
      console.error('Error importing drafts:', error);
      res.status(500).json({ success: false, message: 'Failed to import drafts', error: error.message });
    }
  },

  // KBG: Get daftar draf yang ditugaskan ke mereka
  getDraftsByKbg: async (req, res) => {
    try {
      let whereClause = {};
      
      if (req.user.role === 'KETUA_KBG' || req.user.role === 'Ketua KBG') {
        // Cari KBG di mana ketua_id adalah id user yang sedang login
        const kbg = await Kbg.findOne({ where: { ketua_id: req.user.id }, attributes: ['id'] });
        if (!kbg) {
          return res.status(400).json({ success: false, message: 'User belum di-assign sebagai ketua KBG manapun' });
        }
        whereClause.kbg_id = kbg.id;
      }
      // If Paroki/Gereja, maybe they can see everything or filter by KBG.

      const drafts = await CensusDraft.findAll({
        where: whereClause,
        include: [
          { model: Kbg, as: 'Kbg', attributes: ['id', 'nama_kbg'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Format response so frontend can consume it easily
      const formattedDrafts = drafts.map(d => ({
        id: d.id,
        data: d.payload_data,
        createdAt: d.createdAt,
        kbg: d.Kbg
      }));

      res.status(200).json({ success: true, data: formattedDrafts });
    } catch (error) {
      console.error('Error fetching drafts:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch drafts', error: error.message });
    }
  },

  // KBG: Hapus draf setelah disubmit
  deleteDraft: async (req, res) => {
    try {
      const { id } = req.params;
      const draft = await CensusDraft.findByPk(id);

      if (!draft) {
        return res.status(404).json({ success: false, message: 'Draft not found' });
      }

      await draft.destroy();

      res.status(200).json({ success: true, message: 'Draft deleted successfully' });
    } catch (error) {
      console.error('Error deleting draft:', error);
      res.status(500).json({ success: false, message: 'Failed to delete draft', error: error.message });
    }
  }
};

module.exports = draftController;
