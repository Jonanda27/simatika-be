'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Family extends Model {
    static associate(models) {
      Family.hasMany(models.Umat, { foreignKey: 'family_id' });
      Family.belongsTo(models.Kbg, { foreignKey: 'kbg_id' });
    }
  }
  Family.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    kbg_id: DataTypes.UUID,
    kode_unik_keluarga: DataTypes.STRING(50),
    no_kk_paroki: DataTypes.STRING(50),
    kk_url: DataTypes.STRING,
    status_rumah: DataTypes.ENUM('Milik', 'Dinas', 'Kontrak', 'Numpang'),
    fasilitas_kamar_mandi: DataTypes.BOOLEAN,
    fasilitas_kamar_cuci: DataTypes.BOOLEAN,
    fasilitas_wc: DataTypes.BOOLEAN,
    pendapatan_per_bulan: DataTypes.BIGINT,
    asuransi_kesehatan: DataTypes.STRING(100),
    foto_rumah_url: DataTypes.STRING(255),
    latitude: DataTypes.DOUBLE,
    longitude: DataTypes.DOUBLE,
    is_non_stasi: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, { sequelize, modelName: 'Family', tableName: 'families' });
  return Family;
};