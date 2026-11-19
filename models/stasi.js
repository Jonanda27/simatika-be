'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Stasi extends Model {
    static associate(models) {
      Stasi.hasMany(models.Kbg, { foreignKey: 'stasi_id' });
    }
  }
  Stasi.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    nama_stasi: DataTypes.STRING(100),
    kode_stasi: DataTypes.STRING(20),
    latitude: DataTypes.DECIMAL(10, 8),
    longitude: DataTypes.DECIMAL(11, 8)
  }, { sequelize, modelName: 'Stasi', tableName: 'stasis' });
  return Stasi;
};