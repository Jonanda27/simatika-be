const db = require('../../models');
const { Umat, Family, Sacrament, Stasi, Mutation, ChurchActivity, Op } = db;
const { Op: SequelizeOp } = require('sequelize');

// GET /api/umat?page=1&limit=10&search=&jk=&status=
exports.getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const jk = req.query.jk || '';

    const whereClause = {};
    if (search) {
      whereClause.nama_lengkap = { [SequelizeOp.iLike]: `%${search}%` };
    }
    if (jk && (jk === 'L' || jk === 'P')) {
      whereClause.jenis_kelamin = jk;
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

    let familyWhere = { kbg_id: kbgIds };
    if (req.query.kbg_id) {
      familyWhere.kbg_id = req.query.kbg_id;
    }

    const { count, rows } = await Umat.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Family,
          attributes: ['id', 'no_kk_paroki', 'status_rumah', 'pendapatan_per_bulan', 'kbg_id'],
          required: true,
          where: familyWhere,
        },
        {
          model: Sacrament,
          attributes: ['id', 'jenis_sakramen', 'nomor_surat', 'tanggal_penerimaan', 'tempat_pelaksanaan', 'nama_pastor', 'nama_wali_saksi', 'sertifikat_url'],
          required: false,
        },
        {
          model: Mutation,
          attributes: ['id', 'jenis_mutasi', 'tanggal_kejadian', 'tempat_kematian', 'keterangan'],
          required: false,
          limit: 1,
          order: [['tanggal_kejadian', 'DESC']],
        }
      ],
      order: [['nama_lengkap', 'ASC']],
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
    error.message = 'Gagal mengambil data umat: ' + error.message;
    next(error);
  }
};

// GET /api/umat/:id
exports.getById = async (req, res, next) => {
  try {
    const umat = await Umat.findByPk(req.params.id, {
      include: [
        {
          model: Family,
          attributes: ['id', 'kode_unik_keluarga', 'no_kk_paroki', 'status_rumah', 'pendapatan_per_bulan', 'asuransi_kesehatan', 'fasilitas_kamar_mandi', 'fasilitas_kamar_cuci', 'fasilitas_wc', 'foto_rumah_url', 'latitude', 'longitude'],
          required: false,
        },
        {
          model: Sacrament,
          attributes: ['id', 'jenis_sakramen', 'nomor_surat', 'tanggal_penerimaan', 'tempat_pelaksanaan', 'nama_pastor', 'nama_wali_saksi', 'sertifikat_url'],
          required: false,
        },
        {
          model: ChurchActivity,
          required: false,
        },
        {
          model: Mutation,
          attributes: ['id', 'jenis_mutasi', 'tanggal_kejadian', 'tempat_kematian', 'keterangan'],
          required: false,
        }
      ]
    });

    if (!umat) {
      return res.status(404).json({ success: false, message: 'Umat tidak ditemukan.' });
    }

    res.status(200).json({ success: true, data: umat });
  } catch (error) {
    error.message = 'Gagal mengambil detail umat: ' + error.message;
    next(error);
  }
};

// DELETE /api/umat/:id
exports.delete = async (req, res, next) => {
  try {
    const umat = await Umat.findByPk(req.params.id);
    if (!umat) {
      return res.status(404).json({ success: false, message: 'Umat tidak ditemukan.' });
    }
    await umat.destroy();
    res.status(200).json({ success: true, message: 'Data umat berhasil dihapus.' });
  } catch (error) {
    error.message = 'Gagal menghapus data umat: ' + error.message;
    next(error);
  }
};
