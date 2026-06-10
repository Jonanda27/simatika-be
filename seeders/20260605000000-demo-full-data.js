'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Kosongkan agar tidak ada data bypass verifikasi
    console.log('Skipping direct DB insert. All data goes to verification_queues instead.');
  },

  async down(queryInterface, Sequelize) {
    // Tidak melakukan apa-apa
  }
};
