'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    // 1. Create 5 Stasi
    const stasis = [
      { id: uuidv4(), kode_stasi: 'S1', nama_stasi: 'Stasi Sempan', latitude: -4.545, longitude: 136.880, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), kode_stasi: 'S2', nama_stasi: 'Stasi Katedral', latitude: -4.550, longitude: 136.890, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), kode_stasi: 'S3', nama_stasi: 'Stasi SP2', latitude: -4.560, longitude: 136.870, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), kode_stasi: 'S4', nama_stasi: 'Stasi SP3', latitude: -4.570, longitude: 136.880, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), kode_stasi: 'S5', nama_stasi: 'Stasi Kuala Kencana', latitude: -4.450, longitude: 136.900, createdAt: new Date(), updatedAt: new Date() }
    ];
    await queryInterface.bulkInsert('stasis', stasis);

    // 2. Create Users for Admin Stasi and Ketua KBG
    const users = [];
    stasis.forEach(stasi => {
      users.push({
        id: uuidv4(), username: `admin_${stasi.kode_stasi.toLowerCase()}`, password, role: 'ADMIN_STASI', stasi_id: stasi.id, createdAt: new Date(), updatedAt: new Date()
      });
    });

    // 3. Create 2 KBGs per Stasi
    const kbgsList = [];
    const kbgNames = [
      ['Imanuel', 'Mikael'],
      ['Petrus', 'Paulus'],
      ['Yohanes', 'Maria'],
      ['Lukas', 'Markus'],
      ['Matius', 'Yosef']
    ];

    stasis.forEach((stasi, stasiIndex) => {
      for (let i = 0; i < 2; i++) {
        const kbgId = uuidv4();
        const ketuaId = uuidv4();
        
        users.push({
          id: ketuaId, username: `kbg_${kbgNames[stasiIndex][i].toLowerCase()}`, password, role: 'KETUA_KBG', createdAt: new Date(), updatedAt: new Date()
        });

        kbgsList.push({
          id: kbgId,
          kode_kbg: `K${i + 1}`,
          nama_kbg: `KBG ${kbgNames[stasiIndex][i]}`,
          stasi_id: stasi.id,
          ketua_id: ketuaId,
          prefix: stasi.kode_stasi,
          lat: stasi.latitude + (Math.random() - 0.5) * 0.01,
          lng: stasi.longitude + (Math.random() - 0.5) * 0.01,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    await queryInterface.bulkInsert('users', users);

    const kbgInserts = kbgsList.map(({ id, kode_kbg, nama_kbg, stasi_id, ketua_id, lat, lng, createdAt, updatedAt }) => ({
      id, kode_kbg, nama_kbg, stasi_id, ketua_id, latitude: lat, longitude: lng, createdAt, updatedAt
    }));
    await queryInterface.bulkInsert('kbgs', kbgInserts);

    // 4. Create 5 Keluarga for each KBG
    const familiesToInsert = [];
    const umatsToInsert = [];
    const sacramentsToInsert = [];
    const mutationsToInsert = [];
    const churchActivitiesToInsert = [];
    const verificationQueuesToInsert = [];

    let kkCounter = 1;
    let umatCounter = 1;

    for (const kbg of kbgsList) {
      for (let i = 1; i <= 5; i++) {
        const familyId = uuidv4();
        
        const latOffset = (Math.random() - 0.5) * 0.005;
        const lngOffset = (Math.random() - 0.5) * 0.005;

        familiesToInsert.push({
          id: familyId,
          kbg_id: kbg.id,
          kode_unik_keluarga: `${kbg.prefix}-${kbg.kode_kbg}-K${String(i).padStart(3, '0')}`,
          no_kk_paroki: `337412345678${String(kkCounter++).padStart(4, '0')}`,
          status_rumah: i % 2 === 0 ? 'Milik' : 'Kontrak',
          foto_rumah_url: 'https://res.cloudinary.com/du3w9deid/image/upload/v1781510999/images_jmaboa.jpg',
          fasilitas_kamar_mandi: true,
          fasilitas_kamar_cuci: true,
          fasilitas_wc: true,
          pendapatan_per_bulan: Math.floor(Math.random() * 5000000) + 3000000,
          asuransi_kesehatan: 'BPJS',
          latitude: kbg.lat + latOffset,
          longitude: kbg.lng + lngOffset,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Buat 3 atau 4 anggota umat per keluarga
        const jumlahAnggota = Math.random() > 0.5 ? 4 : 3;
        const roles = ['KK', 'Istri', 'Anak', 'Anak'];
        const listNamaAnak = ['Yohanes', 'Maria', 'Petrus', 'Fransiskus', 'Klara', 'Agnes', 'Antonius', 'Lusia', 'Stefanus'];
        const listNamaBapak = ['Stefanus', 'Ignasius', 'Paulus', 'Mikael', 'Gabriel', 'Budi', 'Joko'];
        const listNamaIbu = ['Theresia', 'Katarina', 'Siti', 'Yuliana', 'Marta', 'Elisabeth', 'Anna'];
        const listMarga = ['Magai', 'Pigai', 'Adii', 'Dogopia', 'Degei', 'Boma', 'Pakage', 'Pekei', 'Yeimo'];
        const famKeluarga = listMarga[Math.floor(Math.random() * listMarga.length)];

        for (let j = 0; j < jumlahAnggota; j++) {
          let nama;
          const randomBapak = listNamaBapak[Math.floor(Math.random() * listNamaBapak.length)];
          const randomIbu = listNamaIbu[Math.floor(Math.random() * listNamaIbu.length)];
          const randomAnak = listNamaAnak[Math.floor(Math.random() * listNamaAnak.length)];
          
          if (j === 0) nama = `${randomBapak} ${famKeluarga}`;
          else if (j === 1) nama = `${randomIbu} ${famKeluarga}`;
          else nama = `${randomAnak} ${famKeluarga}`;

          const umatId = uuidv4();
          const jenisKelamin = j === 1 ? 'P' : (j === 0 ? 'L' : (Math.random() > 0.5 ? 'L' : 'P'));

          umatsToInsert.push({
            id: umatId,
            family_id: familyId,
            nomor_induk_umat: `${kbg.prefix}-${kbg.kode_kbg}-U${String(umatCounter++).padStart(3, '0')}`,
            nama_lengkap: nama.toUpperCase(),
            fam: famKeluarga,
            tempat_lahir: 'Timika',
            tanggal_lahir: `19${80 + j * 5}-01-01`,
            jenis_kelamin: jenisKelamin,
            status_dalam_keluarga: roles[j],
            pekerjaan: j >= 2 ? 'Pelajar' : 'Wiraswasta',
            suku: 'Papua',
            pendidikan_terakhir: j >= 2 ? 'SD' : 'SMA',
            status_kesehatan: 'Normal',
            createdAt: new Date(),
            updatedAt: new Date()
          });

          // Insert Sacrament (Baptis for all, Komuni/Krisma for parents)
          sacramentsToInsert.push({
            id: uuidv4(),
            umat_id: umatId,
            jenis_sakramen: 'Baptis',
            nomor_surat: `BPT/${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
            tanggal_penerimaan: `19${81 + j * 5}-05-05`,
            tempat_pelaksanaan: 'Gereja Katedral Timika',
            nama_pastor: 'P. Yohanes',
            createdAt: new Date(),
            updatedAt: new Date()
          });

          if (j < 2) {
            sacramentsToInsert.push({
              id: uuidv4(),
              umat_id: umatId,
              jenis_sakramen: 'Perkawinan',
              nomor_surat: `PKW/${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
              tanggal_penerimaan: `2005-08-15`,
              tempat_pelaksanaan: 'Gereja Katedral Timika',
              nama_pastor: 'P. Stefanus',
              createdAt: new Date(),
              updatedAt: new Date()
            });

            // Insert Church Activity untuk orang tua
            churchActivitiesToInsert.push({
              id: uuidv4(),
              umat_id: umatId,
              frekuensi_misa: Math.random() > 0.5 ? 'Mingguan' : 'Harian',
              keaktifan_organisasi: 'Legio Maria',
              petugas_liturgi: j === 0 ? 'Prodiakon' : 'Lektor',
              riwayat_kursus: JSON.stringify(['KEP', 'KPP']),
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }

          // Tambahkan mutasi secara acak (sekitar 10% umat mengalami mutasi)
          if (Math.random() > 0.9) {
            const mutasiList = ['Pindah Basis', 'Pindah Stasi', 'Pindah Paroki', 'Meninggal'];
            mutationsToInsert.push({
              id: uuidv4(),
              umat_id: umatId,
              jenis_mutasi: mutasiList[Math.floor(Math.random() * mutasiList.length)],
              tanggal_kejadian: '2025-10-10',
              keterangan: 'Mutasi dummy',
              tempat_kematian: 'Rumah Sakit',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }
    }

    // Tambahkan beberapa VerificationQueue tersebar di berbagai KBG/Stasi
    const listNamaVerifikasi = ['Agustinus', 'Yoseph', 'Fransiskus', 'Ignasius', 'Mikael', 'Paulus', 'Petrus'];
    const listMargaVerifikasi = ['Degei', 'Boma', 'Pakage', 'Pekei', 'Yeimo', 'Magai', 'Pigai'];

    kbgsList.forEach((kbg, idx) => {
      // 2 data pending untuk setiap KBG
      for (let i = 0; i < 2; i++) {
        const randomNama = listNamaVerifikasi[Math.floor(Math.random() * listNamaVerifikasi.length)];
        const randomMarga = listMargaVerifikasi[Math.floor(Math.random() * listMargaVerifikasi.length)];
        
        verificationQueuesToInsert.push({
          id: uuidv4(),
          submitted_by: kbg.ketua_id,
          payload_data: JSON.stringify({ 
            type: 'ADD_KELUARGA', 
            members: [
              { nama_lengkap: `${randomNama} ${randomMarga}`, status_dalam_keluarga: 'KK' }
            ],
            kbg_id: kbg.id 
          }),
          status: i === 0 ? 'PENDING' : 'VERIFIED_STASI',
          reject_reason: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    await queryInterface.bulkInsert('families', familiesToInsert);
    await queryInterface.bulkInsert('umats', umatsToInsert);
    await queryInterface.bulkInsert('sacraments', sacramentsToInsert);
    await queryInterface.bulkInsert('church_activities', churchActivitiesToInsert);
    await queryInterface.bulkInsert('mutations', mutationsToInsert);
    await queryInterface.bulkInsert('verification_queues', verificationQueuesToInsert);

    console.log('Seeder: Berhasil membuat 5 Stasi, 10 KBG, 50 Keluarga, ~150+ Umat beserta Sakramen, Mutasi, Aktivitas, dan Verifikasi.');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('verification_queues', null, {});
    await queryInterface.bulkDelete('mutations', null, {});
    await queryInterface.bulkDelete('church_activities', null, {});
    await queryInterface.bulkDelete('sacraments', null, {});
    await queryInterface.bulkDelete('umats', null, {});
    await queryInterface.bulkDelete('families', null, {});
    await queryInterface.bulkDelete('kbgs', null, {});
    await queryInterface.bulkDelete('users', { role: ['KETUA_KBG', 'ADMIN_STASI'] }, {});
    await queryInterface.bulkDelete('stasis', null, {});
  }
};
