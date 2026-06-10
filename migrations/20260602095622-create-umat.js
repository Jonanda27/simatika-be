'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('umats', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      family_id: { type: Sequelize.UUID, references: { model: 'families', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      kode_numpang: { type: Sequelize.STRING(10) },
      nama_lengkap: { type: Sequelize.STRING(255) },
      fam: { type: Sequelize.STRING(100) },
      tempat_lahir: { type: Sequelize.STRING(100) },
      tanggal_lahir: { type: Sequelize.DATEONLY },
      jenis_kelamin: { type: Sequelize.CHAR(1) },
      status_dalam_keluarga: { type: Sequelize.ENUM('KK', 'Istri', 'Anak', 'Duda', 'Janda', 'Istri 2', 'Lainnya') },
      pekerjaan: { type: Sequelize.STRING(100) },
      suku: { type: Sequelize.STRING(100) },
      pendidikan_terakhir: { type: Sequelize.STRING(50) },
      status_kesehatan: { type: Sequelize.ENUM('Normal', 'Gangguan Fisik', 'Sakit Kronis', 'Lainnya') },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('umats');
  }
};