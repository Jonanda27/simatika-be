const db = require('../../models');
const { Family, Umat } = db;
const { Op } = require('sequelize');

// GET /api/keluarga?page=1&limit=15&search=
exports.getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const familyWhere = {};

    // Search by no_kk_paroki
    if (search) {
      familyWhere.no_kk_paroki = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Family.findAndCountAll({
      where: familyWhere,
      include: [
        {
          model: Umat,
          attributes: ['id', 'nama_lengkap', 'status_dalam_keluarga', 'jenis_kelamin', 'tanggal_lahir', 'pekerjaan'],
          required: false,
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
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

// GET /api/keluarga/:id
exports.getById = async (req, res, next) => {
  try {
    const keluarga = await Family.findByPk(req.params.id, {
      include: [
        {
          model: Umat,
          attributes: ['id', 'nama_lengkap', 'fam', 'status_dalam_keluarga', 'jenis_kelamin', 'tanggal_lahir', 'pekerjaan', 'pendidikan_terakhir', 'suku', 'status_kesehatan'],
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
