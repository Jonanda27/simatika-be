'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class KbgPengurus extends Model {
    static associate(models) {
      KbgPengurus.belongsTo(models.Kbg, { foreignKey: 'kbg_id' });
      KbgPengurus.belongsTo(models.Umat, { foreignKey: 'umat_id' });
    }
  }
  KbgPengurus.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    kbg_id: DataTypes.UUID,
    umat_id: DataTypes.UUID,
    nama_manual: DataTypes.STRING,
    jabatan: DataTypes.STRING,
    periode_mulai: DataTypes.STRING(4),
    periode_selesai: DataTypes.STRING(4),
    nomor_telepon: DataTypes.STRING(20),
    sk_url: DataTypes.STRING,
    is_active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'KbgPengurus',
    tableName: 'kbg_pengurus'
  });
  return KbgPengurus;
};
