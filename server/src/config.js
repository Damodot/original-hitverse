const isProd = process.env.NODE_ENV === 'production';

const jwtSecret = process.env.JWT_SECRET;
if (isProd && (!jwtSecret || jwtSecret === 'change-me')) {
  throw new Error('Set JWT_SECRET in .env before running in production');
}

export const config = {
  isProd,
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/hitverse',
  jwtSecret: jwtSecret || 'dev-only-secret',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  smtpUrl: process.env.SMTP_URL || '',
  mailFrom: process.env.MAIL_FROM ?? 'HitVerse <no-reply@hitverse.app>',
  maxAudioMb: Number(process.env.MAX_AUDIO_MB ?? 250), // biggest song file an artist can upload (masters are big)
  maxCoverMb: Number(process.env.MAX_COVER_MB ?? 5),
  // Karaoke beats and DJ-mix analysis run with the Python tools in server/audio-tools (Demucs + librosa).
  audioToolsPython: process.env.AUDIO_TOOLS_PYTHON ?? '',
  // Live rooms (group voice and video calls) run on LiveKit, an open-source call server.
  livekit: {
    url: process.env.LIVEKIT_URL ?? 'http://localhost:7880', // how the API reaches LiveKit
    publicUrl: process.env.LIVEKIT_PUBLIC_URL ?? 'ws://localhost:7880', // how browsers reach it (wss:// in production)
    apiKey: process.env.LIVEKIT_API_KEY ?? (isProd ? '' : 'devkey'),
    apiSecret: process.env.LIVEKIT_API_SECRET ?? (isProd ? '' : 'secret'),
  },
};
