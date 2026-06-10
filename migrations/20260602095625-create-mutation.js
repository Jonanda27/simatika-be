'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('mutations', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      umat_id: { type: Sequelize.UUID, references: { model: 'umats', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      jenis_mutasi: { type: Sequelize.ENUM('Pindah Basis', 'Pindah Stasi', 'Pindah Paroki', 'Pindah Dekenat', 'Pindah Keuskupan', 'Meninggal') },
      tanggal_kejadian: { type: Sequelize.DATEONLY },
      tempat_kematian: { type: Sequelize.STRING(255) },
      keterangan: { type: Sequelize.TEXT },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('mutations');
  }
};