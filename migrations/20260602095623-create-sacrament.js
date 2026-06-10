'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sacraments', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      umat_id: { type: Sequelize.UUID, references: { model: 'umats', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      jenis_sakramen: { type: Sequelize.ENUM('Baptis', 'Komuni Pertama', 'Krisma', 'Perkawinan', 'Imamat/Kaul Kekal', 'Minyak Suci') },
      nomor_surat: { type: Sequelize.STRING(100) },
      tanggal_penerimaan: { type: Sequelize.DATEONLY },
      tempat_pelaksanaan: { type: Sequelize.STRING(255) },
      nama_pastor: { type: Sequelize.STRING(255) },
      nama_wali_saksi: { type: Sequelize.STRING(255) },
      metadata: { type: Sequelize.JSONB },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sacraments');
  }
};