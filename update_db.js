const db = require('./models');
const { Family } = db;

async function update() {
  const f = await Family.findOne({ where: { kode_unik_keluarga: 'P1-K2-K006' } });
  if (f) {
    f.is_non_stasi = true;
    await f.save();
    console.log('Successfully updated P1-K2-K006 to is_non_stasi = true');
  } else {
    console.log('Family not found');
  }
}
update().catch(console.error).finally(() => process.exit(0));
