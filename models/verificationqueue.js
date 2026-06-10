'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VerificationQueue extends Model {
    static associate(models) {
      VerificationQueue.belongsTo(models.User, { foreignKey: 'submitted_by' });
    }
  }
  VerificationQueue.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    submitted_by: DataTypes.UUID,
    payload_data: DataTypes.JSONB,
    status: DataTypes.ENUM('PENDING', 'VERIFIED_STASI', 'APPROVED_PAROKI', 'REJECTED'),
    reject_reason: DataTypes.TEXT
  }, { sequelize, modelName: 'VerificationQueue', tableName: 'verification_queues' });
  return VerificationQueue;
};