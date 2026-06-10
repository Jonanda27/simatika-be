'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // kbg_id fk ditambahkan terpisah untuk menghindari cyclic dependency
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      username: { type: Sequelize.STRING(50), unique: true },
      password: { type: Sequelize.STRING(255) },
      role: { type: Sequelize.ENUM('SUPER_ADMIN', 'ADMIN_PAROKI', 'ADMIN_STASI', 'KETUA_KBG', 'UMAT') },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};