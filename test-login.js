const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function test() {
  const username = 'adminstasi';
  const password = 'password123';
  const user = await User.findOne({ where: { username } });
  if (!user) {
    console.log('User not found!');
    return;
  }
  console.log('User found:', user.toJSON());
  const isMatch = await bcrypt.compare(password, user.password);
  console.log('Password match:', isMatch);
}

test();
