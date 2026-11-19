const { CensusDraft } = require('./models');

async function run() {
  try {
    const drafts = await CensusDraft.findAll();
    console.log(`Found ${drafts.length} drafts`);
    if (drafts.length > 0) {
      console.log('First draft payload:', JSON.stringify(drafts[0].payload_data, null, 2));
    }
  } catch (error) {
    console.error('ERROR:', error);
  }
  process.exit(0);
}

run();
