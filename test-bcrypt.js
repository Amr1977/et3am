const bcrypt = require('bcrypt');
const password = 'REDACTED_PASSWORD';
const hashFromDb = '$2b$10$QcM.euYC6nk4Fal8xHGcMOuKOuyVvsbDm//.5iBsViJhzfUUwo7jm';
console.log('Testing comparison:');
console.log('Password:', password);
console.log('Hash:', hashFromDb);
const result = bcrypt.compareSync(password, hashFromDb);
console.log('Result:', result);
