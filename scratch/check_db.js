const db = require('../models');

async function check() {
  const umats = await db.Umat.findAll({ where: { nama_lengkap: { [db.Sequelize.Op.like]: '%BUDI%' } } });
  console.log("UMAT COUNT BUDI:", umats.length);
  for (const u of umats) {
    console.log("Umat:", u.nama_lengkap);
  }

  const mutations = await db.Mutation.findAll({ include: [db.Umat] });
  console.log("MUTATION COUNT:", mutations.length);
  for (const m of mutations) {
    if (m.Umat.nama_lengkap.includes('BUDI')) {
      console.log("Mutation for BUDI:", m.Umat.nama_lengkap, m.jenis_mutasi);
    }
  }
}
check().then(() => process.exit(0)).catch(console.error);
