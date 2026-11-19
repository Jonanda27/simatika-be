const db = require('../../models');
const { KbgPengurus, Umat, Kbg } = db;

// GET /api/kbg-pengurus/:kbg_id
exports.getByKbgId = async (req, res, next) => {
  try {
    const pengurus = await KbgPengurus.findAll({
      where: { kbg_id: req.params.kbg_id },
      include: [
        {
          model: Umat,
          attributes: ['id', 'nama_lengkap', 'nomor_induk_umat', 'jenis_kelamin']
        }
      ],
      order: [
        ['is_active', 'DESC'], // Active first
        ['createdAt', 'DESC']
      ]
    });

    res.status(200).json({ success: true, data: pengurus });
  } catch (error) {
    error.message = 'Gagal mengambil data pengurus KBG: ' + error.message;
    next(error);
  }
};

// POST /api/kbg-pengurus
exports.create = async (req, res, next) => {
  try {
    const { kbg_id, umat_id, jabatan, periode_mulai, periode_selesai, nomor_telepon, sk_url } = req.body;

    if (!kbg_id || !umat_id || !jabatan) {
      return res.status(400).json({ success: false, message: 'KBG, Umat, dan Jabatan wajib diisi.' });
    }

    // Check if umat exists
    const umat = await Umat.findByPk(umat_id);
    if (!umat) {
      return res.status(404).json({ success: false, message: 'Data umat tidak ditemukan.' });
    }

    const pengurus = await KbgPengurus.create({
      kbg_id,
      umat_id,
      jabatan,
      periode_mulai,
      periode_selesai,
      nomor_telepon,
      sk_url,
      is_active: true
    });

    res.status(201).json({ success: true, message: 'Pengurus berhasil ditambahkan.', data: pengurus });
  } catch (error) {
    error.message = 'Gagal menambahkan pengurus KBG: ' + error.message;
    next(error);
  }
};

// PUT /api/kbg-pengurus/:id
exports.update = async (req, res, next) => {
  try {
    const { jabatan, periode_mulai, periode_selesai, nomor_telepon, sk_url, is_active } = req.body;

    const pengurus = await KbgPengurus.findByPk(req.params.id);
    if (!pengurus) {
      return res.status(404).json({ success: false, message: 'Data pengurus tidak ditemukan.' });
    }

    await pengurus.update({
      jabatan,
      periode_mulai,
      periode_selesai,
      nomor_telepon,
      sk_url,
      is_active
    });

    res.status(200).json({ success: true, message: 'Data pengurus berhasil diperbarui.', data: pengurus });
  } catch (error) {
    error.message = 'Gagal memperbarui data pengurus KBG: ' + error.message;
    next(error);
  }
};

// DELETE /api/kbg-pengurus/:id
exports.delete = async (req, res, next) => {
  try {
    const pengurus = await KbgPengurus.findByPk(req.params.id);
    if (!pengurus) {
      return res.status(404).json({ success: false, message: 'Data pengurus tidak ditemukan.' });
    }

    await pengurus.destroy();

    res.status(200).json({ success: true, message: 'Data pengurus berhasil dihapus.' });
  } catch (error) {
    error.message = 'Gagal menghapus data pengurus KBG: ' + error.message;
    next(error);
  }
};
