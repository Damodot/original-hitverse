// The HitVerse catalog, moved out of the old hard-coded hitverse.js.
// Paths are relative to the web root (client/public).
const img = (n) => `/media/img/${n}.webp`;
const mp3 = (n) => `/media/audio/${n}.mp3`;

export const albums = [
  { slug: 'soundcheck', title: "Soundcheck d'Ep", type: 'EP', cover: img('cover-soundcheck'), order: 1 },
  { slug: 'pop', title: "POP d'Ep", type: 'EP', cover: img('cover-pop'), order: 2 },
];

// Listed in the same order as the original site.
export const songs = [
  { slug: 'damsMashup', title: 'Damodot Mashup', artist: 'Damodot & DJ Great', audio: mp3('damodotmashup'), cover: img('cover-mashup'), duration: 1639 },
  { slug: 'onGod', title: 'On God', album: 'soundcheck', trackNumber: 1, audio: mp3('ongod'), cover: img('cover-soundcheck'), duration: 127 },
  { slug: 'koMaGbon', title: 'Ko Ma Gbon', album: 'soundcheck', trackNumber: 2, audio: mp3('komagbon'), cover: img('cover-soundcheck'), duration: 161 },
  { slug: 'cumeAlong', title: 'Cume Along', album: 'soundcheck', trackNumber: 3, audio: mp3('cumealong'), cover: img('cover-soundcheck'), duration: 163 },
  { slug: 'wantingMore', title: 'Wanting More', album: 'soundcheck', trackNumber: 4, audio: mp3('wantingmore'), cover: img('cover-soundcheck'), duration: 131 },
  { slug: 'fckedUp', title: 'Fcked Up', album: 'pop', trackNumber: 1, audio: mp3('fckedup'), cover: img('cover-pop'), duration: 96 },
  { slug: 'mind', title: 'Mind', album: 'pop', trackNumber: 2, audio: mp3('mind'), cover: img('cover-pop'), duration: 159 },
  { slug: 'oshey', title: 'Oshey', album: 'pop', trackNumber: 3, audio: mp3('oshey'), cover: img('cover-pop'), duration: 196 },
  { slug: 'majo', title: 'Majo', album: 'pop', trackNumber: 4, audio: mp3('majo'), cover: img('cover-pop'), duration: 194 },
  { slug: 'bootyCall', title: 'Booty Call', album: 'pop', trackNumber: 5, audio: mp3('bootycall'), cover: img('cover-pop'), duration: 170 },
  { slug: 'bolo', title: 'Bolo', album: 'pop', trackNumber: 6, audio: mp3('bolo'), cover: img('cover-pop'), duration: 158 },
  { slug: 'killaman', title: 'Killaman', audio: mp3('killaman'), cover: img('cover-killaman'), duration: 188 },
  { slug: 'nobody', title: 'Nobody', audio: mp3('nobody'), cover: img('cover-nobody'), duration: 159 },
  { slug: 'bodyBag', title: 'Body Bag', audio: mp3('bodybag'), cover: img('cover-bodybag'), duration: 172 },
];
