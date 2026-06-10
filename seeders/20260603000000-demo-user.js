'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if user already exists
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE username = 'kbg';`
    );

    if (users[0].length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      await queryInterface.bulkInsert('users', [{
        id: uuidv4(),
        username: 'kbg',
        password: hashedPassword,
        role: 'KETUA_KBG',
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
      console.log('User kbg created successfully.');
    } else {
      console.log('User kbg already exists.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { username: 'kbg' }, {});
  }
};
