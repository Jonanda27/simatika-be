const db = require('../../models');
const { Umat, Family, Sacrament, Mutation, ChurchActivity, Kbg, Stasi } = db;

exports.getStats = async (req, res, next) => {
  try {
    let kbgWhere = {};

    if (req.user) {
      if (req.user.role === 'ADMIN_STASI' && req.user.stasi_id) {
        kbgWhere.stasi_id = req.user.stasi_id;
      } else if (req.user.role === 'KETUA_KBG' && req.user.id_kbg) {
        kbgWhere.id = req.user.id_kbg;
      }
    }

    // Ambil semua KBG yang relevan
    const kbgsList = await Kbg.findAll({ where: kbgWhere, attributes: ['id'] });
    const kbgIds = kbgsList.map(k => k.id);

    // Ambil semua Keluarga yang relevan
    const familiesList = await Family.findAll({ where: { kbg_id: kbgIds }, attributes: ['id'] });
    const familyIds = familiesList.map(f => f.id);

    // Ambil semua Umat yang relevan
    const umatWhere = { family_id: familyIds };
    const umatsList = await Umat.findAll({ where: umatWhere, attributes: ['id', 'tanggal_lahir', 'createdAt'] });
    const umatIds = umatsList.map(u => u.id);

    // 1. Total Umat
    const totalUmat = umatIds.length;

    // 2. Total Keluarga
    const totalKeluarga = familyIds.length;

    // 3. Sakramen Baptis
    const sakramenBaptis = await Sacrament.count({
      where: { jenis_sakramen: 'Baptis', umat_id: umatIds }
    });

    // 4. Sakramen Perkawinan
    const sakramenNikah = await Sacrament.count({
      where: { jenis_sakramen: 'Perkawinan', umat_id: umatIds }
    });

    // 5. Kalkulasi Komposisi Umur (Anak: 0-17, Dewasa: 18-59, Lansia: 60+)
    const umats = umatsList;

    let anak = 0;
    let dewasa = 0;
    let lansia = 0;

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth(); // 0-based

    const umatPerMonth = new Array(12).fill(0);
    let initialTotal = 0;

    umats.forEach((umat) => {
      // Hitung komposisi umur
      if (umat.tanggal_lahir) {
        const birthYear = new Date(umat.tanggal_lahir).getFullYear();
        const age = currentYear - birthYear;

        if (age <= 17) {
          anak++;
        } else if (age >= 18 && age <= 59) {
          dewasa++;
        } else {
          lansia++;
        }
      }

      // Hitung data per bulan
      if (umat.createdAt) {
        const createdDate = new Date(umat.createdAt);
        if (createdDate.getFullYear() < currentYear) {
          initialTotal++;
        } else if (createdDate.getFullYear() === currentYear) {
          umatPerMonth[createdDate.getMonth()]++;
        }
      }
    });

    const komposisiUmur = [
      { name: 'Anak (0-17 th)', value: anak, color: '#3b82f6' },
      { name: 'Dewasa (18-59 th)', value: dewasa, color: '#10b981' },
      { name: 'Lansia (60+ th)', value: lansia, color: '#f59e0b' }
    ];

    // 6. Grafik Umat — Akumulasi pertumbuhan data aktual
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const grafikUmat = [];
    let cumulative = initialTotal;
    
    // Tampilkan hingga bulan saat ini
    for (let i = 0; i <= currentMonthIndex; i++) {
      cumulative += umatPerMonth[i];
      grafikUmat.push({
        name: months[i],
        umat: cumulative
      });
    }

    // 7. Statistik Mutasi Umat
    const mutasiData = await Mutation.findAll({
      attributes: ['jenis_mutasi', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total']],
      where: { umat_id: umatIds },
      group: ['jenis_mutasi']
    });
    
    // Pastikan warna konsisten dengan jenis_mutasi
    const mutasiColors = {
      'Pindah Basis': '#3b82f6',
      'Pindah Stasi': '#10b981',
      'Pindah Paroki': '#f59e0b',
      'Pindah Dekenat': '#8b5cf6',
      'Pindah Keuskupan': '#6366f1',
      'Meninggal': '#ef4444'
    };
    
    const statistikMutasi = mutasiData.map(m => ({
      name: m.jenis_mutasi || 'Lainnya',
      value: parseInt(m.dataValues.total, 10),
      color: mutasiColors[m.jenis_mutasi] || '#94a3b8'
    }));

    // 8. Keaktifan Pastoral
    const pastoralData = await ChurchActivity.findAll({
      attributes: ['frekuensi_misa', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total']],
      where: { umat_id: umatIds },
      group: ['frekuensi_misa']
    });

    const pastoralColors = {
      'Harian': '#10b981',
      'Mingguan': '#3b82f6',
      'Hari Raya': '#f59e0b'
    };

    const keaktifanPastoral = pastoralData.map(p => ({
      name: p.frekuensi_misa || 'Lainnya',
      value: parseInt(p.dataValues.total, 10),
      color: pastoralColors[p.frekuensi_misa] || '#94a3b8'
    }));

    let petaSebaran = [];

    if (req.user && req.user.role === 'KETUA_KBG') {
      const families = await Family.findAll({
        attributes: ['id', 'no_kk_paroki', 'latitude', 'longitude', 'is_non_stasi'],
        where: {
          kbg_id: kbgIds,
          latitude: { [db.Sequelize.Op.ne]: null },
          longitude: { [db.Sequelize.Op.ne]: null }
        },
        include: [
          { model: Umat, attributes: ['nama_lengkap'], where: { status_dalam_keluarga: 'KK' }, required: false },
          { model: Kbg, attributes: ['stasi_id'], required: false }
        ]
      });

      petaSebaran = families.map(f => {
        let name = f.no_kk_paroki ? `Keluarga ${f.no_kk_paroki}` : 'Keluarga';
        if (f.Umats && f.Umats.length > 0) {
          name = `Keluarga ${f.Umats[0].nama_lengkap}`;
        }
        return {
          id: f.id,
          name: name,
          lat: parseFloat(f.latitude),
          lng: parseFloat(f.longitude),
          is_family: true,
          has_stasi: !f.is_non_stasi && !!f.Kbg?.stasi_id
        };
      });
    } else if (req.user && req.user.role === 'ADMIN_STASI') {
      const kbgs = await Kbg.findAll({
        attributes: ['id', 'nama_kbg', 'latitude', 'longitude'],
        where: {
          id: kbgIds,
          latitude: { [db.Sequelize.Op.ne]: null },
          longitude: { [db.Sequelize.Op.ne]: null }
        }
      });

      petaSebaran = kbgs.map(kbg => ({
        id: kbg.id,
        name: kbg.nama_kbg,
        lat: parseFloat(kbg.latitude),
        lng: parseFloat(kbg.longitude)
      }));
    } else {
      const stasis = await Stasi.findAll({
        attributes: ['id', 'nama_stasi', 'latitude', 'longitude'],
        where: {
          latitude: { [db.Sequelize.Op.ne]: null },
          longitude: { [db.Sequelize.Op.ne]: null }
        }
      });

      petaSebaran = stasis.map(s => ({
        id: s.id,
        name: s.nama_stasi,
        lat: parseFloat(s.latitude),
        lng: parseFloat(s.longitude)
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          totalUmat,
          totalKeluarga,
          sakramenBaptis,
          sakramenNikah
        },
        komposisiUmur,
        grafikUmat,
        statistikMutasi,
        keaktifanPastoral,
        petaSebaran
      }
    });

  } catch (error) {
    error.message = 'Gagal memuat statistik dashboard: ' + error.message;
    next(error);
  }
};
