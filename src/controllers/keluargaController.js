const db = require('../../models');
const { Family, Umat, Sacrament, Kbg } = db;
const { Op } = require('sequelize');

// GET /api/keluarga?page=1&limit=15&search=
exports.getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const familyWhere = {};

    if (req.query.is_non_stasi === 'true') {
      familyWhere.is_non_stasi = true;
    }

    // Search by no_kk_paroki, kode_unik_keluarga, or matching Umat
    if (search) {
      const { Umat: UmatModel } = require('../../models');
      const matchingUmats = await UmatModel.findAll({
        where: { nomor_induk_umat: { [Op.iLike]: `%${search}%` } },
        attributes: ['family_id']
      });
      const familyIdsFromUmat = matchingUmats.map(u => u.family_id).filter(id => id);

      familyWhere[Op.or] = [
        { no_kk_paroki: { [Op.iLike]: `%${search}%` } },
        { kode_unik_keluarga: { [Op.iLike]: `%${search}%` } }
      ];

      if (familyIdsFromUmat.length > 0) {
        familyWhere[Op.or].push({ id: { [Op.in]: familyIdsFromUmat } });
      }
    }

    // Role-based filtering
    if (req.user && req.user.role === 'ADMIN_STASI') {
      const { Kbg } = require('../../models');
      if (req.user.stasi_id) {
        const kbgs = await Kbg.findAll({ where: { stasi_id: req.user.stasi_id } });
        const kbgIds = kbgs.map(k => k.id);
        if (kbgIds.length > 0) {
          familyWhere.kbg_id = { [Op.in]: kbgIds };
        } else {
          familyWhere.kbg_id = null; // No KBGs found in this Stasi
        }
      } else {
        familyWhere.kbg_id = null; // No Stasi assigned
      }
    } else if (req.user && req.user.role === 'KETUA_KBG') {
      const { Kbg } = require('../../models');
      const kbg = await Kbg.findOne({ where: { ketua_id: req.user.id } });
      if (kbg) {
        familyWhere.kbg_id = kbg.id;
      } else {
        familyWhere.kbg_id = null; // No KBG assigned
      }
    }

    const { count, rows } = await Family.findAndCountAll({
      where: familyWhere,
      include: [
        {
          model: Kbg,
          attributes: ['id', 'nama_kbg', 'stasi_id'],
          required: false,
        },
        {
          model: Umat,
          attributes: ['id', 'nama_lengkap', 'nomor_induk_umat', 'status_dalam_keluarga', 'jenis_kelamin', 'tanggal_lahir', 'pekerjaan'],
          required: false,
          include: [
            {
              model: Sacrament,
              attributes: ['id', 'jenis_sakramen', 'sertifikat_url'],
              required: false,
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        limit,
      }
    });
  } catch (error) {
    error.message = 'Gagal mengambil data keluarga: ' + error.message;
    next(error);
  }
};

// GET /api/keluarga/public/search?q=
exports.publicSearch = async (req, res, next) => {
  try {
    const search = req.query.q || '';
    if (!search || search.trim() === '') {
      return res.status(400).json({ success: false, message: 'Keyword pencarian tidak boleh kosong.' });
    }

    const { Umat: UmatModel } = require('../../models');
    const matchingUmats = await UmatModel.findAll({
      where: { nomor_induk_umat: search },
      attributes: ['family_id']
    });
    const familyIdsFromUmat = matchingUmats.map(u => u.family_id).filter(id => id);

    const familyWhere = {
      [Op.or]: [
        { no_kk_paroki: search },
        { kode_unik_keluarga: search }
      ]
    };

    if (familyIdsFromUmat.length > 0) {
      familyWhere[Op.or].push({ id: { [Op.in]: familyIdsFromUmat } });
    }

    const families = await Family.findAll({
      where: familyWhere,
      include: [
        {
          model: Kbg,
          attributes: ['id', 'nama_kbg', 'stasi_id'],
          required: false,
        },
        {
          model: Umat,
          attributes: ['id', 'nama_lengkap', 'nomor_induk_umat', 'status_dalam_keluarga', 'jenis_kelamin', 'tanggal_lahir', 'pekerjaan'],
          required: false,
        }
      ],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: families
    });
  } catch (error) {
    error.message = 'Gagal melakukan pencarian publik: ' + error.message;
    next(error);
  }
};

// GET /api/keluarga/:id
exports.getById = async (req, res, next) => {
  try {
    const keluarga = await Family.findByPk(req.params.id, {
      include: [
        {
          model: Kbg,
          attributes: ['id', 'nama_kbg', 'stasi_id'],
          required: false,
        },
        {
          model: Umat,
          attributes: ['id', 'nama_lengkap', 'nomor_induk_umat', 'fam', 'status_dalam_keluarga', 'jenis_kelamin', 'tanggal_lahir', 'pekerjaan', 'pendidikan_terakhir', 'suku', 'status_kesehatan'],
          required: false,
        }
      ]
    });

    if (!keluarga) {
      return res.status(404).json({ success: false, message: 'Keluarga tidak ditemukan.' });
    }

    res.status(200).json({ success: true, data: keluarga });
  } catch (error) {
    error.message = 'Gagal mengambil detail keluarga: ' + error.message;
    next(error);
  }
};

// DELETE /api/keluarga/:id
exports.delete = async (req, res, next) => {
  try {
    const keluarga = await Family.findByPk(req.params.id);
    if (!keluarga) {
      return res.status(404).json({ success: false, message: 'Keluarga tidak ditemukan.' });
    }
    await keluarga.destroy();
    res.status(200).json({ success: true, message: 'Data keluarga berhasil dihapus.' });
  } catch (error) {
    error.message = 'Gagal menghapus data keluarga: ' + error.message;
    next(error);
  }
};
