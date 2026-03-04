require('dotenv').config();
const path = require('path');
// If MONGODB wasn't loaded (running script from scripts/), try loading parent .env
if (!process.env.MONGODB) {
  const envPath = path.resolve(__dirname, '..', '.env');
  require('dotenv').config({ path: envPath });
}
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../Model/UserModel');

const MONGODB = process.env.MONGODB;
if (!MONGODB) {
  console.error('MONGODB connection string not found in environment. Set MONGODB in your .env');
  process.exit(1);
}

const argv = process.argv.slice(2);
// Usage: node scripts/createAdmin.js [email] [password] [name]
const email = argv[0] || process.env.ADMIN_EMAIL || 'dharaneedharan@ardk.online';
const password = argv[1] || process.env.ADMIN_PASSWORD || '1234';
const name = argv[2] || process.env.ADMIN_NAME || 'dharaneee';

async function run() {
  try {
    await mongoose.connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Hash password before storing
    const hashed = await bcrypt.hash(password, 10);

    let user = await User.findOne({ email });
    if (user) {
      console.log('User with this email already exists. Updating to admin and setting new password.');
      user.password = hashed;
      user.role = 'admin';
      user.verified = true;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        password: hashed,
        verified: true,
        role: 'admin'
      });
    }

    console.log('Admin user created/updated successfully:');
    console.log(`  email: ${email}`);
    console.log(`  password: ${password}  (stored hashed in DB)`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin user:', err);
    process.exit(2);
  }
}

run();
