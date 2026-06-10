'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Kbg extends Model {
    static associate(models) {
      Kbg.belongsTo(models.User, { foreignKey: 'ketua_id', as: 'Ketua' });
    }
  }
  Kbg.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    nama_kbg: DataTypes.STRING(100),
    ketua_id: DataTypes.UUID
  }, { sequelize, modelName: 'Kbg', tableName: 'kbgs' });
  return Kbg;
};