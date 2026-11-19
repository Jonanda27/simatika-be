'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Umat extends Model {
    static associate(models) {
      Umat.belongsTo(models.Family, { foreignKey: 'family_id' });
      Umat.hasMany(models.Sacrament, { foreignKey: 'umat_id' });
      Umat.hasOne(models.ChurchActivity, { foreignKey: 'umat_id' });
      Umat.hasMany(models.Mutation, { foreignKey: 'umat_id' });
    }
  }
  Umat.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    family_id: DataTypes.UUID,
    nomor_induk_umat: DataTypes.STRING(50),
    kode_numpang: DataTypes.STRING(10),
    nama_lengkap: DataTypes.STRING(255),
    fam: DataTypes.STRING(100),
    tempat_lahir: DataTypes.STRING(100),
    tanggal_lahir: DataTypes.DATEONLY,
    jenis_kelamin: DataTypes.CHAR(1),
    status_dalam_keluarga: DataTypes.ENUM('KK', 'Istri', 'Anak', 'Duda', 'Janda', 'Istri 2', 'Lainnya'),
    pekerjaan: DataTypes.STRING(100),
    suku: DataTypes.STRING(100),
    pendidikan_terakhir: DataTypes.STRING(50),
    status_kesehatan: DataTypes.ENUM('Normal', 'Gangguan Fisik', 'Sakit Kronis', 'Lainnya')
  }, { 
    sequelize, 
    modelName: 'Umat', 
    tableName: 'umats',
    hooks: {
      beforeSave: (umat, options) => {
        if (umat.nama_lengkap) {
          umat.nama_lengkap = umat.nama_lengkap.toUpperCase();
        }
      }
    }
  });
  return Umat;
};