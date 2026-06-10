const db = require('../../models');
const { Sacrament, Umat, Family } = db;
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    
    // Search by umat name
    const search = req.query.search || '';
    // Filter by jenis sakramen
    const jenis = req.query.jenis || '';

    const whereClause = {};
    if (jenis) {
      whereClause.jenis_sakramen = jenis;
    }

    const umatWhereClause = {};
    if (search) {
      umatWhereClause.nama_lengkap = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Sacrament.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Umat,
          attributes: ['id', 'nama_lengkap'],
          where: Object.keys(umatWhereClause).length > 0 ? umatWhereClause : undefined,
          required: Object.keys(umatWhereClause).length > 0, // only inner join if searching
          include: [
            {
              model: Family,
              attributes: ['no_kk_paroki']
            }
          ]
        }
      ],
      order: [['tanggal_penerimaan', 'DESC']],
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
    console.error('Sacrament getAll Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data sakramen.', error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const sacrament = await Sacrament.findByPk(req.params.id, {
      include: [
        {
          model: Umat,
          attributes: ['id', 'nama_lengkap', 'tempat_lahir', 'tanggal_lahir']
        }
      ]
    });

    if (!sacrament) {
      return res.status(404).json({ success: false, message: 'Sakramen tidak ditemukan.' });
    }

    res.status(200).json({ success: true, data: sacrament });
  } catch (error) {
    console.error('Sacrament getById Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const sacrament = await Sacrament.findByPk(req.params.id);
    
    if (!sacrament) {
      return res.status(404).json({ success: false, message: 'Sakramen tidak ditemukan.' });
    }

    await sacrament.destroy();
    res.status(200).json({ success: true, message: 'Data sakramen berhasil dihapus.' });
  } catch (error) {
    console.error('Sacrament delete Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.', error: error.message });
  }
};
