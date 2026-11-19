const db = require('./models');
const { Family, Kbg, Stasi } = db;

async function check() {
  const f = await Family.findOne({
    where: { kode_unik_keluarga: 'P1-K2-K006' },
    include: [{ model: Kbg }]
  });
  console.log(JSON.stringify(f, null, 2));
}
check().catch(console.error).finally(() => process.exit(0));
