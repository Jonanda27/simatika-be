const { Kbg } = require('./models');

async function run() {
  try {
    const kbgs = await Kbg.findAll({
      attributes: ['id', 'nama_kbg', 'wilayah_kbg'],
      order: [['nama_kbg', 'ASC']]
    });
    console.log(kbgs);
  } catch (error) {
    console.error('ERROR:', error);
  }
  process.exit(0);
}

run();
