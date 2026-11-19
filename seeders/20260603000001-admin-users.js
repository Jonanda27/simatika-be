'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Cek apakah adminstasi sudah ada
    const adminStasi = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE username = 'adminstasi';`
    );

    // Cek apakah adminparoki sudah ada
    const adminParoki = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE username = 'adminparoki';`
    );

    // Cek apakah admingereja sudah ada
    const adminGereja = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE username = 'admingereja';`
    );

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const usersToInsert = [];

    if (adminStasi[0].length === 0) {
      usersToInsert.push({
        id: uuidv4(),
        username: 'adminstasi',
        password: hashedPassword,
        role: 'ADMIN_STASI',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('User adminstasi queued for creation.');
    } else {
      console.log('User adminstasi already exists.');
    }

    if (adminParoki[0].length === 0) {
      usersToInsert.push({
        id: uuidv4(),
        username: 'adminparoki',
        password: hashedPassword,
        role: 'ADMIN_PAROKI',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('User adminparoki queued for creation.');
    } else {
      console.log('User adminparoki already exists.');
    }

    if (adminGereja[0].length === 0) {
      usersToInsert.push({
        id: uuidv4(),
        username: 'admingereja',
        password: hashedPassword,
        role: 'ADMIN_GEREJA',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('User admingereja queued for creation.');
    } else {
      console.log('User admingereja already exists.');
    }

    if (usersToInsert.length > 0) {
      await queryInterface.bulkInsert('users', usersToInsert);
      console.log(`${usersToInsert.length} admin users created successfully.`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      username: ['adminstasi', 'adminparoki', 'admingereja']
    }, {});
  }
};
