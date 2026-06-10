'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChurchActivity extends Model {
    static associate(models) {
      ChurchActivity.belongsTo(models.Umat, { foreignKey: 'umat_id' });
    }
  }
  ChurchActivity.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    umat_id: DataTypes.UUID,
    frekuensi_misa: DataTypes.ENUM('Mingguan', 'Harian', 'Hari Raya'),
    keaktifan_organisasi: DataTypes.STRING(255),
    petugas_liturgi: DataTypes.STRING(100),
    riwayat_kursus: DataTypes.JSONB
  }, { sequelize, modelName: 'ChurchActivity', tableName: 'church_activities' });
  return ChurchActivity;
};