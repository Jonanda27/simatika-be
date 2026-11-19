'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Dapatkan user 'kbg'
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE username = 'kbg' LIMIT 1;`
    );
    
    // 2. Dapatkan KBG
    const kbgs = await queryInterface.sequelize.query(
      `SELECT id FROM kbgs LIMIT 1;`
    );

    if (users[0].length > 0 && kbgs[0].length > 0) {
      const kbgUserId = users[0][0].id;
      const kbgId = kbgs[0][0].id;

      // Assign user 'kbg' as ketua for the first KBG
      await queryInterface.sequelize.query(
        `UPDATE kbgs SET ketua_id = '${kbgUserId}' WHERE id = '${kbgId}';`
      );
      console.log(`Successfully assigned user kbg as ketua to KBG ${kbgId}`);
    } else {
      console.log('User kbg or KBG not found.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE username = 'kbg' LIMIT 1;`
    );
    if (users[0].length > 0) {
      const kbgUserId = users[0][0].id;
      await queryInterface.sequelize.query(
        `UPDATE kbgs SET ketua_id = NULL WHERE ketua_id = '${kbgUserId}';`
      );
    }
  }
};
