'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Dapatkan user pertama sebagai penginput (Atau buat jika tidak ada)
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM users LIMIT 1;`
    );
    let submittedBy = null;
    if (users[0] && users[0].length > 0) {
      submittedBy = users[0][0].id;
    } else {
      submittedBy = uuidv4();
      const bcrypt = require('bcryptjs');
      await queryInterface.bulkInsert('users', [{
        id: submittedBy,
        username: 'pendata_kbg',
        password: bcrypt.hashSync('password123', 10),
        nama_lengkap: 'Bapak Pendata',
        role: 'Admin KBG',
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
    }

    // 2. Pastikan ada Stasi & KBG
    const stasiId = uuidv4();
    const kbgId = uuidv4();

    try {
      await queryInterface.bulkInsert('stasis', [{
        id: stasiId,
        kode_stasi: 'ST-001',
        nama_stasi: 'Stasi Santo Yosef',
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});

      await queryInterface.bulkInsert('kbgs', [{
        id: kbgId,
        nama_kbg: 'KBG Santo Petrus',
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
    } catch (e) {
      // ignore if exists
    }

    // Helper to format date as DD/MM/YYYY
    const formatDate = (date) => {
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    // 3. Generate Verification Queue Items (Draf dari Mobile)
    const queues = [];
    const famNames = ['Kogoya', 'Wenda', 'Tabuni', 'Mote', 'Magai', 'Gobai', 'Degei', 'Pakuage', 'Kayame', 'Yeimo'];

    for (let i = 0; i < 15; i++) {
      const famName = famNames[i % famNames.length];
      
      const bapakLahir = new Date(1960 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 11), Math.floor(Math.random() * 28) + 1);
      const ibuLahir = new Date(1965 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 11), Math.floor(Math.random() * 28) + 1);
      const anak1Lahir = new Date(2010 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 11), Math.floor(Math.random() * 28) + 1);
      
      const members = [
        // Bapak
        {
          nama_lengkap: `Bapak ${famName} ${i}`,
          fam: famName,
          tempat_lahir: 'Timika',
          tgl_lahir: formatDate(bapakLahir),
          jenis_kelamin: 'Laki-Laki',
          status_dalam_keluarga: 'KK',
          pekerjaan: 'Pegawai Swasta',
          suku: 'Mee',
          pendidikan_terakhir: 'SMA',
          status_kesehatan: 'Normal',
          has_baptis: true,
          baptis_no_surat: `BPT-${100+i}`,
          baptis_tempat: 'Paroki SP2',
          baptis_tgl: '10/08/1980',
          has_perkawinan: true,
          kawin_no_surat: `PKW-${200+i}`,
          kawin_tempat: 'Gereja Katedral',
          kawin_tgl: '20/08/2005',
          misa_frekuensi: i % 2 === 0 ? 'Mingguan' : 'Harian',
          keaktifan: 'Dewan Pastoral',
          petugas_liturgi: 'Lektor',
          status_hidup: 'Masih Hidup',
          status_pindah: 'Menetap'
        },
        // Ibu
        {
          nama_lengkap: `Ibu Maria ${famName} ${i}`,
          fam: famName,
          tempat_lahir: 'Nabire',
          tgl_lahir: formatDate(ibuLahir),
          jenis_kelamin: 'Perempuan',
          status_dalam_keluarga: 'Istri',
          pekerjaan: 'Ibu Rumah Tangga',
          suku: 'Mee',
          pendidikan_terakhir: 'SMP',
          status_kesehatan: 'Normal',
          has_baptis: true,
          baptis_no_surat: `BPT-${150+i}`,
          baptis_tempat: 'Paroki SP2',
          baptis_tgl: '15/09/1985',
          has_perkawinan: true,
          kawin_no_surat: `PKW-${200+i}`,
          kawin_tempat: 'Gereja Katedral',
          kawin_tgl: '20/08/2005',
          misa_frekuensi: 'Mingguan',
          status_hidup: 'Masih Hidup',
          status_pindah: i % 4 === 0 ? 'Pindah Paroki' : 'Menetap'
        },
        // Anak 1
        {
          nama_lengkap: `Anak Sulung ${famName} ${i}`,
          fam: famName,
          tempat_lahir: 'Timika',
          tgl_lahir: formatDate(anak1Lahir),
          jenis_kelamin: i % 2 === 0 ? 'Laki-Laki' : 'Perempuan',
          status_dalam_keluarga: 'Anak',
          pekerjaan: 'Pelajar',
          suku: 'Mee',
          pendidikan_terakhir: 'SD',
          status_kesehatan: 'Normal',
          has_baptis: true,
          baptis_tempat: 'Paroki SP2',
          baptis_tgl: formatDate(new Date(anak1Lahir.getTime() + 31536000000)), // baptis 1 thn stlh lahir
          misa_frekuensi: 'Mingguan',
          petugas_liturgi: 'Misdinar',
          status_hidup: 'Masih Hidup',
          status_pindah: 'Menetap'
        }
      ];

      // Anak 2
      if (i % 2 === 0) {
        const anak2Lahir = new Date(2018 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 11), Math.floor(Math.random() * 28) + 1);
        members.push({
          nama_lengkap: `Anak Bungsu ${famName} ${i}`,
          fam: famName,
          tempat_lahir: 'Timika',
          tgl_lahir: formatDate(anak2Lahir),
          jenis_kelamin: i % 3 === 0 ? 'Laki-Laki' : 'Perempuan',
          status_dalam_keluarga: 'Anak',
          pekerjaan: 'Belum Bekerja',
          suku: 'Mee',
          pendidikan_terakhir: 'TK',
          status_kesehatan: 'Normal'
        });
      }

      // Kakek
      if (i % 7 === 0) {
        const kakekLahir = new Date(1940 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 11), Math.floor(Math.random() * 28) + 1);
        members.push({
          nama_lengkap: `Kakek ${famName} ${i}`,
          fam: famName,
          tempat_lahir: 'Wamena',
          tgl_lahir: formatDate(kakekLahir),
          jenis_kelamin: 'Laki-Laki',
          status_dalam_keluarga: 'Lainnya',
          pekerjaan: 'Pensiunan',
          suku: 'Mee',
          pendidikan_terakhir: 'SD',
          status_kesehatan: 'Sakit Kronis',
          misa_frekuensi: 'Hari Raya',
          status_hidup: 'Meninggal Dunia',
          meninggal_tgl: '10/05/2026',
          meninggal_tempat: 'RSUD Mimika'
        });
      }

      const payloadData = {
        no_kk_paroki: `KKP-2026-${String(i + 1).padStart(3, '0')}`,
        status_rumah: i % 2 === 0 ? 'Milik Sendiri' : 'Kontrak/Sewa',
        has_kamar_mandi: true,
        has_kamar_cuci: true,
        has_wc: true,
        pendapatan: String(3000000 + (i * 500000)),
        asuransi: 'BPJS Kesehatan',
        lat: -4.5 + (Math.random() * 0.01),
        lng: 136.9 + (Math.random() * 0.01),
        foto_rumah_url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=400',
        members: members
      };

      queues.push({
        id: uuidv4(),
        submitted_by: submittedBy,
        payload_data: JSON.stringify(payloadData),
        status: 'PENDING',
        reject_reason: null,
        // Acak tanggal input agar terlihat dinamis di queue
        createdAt: new Date(new Date().setHours(new Date().getHours() - (i * 5))),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('verification_queues', queues, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('verification_queues', null, {});
    await queryInterface.bulkDelete('kbgs', null, {});
    await queryInterface.bulkDelete('stasis', null, {});
  }
};
