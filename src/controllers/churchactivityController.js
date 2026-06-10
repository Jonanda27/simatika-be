const db = require('../../models');
const { ChurchActivity, Umat, Family } = db;
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    
    const search = req.query.search || '';
    const frekuensi = req.query.frekuensi || '';

    const whereClause = {};
    if (frekuensi) {
      whereClause.frekuensi_misa = frekuensi;
    }

    const umatWhereClause = {};
    if (search) {
      umatWhereClause.nama_lengkap = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await ChurchActivity.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Umat,
          attributes: ['id', 'nama_lengkap', 'jenis_kelamin'],
          where: Object.keys(umatWhereClause).length > 0 ? umatWhereClause : undefined,
          required: Object.keys(umatWhereClause).length > 0, // inner join if searching
          include: [
            {
              model: Family,
              attributes: ['no_kk_paroki']
            }
          ]
        }
      ],
      order: [['updatedAt', 'DESC']],
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
    console.error('ChurchActivity getAll Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data aktivitas.', error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const activity = await ChurchActivity.findByPk(req.params.id, {
      include: [
        {
          model: Umat,
          attributes: ['id', 'nama_lengkap', 'jenis_kelamin', 'pekerjaan']
        }
      ]
    });

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Data aktivitas tidak ditemukan.' });
    }

    res.status(200).json({ success: true, data: activity });
  } catch (error) {
    console.error('ChurchActivity getById Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const activity = await ChurchActivity.findByPk(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Data aktivitas tidak ditemukan.' });
    }

    await activity.destroy();
    res.status(200).json({ success: true, message: 'Data aktivitas berhasil dihapus.' });
  } catch (error) {
    console.error('ChurchActivity delete Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.', error: error.message });
  }
};
