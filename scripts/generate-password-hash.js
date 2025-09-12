const crypto = require('crypto');

function generatePasswordHash(password) {
  const salt = "huella_salt_2024";
  const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
  return hash;
}

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.log('Usage: node generate-password-hash.js <password>');
  console.log('Example: node generate-password-hash.js "huella2024"');
  process.exit(1);
}

const hash = generatePasswordHash(password);
console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`);
console.log('\nCopy the hash above and replace CORRECT_PASSWORD_HASH in components/password-landing.tsx');
