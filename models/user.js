'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.VerificationQueue, { foreignKey: 'submitted_by' });
    }
  }
  User.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    username: { type: DataTypes.STRING(50), unique: true },
    password: DataTypes.STRING(255),
    role: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN_PAROKI', 'ADMIN_STASI', 'KETUA_KBG', 'UMAT')
  }, { sequelize, modelName: 'User', tableName: 'users' });
  return User;
};