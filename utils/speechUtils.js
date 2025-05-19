const fs = require('fs-extra');
const speech = require('@google-cloud/speech');

function verifyCredentials() {
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  console.log('>> GOOGLE_APPLICATION_CREDENTIALS =', credsPath);

  if (!credsPath || !fs.existsSync(credsPath)) {
    console.error('❌ Credenciales no encontradas en', credsPath);
  } else {
    console.log('✅ Credenciales listas en', credsPath);
  }
}

function createSpeechClient() {
  return new speech.SpeechClient();
}

module.exports = { verifyCredentials, createSpeechClient };
