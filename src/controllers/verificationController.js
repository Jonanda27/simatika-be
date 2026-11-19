const { Family, Umat, Sacrament, ChurchActivity, Mutation, sequelize, VerificationQueue, User, KbgPengurus } = require('../../models');

// Helper to convert DD/MM/YYYY to YYYY-MM-DD, and also support YYYY-MM-DD natively
const parseDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  if (dateStr.includes('-')) {
    // If it's already YYYY-MM-DD or DD-MM-YYYY
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return dateStr; // Already YYYY-MM-DD
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert DD-MM-YYYY to YYYY-MM-DD
    }
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[0]}-${parts[1]}-${parts[2]}`;
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  
  return null;
};

// GET /api/verification?status=PENDING
exports.getQueue = async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = status ? { status } : {};

    // Filter berdasarkan role
    if (req.user && req.user.role === 'ADMIN_STASI') {
      if (!req.user.stasi_id) {
        return res.status(403).json({ success: false, message: 'Admin Stasi tidak memiliki referensi Stasi yang valid.' });
      }
      
      const { Kbg } = require('../../models');
      const kbgs = await Kbg.findAll({ where: { stasi_id: req.user.stasi_id } });
      const kbgIds = kbgs.map(kbg => kbg.id);
      const ketuaIds = kbgs.map(kbg => kbg.ketua_id).filter(id => id);

      if (kbgs.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }

      const { Op } = require('sequelize');
      const conditions = [];
      if (kbgIds.length > 0) {
        conditions.push(sequelize.literal(`payload_data->>'target_kbg_id' IN (${kbgIds.map(id => `'${id}'`).join(',')})`));
      }
      if (ketuaIds.length > 0) {
        // Fallback for old data
        conditions.push({ submitted_by: { [Op.in]: ketuaIds } });
      }

      if (conditions.length > 0) {
        whereClause[Op.or] = conditions;
      }
    } else if (req.user && req.user.role === 'KETUA_KBG') {
      whereClause.submitted_by = req.user.id;
    }

    const queues = await VerificationQueue.findAll({
      where: whereClause,
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

// GET /api/verification/:id
exports.getById = async (req, res) => {
  try {
    const queue = await VerificationQueue.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'role']
        }
      ]
    });
    if (!queue) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    
    res.status(200).json({ success: true, data: queue });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil detail verifikasi.', error: error.message });
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

    const data = queue.payload_data;

    const hasStasi = data?.punya_stasi !== false;
    if (hasStasi && queue.status !== 'VERIFIED_STASI' && data?.type !== 'KEPENGURUSAN') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Data Sensus harus diverifikasi oleh Stasi terlebih dahulu.' });
    }

    // --- LOGIKA INSERT ---
    if (data?.type === 'KEPENGURUSAN') {
      const { Kbg } = require('../../models');
      let finalKbgId = data.kbg_id;
      
      // Fallback: Jika frontend mengirim null (misalnya karena session lama), cari KBG milik submitter
      if (!finalKbgId && queue.submitted_by) {
        const kbgSearch = await Kbg.findOne({ where: { ketua_id: queue.submitted_by }, transaction });
        if (kbgSearch) finalKbgId = kbgSearch.id;
      }

      // Non-aktifkan pengurus aktif saat ini (Snapshot & Replace)
      if (finalKbgId) {
        await KbgPengurus.update(
          { is_active: false },
          { where: { kbg_id: finalKbgId, is_active: true }, transaction }
        );
      }

      // 1. Logika untuk Data Pengurus KBG
      if (data.pengurus && data.pengurus.length > 0) {
        for (const p of data.pengurus) {
          await KbgPengurus.create({
            kbg_id: finalKbgId || null,
            umat_id: p.umat_id || null, // null jika pastor/manual
            nama_manual: p.nama || null,
            jabatan: p.jabatan,
            periode_mulai: data.periode_mulai,
            periode_selesai: data.periode_selesai,
            nomor_telepon: p.telepon || null,
            sk_url: data.sk_url || null,
            is_active: true
          }, { transaction });
        }
      }
    } else {
    // --- AMBIL PREFIX UNTUK AUTO-GENERATE ID ---
    const { Kbg, Stasi } = require('../../models');
    let prefix = 'P1-XXX';
    let targetKbgId = data.target_kbg_id || data.kbg_id || null;
    
    if (data.punya_stasi === false) {
      // Jika tidak punya stasi, assign ke KBG penginput (submitter)
      const kbgSearch = await Kbg.findOne({ where: { ketua_id: queue.submitted_by }, transaction });
      if (kbgSearch) targetKbgId = kbgSearch.id;
    } else if (!targetKbgId && queue.submitted_by) {
      const kbgSearch = await Kbg.findOne({ where: { ketua_id: queue.submitted_by }, transaction });
      if (kbgSearch) targetKbgId = kbgSearch.id;
    }

    if (targetKbgId) {
      const kbgData = await Kbg.findByPk(targetKbgId, { include: [{ model: Stasi }], transaction });
      if (kbgData) {
        if (data.punya_stasi === false) {
          prefix = `P1-${kbgData.kode_kbg}`;
        } else if (kbgData.Stasi) {
          prefix = `${kbgData.Stasi.kode_stasi}-${kbgData.kode_kbg}`;
        } else {
          prefix = `P1-${kbgData.kode_kbg}`; // Fallback jika KBG tersebut tidak memiliki Stasi
        }
      }
    }

    // 2. Logika Asli untuk Sensus Umat (Keluarga)
    let mappedStatus = data.status_rumah || null;
    if (mappedStatus === 'Milik Sendiri') mappedStatus = 'Milik';
    else if (mappedStatus === 'Kontrak/Sewa') mappedStatus = 'Kontrak';

    // Count family to generate kode_unik_keluarga
    let autoKodeKeluarga = data.kode_unik_keluarga || null;
    if (!data.existing_family_id) {
      let countOptions = { transaction };
      if (targetKbgId) countOptions.where = { kbg_id: targetKbgId };
      else countOptions.where = { kbg_id: null };
      
      const familyCount = await Family.count(countOptions);
      const noUrutKel = (familyCount + 1).toString().padStart(3, '0');
      autoKodeKeluarga = `${prefix}-K${noUrutKel}`;
    }

    // Extract Pendapatan and Asuransi from KK
    let pendapatanVal = null;
    let asuransiVal = null;
    if (data.members && data.members.length > 0) {
      const kk = data.members.find(m => m.status_dalam_keluarga === 'Kepala Keluarga' || m.status_dalam_keluarga === 'KK' || m.status_keluarga === 'Kepala Keluarga' || m.status_keluarga === 'KK') || data.members[0];
      if (kk) {
        pendapatanVal = kk.pendapatan || data.pendapatan || null;
        asuransiVal = kk.asuransi || data.asuransi || null;
      }
    } else {
      pendapatanVal = data.pendapatan || null;
      asuransiVal = data.asuransi || null;
    }

    const familyData = {
      kbg_id: targetKbgId,
      kode_unik_keluarga: autoKodeKeluarga,
      no_kk_paroki: data.no_kk_paroki || null,
      kk_url: data.kk_url || null,
      foto_rumah_url: data.foto_rumah_url || null,
      status_rumah: mappedStatus,
      status_numpang: data.status_numpang || 'Keluarga Utama',
      fasilitas_kamar_mandi: data.fasilitas_kamar_mandi === true || data.has_kamar_mandi === true,
      fasilitas_kamar_cuci: data.fasilitas_kamar_cuci === true || data.has_kamar_cuci === true,
      fasilitas_wc: data.fasilitas_wc === true || data.has_wc === true,
      pendapatan_per_bulan: typeof pendapatanVal === 'string' ? parseInt(pendapatanVal.replace(/\D/g, '')) || null : (pendapatanVal || null),
      asuransi_kesehatan: asuransiVal || null,
      latitude: data.gps_lat || data.lat || null,
      longitude: data.gps_lng || data.lng || null,
      is_non_stasi: data.punya_stasi === false
    };

    // 1. Create or Update Family
    let targetFamilyId;
    if (data.type === 'UPDATE_KELUARGA' && data.existing_family_id) {
      const existingFamily = await Family.findByPk(data.existing_family_id, { transaction });
      if (existingFamily) {
        await existingFamily.update(familyData, { transaction });
        targetFamilyId = existingFamily.id;
      } else {
        const newFamily = await Family.create(familyData, { transaction });
        targetFamilyId = newFamily.id;
      }
    } else {
      const newFamily = await Family.create(familyData, { transaction });
      targetFamilyId = newFamily.id;
    }

      // Pre-calculate starting Umat sequence if not done
      let currentUmatCount = 0;
      let countOptionsUmat = { transaction };
      if (targetKbgId) {
        countOptionsUmat.include = [{ model: Family, where: { kbg_id: targetKbgId }, required: true }];
      } else {
        countOptionsUmat.include = [{ model: Family, where: { kbg_id: null }, required: true }];
      }
      currentUmatCount = await Umat.count(countOptionsUmat);

    // 2. Loop Members
    const members = data.members || [];
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const tglLahir = parseDate(member.tgl_lahir) || parseDate(member.tanggal_lahir);
      let jk = null;
      if (member.jenis_kelamin === 'Laki-Laki' || member.jenis_kelamin === 'L') jk = 'L';
      if (member.jenis_kelamin === 'Perempuan' || member.jenis_kelamin === 'P') jk = 'P';

      let mappedStatusKeluarga = member.status_dalam_keluarga || member.status_keluarga || null;
      if (mappedStatusKeluarga) {
        const normalized = mappedStatusKeluarga.trim();
        if (normalized === 'Kepala Keluarga' || normalized === 'Kepala Keluarga ') mappedStatusKeluarga = 'KK';
        else if (normalized === 'Suami') mappedStatusKeluarga = 'Lainnya';
        else mappedStatusKeluarga = normalized;
      }

      let autoNomorUmat = member.nomor_induk_umat || null;
      if (!member.existing_umat_id) {
        const noUrutUmat = (currentUmatCount + 1).toString().padStart(3, '0');
        autoNomorUmat = `${prefix}-U${noUrutUmat}`;
        currentUmatCount++; // Increment for next member in loop
      }

      const umatData = {
        family_id: targetFamilyId,
        nomor_induk_umat: autoNomorUmat,
        nama_lengkap: member.nama_lengkap || member.nama || null,
        fam: member.fam || null,
        tempat_lahir: member.tempat_lahir || null,
        tanggal_lahir: tglLahir,
        jenis_kelamin: jk,
        status_dalam_keluarga: mappedStatusKeluarga,
        pekerjaan: member.pekerjaan || null,
        suku: member.suku || null,
        pendidikan_terakhir: member.pendidikan_terakhir || member.pendidikan || null,
        status_kesehatan: member.status_kesehatan || 'Normal',
        kode_numpang: member.kode_numpang || null
      };

      let newUmat;
      if (data.type === 'UPDATE_KELUARGA' && member.existing_umat_id) {
        newUmat = await Umat.findByPk(member.existing_umat_id, { transaction });
        if (newUmat) {
          await newUmat.update(umatData, { transaction });
        } else {
          newUmat = await Umat.create(umatData, { transaction });
        }
      } else if (data.type === 'PECAH_KK' && member.existing_umat_id) {
        newUmat = await Umat.findByPk(member.existing_umat_id, { transaction });
        if (newUmat) {
          await newUmat.update(umatData, { transaction });
          
          // Logik mutasi untuk pecah KK
          await Mutation.create({
            umat_id: newUmat.id,
            jenis_mutasi: 'Pindah Basis',
            tanggal_kejadian: new Date(),
            keterangan: 'Pecah KK - Pindah ke KK Paroki baru'
          }, { transaction });
        } else {
          newUmat = await Umat.create(umatData, { transaction });
        }
      } else {
        newUmat = await Umat.create(umatData, { transaction });
      }

      // 3. Sacraments
      if (!member.existing_umat_id) { // Only create sacraments if it's a new Umat
        if (member.has_baptis) {
          await Sacrament.create({
            umat_id: newUmat.id,
            jenis_sakramen: 'Baptis',
            nomor_surat: member.baptis_no_surat || null,
            tempat_pelaksanaan: member.baptis_tempat || null,
            tanggal_penerimaan: parseDate(member.baptis_tgl),
            nama_pastor: member.baptis_pastor || null,
            nama_wali_saksi: member.baptis_wali || null,
            sertifikat_url: member.baptis_sertifikat_url || null
          }, { transaction });
        }
        if (member.has_komuni) {
          await Sacrament.create({
            umat_id: newUmat.id,
            jenis_sakramen: 'Komuni Pertama',
            tempat_pelaksanaan: member.komuni_tempat || null,
            tanggal_penerimaan: parseDate(member.komuni_tgl),
            sertifikat_url: member.komuni_sertifikat_url || null
          }, { transaction });
        }
        if (member.has_krisma) {
          await Sacrament.create({
            umat_id: newUmat.id,
            jenis_sakramen: 'Krisma',
            nomor_surat: member.krisma_no_surat || null,
            tempat_pelaksanaan: member.krisma_tempat || null,
            tanggal_penerimaan: parseDate(member.krisma_tgl),
            nama_pastor: member.krisma_pastor || null,
            nama_wali_saksi: member.krisma_wali || null,
            sertifikat_url: member.krisma_sertifikat_url || null,
            metadata: member.krisma_nama ? { nama_pelindung: member.krisma_nama } : null
          }, { transaction });
        }
        if (member.has_perkawinan) {
          await Sacrament.create({
            umat_id: newUmat.id,
            jenis_sakramen: 'Perkawinan',
            nomor_surat: member.kawin_no_surat || member.nikah_no_surat || null,
            tempat_pelaksanaan: member.kawin_tempat || member.nikah_tempat || null,
            tanggal_penerimaan: parseDate(member.kawin_tgl || member.nikah_tgl),
            nama_pastor: member.kawin_pastor || member.nikah_pastor || null,
            sertifikat_url: member.perkawinan_sertifikat_url || member.kawin_sertifikat_url || member.nikah_sertifikat_url || null,
            metadata: member.nikah_kategori ? { kategori_perkawinan: member.nikah_kategori } : null
          }, { transaction });
        }
        if (member.has_imamat) {
          await Sacrament.create({
            umat_id: newUmat.id,
            jenis_sakramen: 'Imamat/Kaul Kekal',
            tempat_pelaksanaan: member.imamat_tempat || null,
            tanggal_penerimaan: parseDate(member.imamat_tgl),
            sertifikat_url: member.imamat_sertifikat_url || null
          }, { transaction });
        }
        if (member.has_minyak_suci || member.has_minyak) {
          await Sacrament.create({
            umat_id: newUmat.id,
            jenis_sakramen: 'Minyak Suci',
            tempat_pelaksanaan: member.minyak_suci_tempat || member.minyak_tempat || null,
            tanggal_penerimaan: parseDate(member.minyak_suci_tgl || member.minyak_tgl),
            sertifikat_url: member.minyak_suci_sertifikat_url || member.minyak_sertifikat_url || null
          }, { transaction });
        }
      }

      // 4. Church Activity
      if (!member.existing_umat_id) {
        if (member.misa_frekuensi || member.keaktifan || member.petugas_liturgi) {
          await ChurchActivity.create({
            umat_id: newUmat.id,
            frekuensi_misa: member.misa_frekuensi || null,
            keaktifan: member.keaktifan || null,
            petugas_liturgi: member.petugas_liturgi || null,
            riwayat_kursus: member.kursus_pastoral || null
          }, { transaction });
        }
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
    } // End Loop Members
    } // End if else type

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
