'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('church_activities', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      umat_id: { type: Sequelize.UUID, references: { model: 'umats', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      frekuensi_misa: { type: Sequelize.ENUM('Mingguan', 'Harian', 'Hari Raya') },
      keaktifan_organisasi: { type: Sequelize.STRING(255) },
      petugas_liturgi: { type: Sequelize.STRING(100) },
      riwayat_kursus: { type: Sequelize.JSONB },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('church_activities');
  }
};