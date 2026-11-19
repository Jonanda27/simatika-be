'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // In PostgreSQL, to add a value to an ENUM:
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'ADMIN_GEREJA';
    `);
  },
  down: async (queryInterface, Sequelize) => {
    // Postgres doesn't easily support dropping an enum value, so we just do nothing here.
    // If we really wanted to, we'd have to recreate the type.
  }
};
