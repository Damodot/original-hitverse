import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { connectDb } from './db.js';
import { resumeAudioJobs } from './lib/audioTools.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { Song } from './models/Song.js';
import { yoga } from './graphql/index.js';
import { Artist } from './models/Artist.js';
import mediaRoutes from './routes/media.js';
import uploadRoutes from './routes/uploads.js';

const app = express();
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      // Store artwork shown in the Add-by-ISRC lookup before it's saved (Spotify and Apple image servers).
      'img-src': ["'self'", 'data:', 'blob:', 'https://i.scdn.co', 'https://*.mzstatic.com'],
      'media-src': ["'self'", 'blob:'],
      // Live rooms connect to the LiveKit call server.
      'connect-src': ["'self'", ...(config.livekit.publicUrl ? [new URL(config.livekit.publicUrl).origin.replace(/^http/, 'ws'), new URL(config.livekit.publicUrl.replace(/^ws/, 'http')).origin] : [])],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    },
  },
}));
app.use(compression());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(cookieParser());

// GraphQL: all data (accounts, songs, artists, fan bases, links, lyrics, admin). Yoga reads the body itself.
if (!config.isProd) {
  // The GraphiQL explorer (development only) loads its scripts from a CDN.
  app.use(yoga.graphqlEndpoint, (req, res, next) => { res.removeHeader('Content-Security-Policy'); next(); });
}
app.use(yoga.graphqlEndpoint, yoga);

// Plain HTTP only for what GraphQL is bad at: file uploads and streaming files.
app.use(express.json({ limit: '20kb' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/media', mediaRoutes);
app.use('/api/artist', uploadRoutes);
app.use('/api', notFound);

if (config.isProd) {
  // Hashed build assets can be cached forever; media for a week. Audio supports range requests for seeking.
  app.use('/assets', express.static(path.join(clientDist, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use('/media', express.static(path.join(clientDist, 'media'), { maxAge: '7d' }));
  app.use(express.static(clientDist, { maxAge: '1h', index: false }));
  // Shared song pages get a proper preview card (title + artwork) on WhatsApp, X, Instagram, etc.
  let shell;
  const esc = (v = '') => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  app.get('/listen/:slug', async (req, res, next) => {
    try {
      shell ??= readFileSync(path.join(clientDist, 'index.html'), 'utf8');
      const song = await Song.findOne({ slug: req.params.slug }).select('title artist cover links').lean();
      if (!song) return next();
      const origin = config.clientUrl.replace(/\/$/, '');
      const title = `${song.title} by ${song.artist}`;
      const NAMES = { spotify: 'Spotify', appleMusic: 'Apple Music', youtubeMusic: 'YouTube Music', audiomack: 'Audiomack', boomplay: 'Boomplay' };
      const on = ['HitVerse', ...Object.keys(NAMES).filter((k) => song.links?.[k]).map((k) => NAMES[k])];
      const list = on.length > 1 ? `${on.slice(0, -1).join(', ')} and ${on.at(-1)}` : on[0];
      const desc = `Listen to ${song.title} by ${song.artist} on ${list}.`;
      const tags = [
        `<title>${esc(title)} | HitVerse</title>`,
        `<meta name="description" content="${esc(desc)}" />`,
        `<meta property="og:type" content="music.song" />`,
        `<meta property="og:title" content="${esc(title)}" />`,
        `<meta property="og:description" content="${esc(desc)}" />`,
        `<meta property="og:image" content="${esc(origin + song.cover)}" />`,
        `<meta property="og:url" content="${esc(`${origin}/listen/${req.params.slug}`)}" />`,
        '<meta name="twitter:card" content="summary_large_image" />',
      ].join('\n    ');
      res.set('Cache-Control', 'public, max-age=300');
      res.send(shell.replace(/<title>[^<]*<\/title>/, tags).replace(/<meta name="description"[^>]*>\n?\s*/, ''));
    } catch (err) {
      next(err);
    }
  });
  // Artist pages get a preview card with their name, fan base and picture.
  app.get('/a/:slug', async (req, res, next) => {
    try {
      shell ??= readFileSync(path.join(clientDist, 'index.html'), 'utf8');
      const artist = await Artist.findOne({ slug: String(req.params.slug).toLowerCase() }).select('name bio avatar banner fanBase').lean();
      if (!artist) return next();
      const origin = config.clientUrl.replace(/\/$/, '');
      const title = `${artist.name} on HitVerse`;
      const desc = artist.fanBase?.name
        ? `Join the ${artist.fanBase.name}: hear ${artist.name}'s new music before anyone else.`
        : `Hear ${artist.name}'s new music before anyone else.`;
      const image = artist.banner || artist.avatar;
      const tags = [
        `<title>${esc(title)}</title>`,
        `<meta name="description" content="${esc(desc)}" />`,
        '<meta property="og:type" content="profile" />',
        `<meta property="og:title" content="${esc(title)}" />`,
        `<meta property="og:description" content="${esc(desc)}" />`,
        ...(image ? [`<meta property="og:image" content="${esc(origin + image)}" />`] : []),
        `<meta property="og:url" content="${esc(`${origin}/a/${req.params.slug}`)}" />`,
        '<meta name="twitter:card" content="summary_large_image" />',
      ].join('\n    ');
      res.set('Cache-Control', 'public, max-age=300');
      res.send(shell.replace(/<title>[^<]*<\/title>/, tags).replace(/<meta name="description"[^>]*>\n?\s*/, ''));
    } catch (err) {
      next(err);
    }
  });
  app.get('/{*splat}', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use(errorHandler);

await connectDb();
app.listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`));
resumeAudioJobs().catch((err) => console.error('[audio-tools]', err.message));
