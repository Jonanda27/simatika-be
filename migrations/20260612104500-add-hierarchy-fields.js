'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Tambah stasi_id dan kode_kbg di kbgs
    await queryInterface.addColumn('kbgs', 'kode_kbg', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn('kbgs', 'stasi_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'stasis',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 2. Tambah kbg_id di families
    await queryInterface.addColumn('families', 'kbg_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'kbgs',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 3. Tambah nomor_induk_umat di umats
    await queryInterface.addColumn('umats', 'nomor_induk_umat', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert semua tambahan jika di-rollback
    await queryInterface.removeColumn('umats', 'nomor_induk_umat');
    await queryInterface.removeColumn('families', 'kbg_id');
    await queryInterface.removeColumn('kbgs', 'stasi_id');
    await queryInterface.removeColumn('kbgs', 'kode_kbg');
  }
};
