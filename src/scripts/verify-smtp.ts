import nodemailer from 'nodemailer';

const user = process.argv[2];
const pass = process.argv[3];

if (!user || !pass) {
  console.error('Usage: npx tsx src/scripts/verify-smtp.ts <user> <app-password>');
  process.exit(1);
}

console.log(`Testing SMTP login for: ${user}`);
console.log(`Password length: ${pass.length} chars (App Passwords are 16 chars, ignoring spaces)`);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user, pass },
  logger: true,
  debug: true,
});

transporter
  .verify()
  .then(() => {
    console.log('\n SMTP login succeeded.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n SMTP login failed:', err.message);
    process.exit(1);
  });
