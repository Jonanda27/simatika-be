const db = require('../../models');
const { Umat, Family, Sacrament } = db;

exports.getStats = async (req, res, next) => {
  try {
    // 1. Total Umat
    const totalUmat = await Umat.count();

    // 2. Total Keluarga
    const totalKeluarga = await Family.count();

    // 3. Sakramen Baptis
    const sakramenBaptis = await Sacrament.count({
      where: { jenis_sakramen: 'Baptis' }
    });

    // 4. Sakramen Perkawinan
    const sakramenNikah = await Sacrament.count({
      where: { jenis_sakramen: 'Perkawinan' }
    });

    // 5. Kalkulasi Komposisi Umur (Anak: 0-17, Dewasa: 18-59, Lansia: 60+)
    const umats = await Umat.findAll({
      attributes: ['tanggal_lahir', 'createdAt']
    });

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
        grafikUmat
      }
    });

  } catch (error) {
    error.message = 'Gagal memuat statistik dashboard: ' + error.message;
    next(error);
  }
};
