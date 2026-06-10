const { VerificationQueue } = require('../../models');
const cloudinary = require('cloudinary').v2;

// Konfigurasi Cloudinary dari environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper untuk upload buffer ke Cloudinary
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'simatika_rumah',
      resource_type: options.resource_type || 'auto'
    };
    
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const processFilesToPayload = async (reqFiles, payload) => {
  if (!reqFiles || reqFiles.length === 0) return payload;

  for (const file of reqFiles) {
    if (file.fieldname === 'foto_rumah') {
      const result = await uploadToCloudinary(file.buffer);
      payload.foto_rumah_url = result.secure_url;
      delete payload.foto_rumah_path;
    } else if (file.fieldname.startsWith('sertifikat_')) {
      // Format: sertifikat_{jenis}_{memberIndex}
      // Contoh: sertifikat_baptis_0
      const parts = file.fieldname.split('_');
      if (parts.length >= 3) {
        const jenis = parts[1];
        const memberIndex = parseInt(parts[2]);
        
        if (!isNaN(memberIndex) && payload.members && payload.members[memberIndex]) {
          const result = await uploadToCloudinary(file.buffer, { 
            folder: 'simatika_sertifikat',
            resource_type: 'auto' // Penting untuk PDF
          });
          
          // Simpan URL ke properti anggota
          payload.members[memberIndex][`${jenis}_sertifikat_url`] = result.secure_url;
        }
      }
    }
  }
  return payload;
};

exports.syncFamilyData = async (req, res, next) => {
  try {
    // 1. Ambil payload string dari request body
    let payload = req.body.payload;
    if (typeof payload === 'string') {
      payload = JSON.parse(payload);
    } else if (!payload && req.body) {
      // Fallback in case it's sent as pure JSON without multipart
      payload = req.body;
    }

    // 2. Upload semua file yang dikirim (foto rumah & sertifikat)
    payload = await processFilesToPayload(req.files, payload);

    // 3. Simpan ke VerificationQueue dengan status PENDING
    const queue = await VerificationQueue.create({
      submitted_by: req.user ? req.user.id : null,
      payload_data: payload,
      status: 'PENDING'
    });

    res.status(201).json({ 
      success: true, 
      message: 'Data berhasil dikirim dan sedang menunggu verifikasi Stasi.', 
      queueId: queue.id 
    });
    
  } catch (error) {
    error.message = 'Gagal mengirim data sinkronisasi: ' + error.message;
    next(error);
  }
};

exports.updateFamilyData = async (req, res, next) => {
  try {
    const queueId = req.params.id;

    // 1. Ambil payload
    let payload = req.body.payload;
    if (typeof payload === 'string') {
      payload = JSON.parse(payload);
    } else if (!payload && req.body) {
      payload = req.body;
    }
    
    // 2. Upload semua file yang dikirim
    payload = await processFilesToPayload(req.files, payload);

    // 3. Cari antrean berdasarkan ID dan pembuat
    const queue = await VerificationQueue.findOne({
      where: { 
        id: queueId,
        submitted_by: req.user.id
      }
    });

    if (!queue) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan atau Anda tidak berhak mengubahnya.' });
    }

    // Update data dan reset status
    queue.payload_data = payload;
    queue.status = 'PENDING';
    queue.reject_reason = null;
    await queue.save();

    res.status(200).json({ 
      success: true, 
      message: 'Data berhasil diperbarui dan dikirim ulang untuk verifikasi.', 
      queueId: queue.id 
    });
    
  } catch (error) {
    error.message = 'Gagal memperbarui data: ' + error.message;
    next(error);
  }
};
