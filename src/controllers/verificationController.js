const { Family, Umat, Sacrament, ChurchActivity, Mutation, sequelize, VerificationQueue, User } = require('../../models');

// Helper to convert DD/MM/YYYY to YYYY-MM-DD
const parseDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return null;
};

// GET /api/verification?status=PENDING
exports.getQueue = async (req, res) => {
  try {
    const { status } = req.query;
    
    // In a real app, you'd filter by role/Stasi/Paroki here
    // For now, return all based on status query
    const queues = await VerificationQueue.findAll({
      where: status ? { status } : {},
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ success: true, data: queues });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data verifikasi.', error: error.message });
  }
};

// GET /api/verification/my-submissions
exports.getMySubmissions = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const queues = await VerificationQueue.findAll({
      where: { submitted_by: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ success: true, data: queues });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat submit.', error: error.message });
  }
};

// POST /api/verification/:id/verify-stasi
exports.verifyStasi = async (req, res) => {
  try {
    const queue = await VerificationQueue.findByPk(req.params.id);
    if (!queue) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });

    if (queue.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Hanya data PENDING yang dapat diverifikasi oleh Stasi.' });
    }

    queue.status = 'VERIFIED_STASI';
    await queue.save();

    res.status(200).json({ success: true, message: 'Data berhasil diverifikasi oleh Stasi.', data: queue });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memverifikasi data.', error: error.message });
  }
};

// POST /api/verification/:id/approve-paroki
exports.approveParoki = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const queue = await VerificationQueue.findByPk(req.params.id);
    if (!queue) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    }

    if (queue.status !== 'VERIFIED_STASI') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Data harus diverifikasi oleh Stasi terlebih dahulu.' });
    }

    const data = queue.payload_data;

    // --- LOGIKA INSERT ASLI ---
    let mappedStatus = data.status_rumah || null;
    if (mappedStatus === 'Milik Sendiri') mappedStatus = 'Milik';
    else if (mappedStatus === 'Kontrak/Sewa') mappedStatus = 'Kontrak';

    // 1. Create Family
    const familyData = {
      no_kk_paroki: data.no_kk_paroki || null,
      status_rumah: mappedStatus,
      fasilitas_kamar_mandi: data.has_kamar_mandi === true,
      fasilitas_kamar_cuci: data.has_kamar_cuci === true,
      fasilitas_wc: data.has_wc === true,
      pendapatan_per_bulan: data.pendapatan ? parseInt(data.pendapatan.replace(/\D/g, '')) || null : null,
      asuransi_kesehatan: data.asuransi || null,
      latitude: data.lat || null,
      longitude: data.lng || null
    };

    const newFamily = await Family.create(familyData, { transaction });

    // 2. Loop Members
    const members = data.members || [];
    for (const member of members) {
      const tglLahir = parseDate(member.tgl_lahir);
      let jk = null;
      if (member.jenis_kelamin === 'Laki-Laki') jk = 'L';
      if (member.jenis_kelamin === 'Perempuan') jk = 'P';

      const umatData = {
        family_id: newFamily.id,
        nama_lengkap: member.nama_lengkap || null,
        fam: member.fam || null,
        tempat_lahir: member.tempat_lahir || null,
        tanggal_lahir: tglLahir,
        jenis_kelamin: jk,
        status_dalam_keluarga: member.status_dalam_keluarga || null,
        pekerjaan: member.pekerjaan || null,
        suku: member.suku || null,
        pendidikan_terakhir: member.pendidikan_terakhir || null,
        status_kesehatan: member.status_kesehatan || 'Normal',
        kode_numpang: member.kode_numpang || null
      };

      const newUmat = await Umat.create(umatData, { transaction });

      // 3. Sacraments
      if (member.has_baptis) {
        await Sacrament.create({
          umat_id: newUmat.id,
          jenis_sakramen: 'Baptis',
          nomor_surat: member.baptis_no_surat || null,
          tempat: member.baptis_tempat || null,
          tanggal: parseDate(member.baptis_tgl),
          nama_pastor: member.baptis_pastor || null,
          nama_wali: member.baptis_wali || null
        }, { transaction });
      }
      if (member.has_komuni) {
        await Sacrament.create({
          umat_id: newUmat.id,
          jenis_sakramen: 'Komuni Pertama',
          tempat: member.komuni_tempat || null,
          tanggal: parseDate(member.komuni_tgl),
        }, { transaction });
      }
      if (member.has_krisma) {
        await Sacrament.create({
          umat_id: newUmat.id,
          jenis_sakramen: 'Krisma',
          nomor_surat: member.krisma_no_surat || null,
          tempat: member.krisma_tempat || null,
          tanggal: parseDate(member.krisma_tgl),
          nama_pastor: member.krisma_pastor || null,
          nama_wali: member.krisma_wali || null
        }, { transaction });
      }
      if (member.has_perkawinan) {
        await Sacrament.create({
          umat_id: newUmat.id,
          jenis_sakramen: 'Perkawinan',
          nomor_surat: member.kawin_no_surat || null,
          tempat: member.kawin_tempat || null,
          tanggal: parseDate(member.kawin_tgl),
          nama_pastor: member.kawin_pastor || null,
        }, { transaction });
      }

      // 4. Church Activity
      if (member.misa_frekuensi || member.keaktifan || member.petugas_liturgi) {
        await ChurchActivity.create({
          umat_id: newUmat.id,
          frekuensi_misa: member.misa_frekuensi || null,
          keaktifan: member.keaktifan || null,
          petugas_liturgi: member.petugas_liturgi || null,
          riwayat_kursus: member.kursus_pastoral || null
        }, { transaction });
      }

      // 5. Mutation (Kematian/Pindah)
      if (member.status_hidup === 'Meninggal Dunia') {
        await Mutation.create({
          umat_id: newUmat.id,
          jenis_mutasi: 'Meninggal',
          tujuan: null,
          alasan: member.meninggal_tempat || null,
          tanggal_mutasi: parseDate(member.meninggal_tgl)
        }, { transaction });
      } else if (member.status_pindah && member.status_pindah !== 'Menetap') {
         await Mutation.create({
          umat_id: newUmat.id,
          jenis_mutasi: member.status_pindah,
          tujuan: null,
          alasan: null,
          tanggal_mutasi: new Date()
        }, { transaction });
      }
    }

    // --- END LOGIKA INSERT ASLI ---

    // Update status queue
    queue.status = 'APPROVED_PAROKI';
    await queue.save({ transaction });

    await transaction.commit();
    res.status(200).json({ success: true, message: 'Data disetujui Paroki dan berhasil masuk ke Database.' });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error in approveParoki:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses persetujuan.', error: error.message });
  }
};

// POST /api/verification/:id/reject
exports.rejectData = async (req, res) => {
  try {
    const queue = await VerificationQueue.findByPk(req.params.id);
    if (!queue) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });

    const { reject_reason } = req.body;

    queue.status = 'REJECTED';
    queue.reject_reason = reject_reason || 'Ditolak tanpa alasan.';
    await queue.save();

    res.status(200).json({ success: true, message: 'Data berhasil ditolak.', data: queue });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menolak data.', error: error.message });
  }
};
