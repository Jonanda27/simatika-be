'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Mutation extends Model {
    static associate(models) {
      Mutation.belongsTo(models.Umat, { foreignKey: 'umat_id' });
    }
  }
  Mutation.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    umat_id: DataTypes.UUID,
    jenis_mutasi: DataTypes.ENUM('Pindah Basis', 'Pindah Stasi', 'Pindah Paroki', 'Pindah Dekenat', 'Pindah Keuskupan', 'Meninggal'),
    tanggal_kejadian: DataTypes.DATEONLY,
    tempat_kematian: DataTypes.STRING(255),
    keterangan: DataTypes.TEXT
  }, { sequelize, modelName: 'Mutation', tableName: 'mutations' });
  return Mutation;
};