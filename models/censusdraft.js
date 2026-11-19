'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CensusDraft extends Model {
    static associate(models) {
      CensusDraft.belongsTo(models.Kbg, { foreignKey: 'kbg_id', as: 'Kbg' });
      CensusDraft.belongsTo(models.User, { foreignKey: 'created_by', as: 'Creator' });
    }
  }
  
  CensusDraft.init({
    id: { 
      type: DataTypes.UUID, 
      primaryKey: true, 
      defaultValue: DataTypes.UUIDV4 
    },
    kbg_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    payload_data: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, { 
    sequelize, 
    modelName: 'CensusDraft', 
    tableName: 'census_drafts' 
  });
  
  return CensusDraft;
};
