import nodemailer from 'nodemailer';
import { config } from '../config.js';

const transport = config.smtpUrl ? nodemailer.createTransport(config.smtpUrl) : null;

export async function sendMail({ to, subject, text, html }) {
  if (!transport) {
    // No SMTP set up: print the message so password resets still work in development.
    console.log(`\n[mail] to=${to} subject="${subject}"\n${text}\n`);
    return;
  }
  await transport.sendMail({ from: config.mailFrom, to, subject, text, html });
}
