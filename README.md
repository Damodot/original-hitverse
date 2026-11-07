# HitVerse (React + GraphQL + MongoDB)

**Bringing smoke to music.** HitVerse is a pre-release testing platform: artists test unreleased songs with their
fans before release, and fans join fan bases, rate songs and back their artists. DAMODOT is the first artist on it.
It began as a rebuild of the static Firebase site ([original-hitverse](https://github.com/Damodot/original-hitverse)).

## Run it locally

You need Node 20+ and either Docker (for a local MongoDB) or a MongoDB Atlas connection string.

```bash
npm install
cp .env.example .env          # then set JWT_SECRET (and MONGODB_URI if using Atlas)
npm run db:up                 # starts MongoDB in Docker (skip if using Atlas)
npm run live:up               # starts LiveKit in Docker, for live rooms (optional)
npm run seed                  # loads albums, songs and lyrics into MongoDB
npm run dev                   # API on :4000, site on http://localhost:5173
```

Password-reset emails (and artist approval emails) are printed in the API log until you set `SMTP_URL` in `.env`.

## Use a cloud database (MongoDB Atlas)

Songs that artists upload are stored inside MongoDB (GridFS), so one cloud database holds everything.

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com). The free tier gives 512 MB.
2. **Database Access**: add a database user with a long random password.
3. **Network Access**: allow your server's IP address. Use `0.0.0.0/0` (anywhere) only if your host has no fixed IP;
   the password is then the only lock, so keep it long. The database itself is never public: only the app talks to it.
4. **Connect > Drivers**: copy the connection string, add the database name, and put it in `.env`:
   `MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/hitverse?retryWrites=true&w=majority`
5. Run `npm run seed` to load the catalog.
6. Optional: `npm run media:to-db` copies the built-in songs and covers (about 101 MB) into the database too.
   Safe to run again. Without it, those files are served from `client/public/media` as before.

## Artists and the admin account

- **Make yourself admin.** Sign up on the site, then run `npm run make-admin -- you@example.com`
  (`--remove` takes it away). Admins see **Admin** in the sidebar, with a count of waiting requests.
- **Artists apply** from **Become an artist** (`/app/artist`) with an artist name, a short bio and an optional link.
  Admins get an email for each new application.
- **You review** at `/app/admin`: approve, decline (with an optional reason), or remove upload access later.
  The artist gets an email either way, and a declined artist can apply again.
- **Only approved artists (and admins) can upload.** The server checks this on every request, before it reads any
  file, so a pending, declined or removed artist is blocked immediately, whatever the page shows.
- **Uploads**: WAV, FLAC, AIFF, MP3 or M4A up to 250 MB (masters are fine), optional JPG/PNG/WebP cover (resized to
  800px WebP), optional lyrics. Masters and big files are converted to 256 kbps AAC for streaming with **ffmpeg**, which
  must be installed on the server (`brew install ffmpeg` on a Mac, `apt install ffmpeg` on Linux); small MP3/M4A files
  are stored as they are. The server checks the file's actual bytes, not its name. Songs go live straight away and
  appear on Home under "New from artists". Artists can delete their own songs; admins can delete any upload from the
  **Uploads** tab. Change the limits with `MAX_AUDIO_MB` and `MAX_COVER_MB`.
- **Space**: only the converted file is kept (a 44 MB WAV becomes about 5 MB at 256k, or 3.8 MB with
  `AUDIO_BITRATE=192k`). Admin → **Uploads** shows a storage meter (set `STORAGE_LIMIT_MB` to your plan's size).

## Artist pages and fan bases

- **Every approved artist gets a public page** at `/a/:slug` (DAMODOT's is `/a/damodot`), created automatically when
  an admin approves them. All artists are listed at `/artists`, and featured ones on the landing page.
- **Setting up the page** (`/app/profile/:slug`): profile photo and banner (resized to WebP and stored in the
  database), genre, location, bio, socials (https links only), and the fan base name, both for the group and one fan
  (DAMODOT's are *Disturbers* / *Disturber*), plus a welcome message. The page counts as set up once it has a bio
  and a fan base name.
- **Fans join many fan bases and rep one.** Joining from an artist page while signed out goes through sign-up and
  joins straight after. The fan base they rep sets the Home greeting ("WELCOME BACK, DISTURBER"). They manage
  their fan bases at `/app/artists`.
- **Admins** can mark pages as Featured or Verified (Admin, then **Artist pages**) and edit any page.
- `npm run seed` creates the DAMODOT page only if it is missing, so edits made on the site are kept.

## Synced lyrics

Songs with synced lyrics follow along in the full-screen player and on the song's lyrics page: the line being sung is
the star (bold, full brightness, slightly larger, glowing in the artwork's colour) and every other line is faded; the
view keeps it centred, and tapping a line jumps there. Writer and producer credits appear after the lyrics and take the
spotlight a few seconds after the last line.
Lyrics marked **Synced** in the Lyrics list have timings.

To add them: ⋯ menu on any song → **Lyrics, sync & credits** (admins: any song; artists: their own uploads, also from the
microphone button in Your uploads).
- **Lyrics**: type or paste the words, one line per line.
- **Sync**: press **Play the song**, then tap the big button (or press **Enter**) as each line starts. **Backspace**
  undoes, **Space** pauses, −/+ nudge a line by 0.1 s, and clicking a time replays from just before that line.
- **Credits**: "Written by" and "Produced by" (names separated by commas or "&"). They can also be filled in when
  uploading a song or adding it by ISRC.
- **Import**: search LRCLIB (a free, open library of synced lyrics; independent releases often aren't there yet) or paste
  an LRC file. A finished sync can be copied or downloaded as `.lrc`.

Lyrics edited on the site are never overwritten by `npm run seed`.

## Keyboard shortcuts

| Key | Does |
| --- | --- |
| Space or K | play / pause (Space presses a button only if you reached it with Tab) |
| M | mute / unmute |
| Shift + ↑ / ↓ | volume up / down 10% |
| Shift + → / ← | next / previous track |
| → / ← | forward / back 5 seconds |

Keyboard media keys and headphone buttons work through the browser's Media Session.

## Add a released song by ISRC

On **Upload music**, choose **Add by ISRC** and type the song's ISRC (DistroKid lists it under each track), or paste
its Spotify / Apple Music / YouTube link. MusicLink
fills in the title, artist, artwork and every streaming link (needs `MUSICLINK_API_KEY`); you add the song file (the WAV
or MP3 you sent to your distributor). If the file isn't to hand, the song can go in with the stores' 30-second preview
instead (marked **Preview**), and **Add full song** in Your uploads swaps in the full file later, keeping likes, plays,
links and the song page.

Full audio can't come from an ISRC: the stores only share artwork, details and 30-second previews, and their full
streams are copy-protected. The full file is the master you uploaded to your distributor. Artists can only add ISRCs credited to their artist name; admins can add
any. Each recording can only be on HitVerse once.

## Song pages and streaming links (like HyperFollow)

Every song has a public page at `/listen/<song>` that works without signing in: artwork, a 30-second preview,
a **Listen free on HitVerse** button, and a button for each platform the song is on (Spotify, Apple Music,
YouTube Music, Audiomack, Boomplay, YouTube, Deezer, TIDAL, Amazon Music, SoundCloud). **Share song page** in any
song's menu copies this link, and shared links show the title and artwork as a preview card in production.

- **Finding links:** Admin → **Streaming links** → **Find links automatically**. It fills in only the platforms a song
  is missing; links you set by hand are never replaced.
  1. Apple Music is searched for an exact title and artist match (no key needed).
  2. With `MUSICLINK_API_KEY` set ([musiclink.one](https://musiclink.one), free plan 300 lookups a month), MusicLink
     takes the song's ISRC or one link it already has (e.g. the Apple Music one) and returns Spotify, YouTube Music,
     Audiomack, Boomplay, Deezer, TIDAL and Amazon Music. Songs it uses get a small "found with MusicLink" credit.
  3. With `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`, Spotify is searched directly too.
  For a song that isn't on Apple Music, add its ISRC (DistroKid shows it for each track) in the song's **Edit**
  dialog, or paste one link there; the dialog works out which platform a pasted link belongs to.
  A DistroKid HyperFollow link goes under **All platforms**.
- **More platforms:** if a song has no HyperFollow-style link, the page links to song.link, which lists every
  platform it can find.
- **Who can edit:** admins for any song; approved artists for their own uploads (from the Upload page).
- **Clicks:** each Listen button click is counted per platform and shown in the Streaming links tab.
- Links are only accepted from each platform's own domain, over https.

## Karaoke

Fans tap the **microphone** button in the player to hear the song without the vocals. The music doesn't stop: the
player swaps to the beat at the same spot and opens the lyrics. Karaoke stays on from song to song.

**On demand:** if a song has no beat yet, the fan's tap makes one. HitVerse removes the vocals (about a minute),
publishes the beat, and the player switches over by itself. The artist (or the admins, for the built-in catalog) is
notified and can listen, upload their own beat to replace it, or turn karaoke off for that song, which also stops
fans from asking again. Fans can ask for up to 20 new beats an hour.

Artists (and admins, for any song) can also prepare beats ahead of time from the **microphone** button next to each
upload, or from Admin, then **Karaoke & DJ**:

- **Upload your beat**: the instrumental from the producer. Best quality, and it goes live straight away. It must be
  the same length as the song (within 4 seconds) so the synced lyrics still line up.
- **Remove the vocals for me**: HitVerse separates the voice from the beat with [Demucs](https://github.com/facebookresearch/demucs)
  (open source) on its own server. It takes under a minute on a Mac with Apple silicon. The beat waits as "ready
  to check" until the owner presses **Publish**, or a fan asks for karaoke.

## DJ mode

With DJ mode on (the **disc** button), each song blends into the next like a DJ set:

- Every song is analysed once (tempo, beat grid, and where to mix in and out) when it's uploaded, and the whole
  catalog on server start. Admin, then **Karaoke & DJ** shows each song's BPM.
- When the next song's tempo is within 8%, it's sped up or slowed down to match, started on a downbeat, and kept
  locked to the beat (within a few milliseconds) while the two play. The basslines swap halfway, then the new song
  eases back to its own tempo. Songs too far apart get a quick filter fade instead.
- Listeners choose the mix length (4, 8 or 16 bars), turn tempo matching off, or press **Mix now** to blend into
  the next song straight away.

DJ mode uses the browser's Web Audio mixer. iPhones pause Web Audio when the screen locks, so normal playback
(DJ mode off) doesn't use it and keeps playing in the background.

### Audio tools setup

Karaoke beats made by HitVerse and DJ-mode analysis need Python 3.11 and ffmpeg on the server:

```bash
cd server/audio-tools
uv venv --python 3.11 .venv            # or: python3.11 -m venv .venv
uv pip install --python .venv/bin/python demucs==4.0.1 librosa soundfile
```

The API finds `server/audio-tools/.venv/bin/python` by itself (or set `AUDIO_TOOLS_PYTHON`). Demucs downloads its
model (about 80 MB) the first time. Without the tools, artists can still upload their own beats, and DJ mode still
crossfades, just without beat matching.

## Premium

Karaoke and DJ mode are **Premium** features. Premium is time-limited: it ends on a date unless it's renewed.

- The server enforces it: accounts without Premium don't receive karaoke beats or DJ beat data, and can't ask for
  new beats. In the app, the karaoke and DJ buttons show a small crown and open a "this is Premium" prompt.
- Admins always have Premium. Until card payments are connected, admins switch it on from Admin, then **Premium**
  (search an account, then **+1 month**, **+1 year** or **End**). The person gets a notification.
- Fans see what's included and the plans at `/app/premium` (also in the account menu): ₦300 a week, ₦1,000 a month
  or ₦10,000 a year. Change them with `PREMIUM_WEEKLY_NGN`, `PREMIUM_MONTHLY_NGN` and `PREMIUM_YEARLY_NGN`.

## Prices and HitVerse's cut

Every price lives in `server/src/lib/pricing.js` (card payments aren't connected yet; when they are, every charge and
payout is worked out from there). The site reads them through the public `pricing` query.

- **Artists keep 85%** of what fans pay them: bants, battle backing, fan-base memberships, live tickets and tips.
  HitVerse's 15% covers card fees, VAT on the fee, refunds and payouts. Founding artists pay 9.99% for their first
  12 months.
- **Bants**, from ₦100 to ₦1,000,000: Puff ₦100, Fire ₦500, Extinguisher ₦1,000, Receipts ₦5,000, Smoke Bomb ₦20,000,
  Thunder ₦100,000, Diamond ₦500,000 and Crown ₦1,000,000. Small bants come out of coins; big ones are paid directly
  by card or bank transfer (Paystack's fee is capped at ₦2,000, so a ₦1,000,000 bant costs about 0.2% to take).
- **Coin packs**: ₦500, ₦1,000 and ₦2,000. Each is under ₦2,500, where Paystack waives its ₦100 flat fee.

## Live rooms

Artists open **voice** rooms (up to 50 fans) or **video** rooms (up to 16) at `/app/live` and pick which fans to
invite from their fan base. Invited fans get a notification and a **Live** badge in the dock; nobody else can see or
join the room.

- Go live now or schedule it (invitees are notified again when it starts).
- **Fans can talk** on or off. Off: fans join muted and raise a hand; the host lets them speak.
- The host can mute a fan, remove them for good, invite more fans, or end the room for everyone.
- Admins can host for any artist (for example DAMODOT's page) and moderate any room.

The calls run on [LiveKit](https://livekit.io) (open source). For development, `npm run live:up` starts a local
LiveKit server in Docker with the development keys in `.env.example`. For production, use LiveKit Cloud or run
LiveKit on your own server, and set `LIVEKIT_URL`, `LIVEKIT_PUBLIC_URL` (wss://...), `LIVEKIT_API_KEY` and
`LIVEKIT_API_SECRET`.

## Interface components

The app UI uses these React Bits components (copied unchanged into `client/src/components/ui/`, MIT + Commons Clause):

| Component | Where |
| --- | --- |
| Dock | main navigation, floating at the bottom of every app page (replaces the sidebar and phone tabs) |
| FlipCard | the playing song's artwork in the full-screen player; flip it for likes, rating, plays and length |
| Grainient, TiltedCard, BlurText, StarBorder, GlassIcons, ClickSpark | the public song page (`/listen/<song>`): background in the cover's colours, tilting artwork with the preview, title reveal, "Listen free on HitVerse", and every platform as a glass tile. Visitors' last-picked app comes first as "Open in …" |
| SwipeToast | every toast (`client/src/lib/toast.js`); swipe down to dismiss |
| BellToggle | the notification bell; lit means alerts are on, with the unread count |
| WakeSlider | volume |
| FuseButton | actions with a 6-second Undo before they run: approve, decline, remove access, delete song (`UndoButton`) |
| PulseHeart | likes, with each song's like count |
| GlareHover | the hover on album and single cards: a streak of light across the artwork, a glow and wash in the cover's colour, and a frosted play button (plain CSS per card, no WebGL) |
| PeekRating | 1-5 star ratings in the full-screen player |
| AeroShards | the full-screen player's background, tinted from the cover art; needs WebGPU, otherwise a blurred cover |
| ParticleText, FlexCarousel | the landing page heading and photo gallery |

## Production

```bash
npm run build                 # builds client/dist
npm start                     # Express serves the API and the built site on $PORT
```

Set `NODE_ENV=production`, a long random `JWT_SECRET`, `MONGODB_URI`, and `CLIENT_URL` (your public URL, used in reset links).
The session cookie is `secure` in production, so serve it over HTTPS.

## Layout

```
client/            React 19 + Vite + Tailwind CSS v4 + TanStack Query
  src/lib/api.js   gql() for GraphQL, upload() for file uploads (with progress)
  src/lib/fields.js shared GraphQL field selections
  src/components/  ui/ (Radix-based), player/, layout/, site/ (public nav and footer), React Bits components
  src/context/     AuthContext, PlayerContext (audio engine), ThemeContext
  src/hooks/       useLibrary, useArtist (uploads, admin), useArtists (pages, fan bases), useLinks, useLyricsEdit,
                   useNotifications, useAudioTools (karaoke, DJ analysis), useLive (live rooms)
  src/lib/mixEngine.js  the two-deck player engine for DJ mode and karaoke switching
  src/pages/       Landing, Artists, ArtistPage, Listen, Login, Signup, Forgot/ResetPassword,
                   app/* (Home, Songs, Albums, Liked, Lyrics, FanBases, Artist, ProfileEditor, Admin, Live, LiveRoom)
  public/media/    optimized images (WebP), videos (720p), and the built-in songs
server/            Express 5 + GraphQL Yoga + Mongoose
  src/graphql/     schema.js, context.js (session, sign-in checks), errors.js, resolvers/*
  src/models/      User, Artist, Follow, Song, Album, Rating, Notification, LiveRoom
  src/routes/      uploads.js (songs, audio, karaoke beats, profile images), media.js (streams GridFS files)
  src/lib/         artists, isrc, audio (ffmpeg), audioTools (karaoke + DJ jobs), live (LiveKit), storage (GridFS), ...
  audio-tools/     separate.py (Demucs: removes vocals), analyze.py (librosa: tempo, beats, mix points)
  src/seed/        catalog.js + lyrics.json + artists.js -> MongoDB
  src/scripts/     make-admin.js, media-to-db.js
scripts/           one-time tools used to migrate from the original repo
```

## API

Almost everything goes through **GraphQL at `POST /graphql`**. The full schema, with descriptions, is in
[server/src/graphql/schema.js](server/src/graphql/schema.js). In development, open http://localhost:4000/graphql
to explore it in GraphiQL. Sign-in uses the same httpOnly session cookie as before.

- **Queries:** `me`, `songs`, `albums`, `album`, `lyrics`, `myLikes`, `myRatings`, `listen` (public),
  `notifications`, `artists` (public), `artist(slug)` (public), `myFanBases`, `studio`, `isrcLookup`,
  `liveRooms`, `liveRoom`, `myFans`, `audioToolsReady`, and `admin { artists songs links storage profiles }`.
  Songs carry `karaoke` (the published beat), `mix` (beat grid) and, for owners and admins, `karaokeInfo`.
- **Mutations:** sign-up and sign-in, plays, likes, ratings, `follow` / `unfollow` / `rep`, `applyAsArtist`,
  `updateArtistProfile`, links, lyrics and credits, karaoke (`makeKaraoke`, `publishKaraoke`, `deleteKaraoke`),
  DJ analysis (`analyzeMix`, `adminAnalyzeAllMixes`), live rooms (`createLiveRoom`, `startLiveRoom`,
  `inviteToLiveRoom`, `joinLiveRoom`, `endLiveRoom`, `liveSetSpeaker`, `liveRemove`), and the admin actions.
- **Errors** carry `extensions.code` (`BAD_USER_INPUT`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`)
  and, for form errors, `extensions.field`.
- **Limits:** query depth 8, 15 aliases, a cost limit, and no field suggestions in production. Sign-in, sign-up and
  link clicks are rate limited.

Plain HTTP is used only for files:

| Method | Path | Who | Notes |
|---|---|---|---|
| POST | /api/artist/songs | approved artist | multipart: title, audio, cover (optional), lyrics (optional) |
| POST | /api/artist/songs/isrc | approved artist | multipart: isrc or link, audio (the full song) |
| PUT | /api/artist/songs/:id/audio | admin or owner | replaces a song's audio |
| POST | /api/artist/songs/:id/karaoke | admin or owner | multipart: audio (the beat, same length as the song) |
| POST | /api/artist/profile/:artistId/image/:kind | admin or owner | `avatar` or `banner`, JPG/PNG/WebP |
| GET | /api/media/:id | anyone | streams an uploaded file; supports range requests for seeking |
| GET | /api/health | anyone | |


## Adding a song to the built-in catalog

Artists use the upload page. To change DAMODOT's own catalog instead:

1. Put the mp3 in `client/public/media/audio/` and the cover (WebP, ~800px) in `client/public/media/img/`.
2. Add an entry to `server/src/seed/catalog.js` and its lyrics (one string per line) to `server/src/seed/lyrics.json`.
3. Run `npm run seed`. It updates by slug and never touches users or likes.
