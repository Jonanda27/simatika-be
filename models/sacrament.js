'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sacrament extends Model {
    static associate(models) {
      Sacrament.belongsTo(models.Umat, { foreignKey: 'umat_id' });
    }
  }
  Sacrament.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    umat_id: DataTypes.UUID,
    jenis_sakramen: DataTypes.ENUM('Baptis', 'Komuni Pertama', 'Krisma', 'Perkawinan', 'Imamat/Kaul Kekal', 'Minyak Suci'),
    nomor_surat: DataTypes.STRING(100),
    tanggal_penerimaan: DataTypes.DATEONLY,
    tempat_pelaksanaan: DataTypes.STRING(255),
    nama_pastor: DataTypes.STRING(255),
    nama_wali_saksi: DataTypes.STRING(255),
    sertifikat_url: DataTypes.STRING(255),
    metadata: DataTypes.JSONB
  }, { sequelize, modelName: 'Sacrament', tableName: 'sacraments' });
  return Sacrament;
};