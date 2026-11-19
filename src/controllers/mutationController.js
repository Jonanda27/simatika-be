const db = require('../../models');
const { Mutation, Umat, Family } = db;
const { Op } = require('sequelize');

exports.getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    
    const search = req.query.search || '';
    const jenis = req.query.jenis || '';

    const whereClause = {};
    if (jenis) {
      whereClause.jenis_mutasi = jenis;
    }

    const umatWhereClause = {};
    if (search) {
      umatWhereClause.nama_lengkap = { [Op.iLike]: `%${search}%` };
    }

    let kbgWhere = {};
    if (req.user) {
      if (req.user.role === 'ADMIN_STASI' && req.user.stasi_id) {
        kbgWhere.stasi_id = req.user.stasi_id;
      } else if (req.user.role === 'KETUA_KBG' && req.user.id_kbg) {
        kbgWhere.id = req.user.id_kbg;
      }
    }
    const kbgsList = await db.Kbg.findAll({ where: kbgWhere, attributes: ['id'] });
    const kbgIds = kbgsList.map(k => k.id);

    const { count, rows } = await Mutation.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Umat,
          attributes: ['id', 'nama_lengkap'],
          where: Object.keys(umatWhereClause).length > 0 ? umatWhereClause : undefined,
          required: true,
          include: [
            {
              model: Family,
              attributes: ['no_kk_paroki'],
              required: true,
              where: { kbg_id: kbgIds }
            }
          ]
        }
      ],
      order: [['tanggal_kejadian', 'DESC']],
      limit,
      offset,
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
    error.message = 'Gagal mengambil data mutasi: ' + error.message;
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const mutation = await Mutation.findByPk(req.params.id, {
      include: [
        {
          model: Umat,
          attributes: ['id', 'nama_lengkap', 'tempat_lahir', 'tanggal_lahir']
        }
      ]
    });

    if (!mutation) {
      return res.status(404).json({ success: false, message: 'Mutasi tidak ditemukan.' });
    }

    res.status(200).json({ success: true, data: mutation });
  } catch (error) {
    error.message = 'Gagal mengambil detail mutasi: ' + error.message;
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const mutation = await Mutation.findByPk(req.params.id);
    
    if (!mutation) {
      return res.status(404).json({ success: false, message: 'Mutasi tidak ditemukan.' });
    }

    await mutation.destroy();
    res.status(200).json({ success: true, message: 'Data mutasi berhasil dihapus.' });
  } catch (error) {
    error.message = 'Gagal menghapus data mutasi: ' + error.message;
    next(error);
  }
};
