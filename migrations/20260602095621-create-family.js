'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('families', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      no_kk_paroki: { type: Sequelize.STRING(50) },
      status_rumah: { type: Sequelize.ENUM('Milik', 'Dinas', 'Kontrak', 'Numpang') },
      fasilitas_kamar_mandi: { type: Sequelize.BOOLEAN },
      fasilitas_kamar_cuci: { type: Sequelize.BOOLEAN },
      fasilitas_wc: { type: Sequelize.BOOLEAN },
      pendapatan_per_bulan: { type: Sequelize.BIGINT },
      asuransi_kesehatan: { type: Sequelize.STRING(100) },
      foto_rumah_url: { type: Sequelize.STRING(255) },
      latitude: { type: Sequelize.DOUBLE },
      longitude: { type: Sequelize.DOUBLE },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('families');
  }
};