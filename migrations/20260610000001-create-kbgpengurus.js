'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('kbg_pengurus', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      kbg_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'kbgs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      umat_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'umats',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      nama_manual: {
        type: Sequelize.STRING,
        allowNull: true
      },
      jabatan: {
        type: Sequelize.STRING,
        allowNull: false
      },
      periode_mulai: {
        type: Sequelize.STRING(4),
        allowNull: false
      },
      periode_selesai: {
        type: Sequelize.STRING(4),
        allowNull: false
      },
      nomor_telepon: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      sk_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('kbg_pengurus');
  }
};
