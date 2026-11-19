'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Kbg extends Model {
    static associate(models) {
      Kbg.belongsTo(models.User, { foreignKey: 'ketua_id', as: 'Ketua' });
      Kbg.belongsTo(models.Stasi, { foreignKey: 'stasi_id' });
      Kbg.hasMany(models.KbgPengurus, { foreignKey: 'kbg_id', as: 'Pengurus' });
    }
  }
  Kbg.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    nama_kbg: DataTypes.STRING(100),
    kode_kbg: DataTypes.STRING(20),
    stasi_id: DataTypes.UUID,
    ketua_id: DataTypes.UUID,
    latitude: DataTypes.DOUBLE,
    longitude: DataTypes.DOUBLE
  }, { sequelize, modelName: 'Kbg', tableName: 'kbgs' });
  return Kbg;
};