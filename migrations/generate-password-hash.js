// Script do generowania bcrypt hash dla hasła
// Uruchom: node migrations/generate-password-hash.js

const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = process.argv[2];
  
  if (!password) {
    console.log('Usage: node generate-password-hash.js <password>');
    console.log('Example: node generate-password-hash.js domostwo123');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  console.log('\n=== BCRYPT PASSWORD HASH ===');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nDodaj ten hash do pliku .env.local:');
  console.log(`PASSWORD_HASH=${hash}`);
  console.log('\n');
}

generateHash();
