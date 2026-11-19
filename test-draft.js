const { CensusDraft, Kbg } = require('./models');

async function run() {
  try {
    const kbg = await Kbg.findOne({ attributes: ['id', 'nama_kbg', 'ketua_id'] });
    if (!kbg) return console.log('No KBG');
    
    await CensusDraft.bulkCreate([{
      kbg_id: kbg.id,
      payload_data: { test: 1 },
      created_by: kbg.ketua_id || kbg.id
    }]);
    console.log('Success');
  } catch (error) {
    console.error('ERROR:', error);
  }
  process.exit(0);
}

run();
