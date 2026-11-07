// The HitVerse GraphQL schema. Plain HTTP is only used for file uploads (/api/artist/...), audio and image
// streaming (/api/media/:id) and, later, payment-provider webhooks.
export const typeDefs = /* GraphQL */ `
  scalar JSON
  scalar DateTime

  type Query {
    "The signed-in account, or null."
    me: User
    songs: [Song!]!
    albums: [Album!]!
    album(slug: String!): AlbumWithSongs
    lyrics(slug: String!): Lyrics
    "IDs of songs the signed-in fan liked, oldest first."
    myLikes: [ID!]!
    "{ songId: 1-5 } for the signed-in fan."
    myRatings: JSON!
    "Public song page (no sign-in needed)."
    listen(slug: String!): ListenSong
    notifications: NotificationFeed!

    "Artists on HitVerse, featured first then by fan base size. Public."
    artists(featured: Boolean, limit: Int): [Artist!]!
    "An artist's public page."
    artist(slug: String!): Artist
    "Fan bases the signed-in fan follows."
    myFanBases: [Artist!]!

    "The signed-in artist's area: account, own profile and uploads."
    studio: Studio!
    "Look a released song up by ISRC or streaming link before adding it."
    isrcLookup(query: String!): IsrcLookup!

    "Admin-only queries."
    admin: Admin!

    "Whether this server can make karaoke beats and analyse songs for DJ mode itself."
    audioToolsReady: Boolean!
    "One song (signed-in)."
    song(id: ID!): Song
    "Premium plans and prices."
    premiumPlans: [PremiumPlan!]!
    "HitVerse's cut, the bants and their prices, coin packs and Premium plans."
    pricing: Pricing!

    "Live rooms I host or I'm invited to (not ended, or ended in the last day)."
    liveRooms: [LiveRoom!]!
    liveRoom(id: ID!): LiveRoom
    "Fans in this artist's fan base, for the host to invite. Artist owners and admins."
    myFans(artistId: ID!, search: String, limit: Int): [LiveFan!]!
  }

  type Mutation {
    signup(firstName: String!, lastName: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    logout: Boolean!
    forgotPassword(email: String!): String!
    resetPassword(token: String!, password: String!): AuthPayload!

    recordPlay(songId: ID!): Boolean!
    "Returns the song's new like count."
    like(songId: ID!): Int!
    unlike(songId: ID!): Int!
    "value 1-5, or 0 to clear."
    rate(songId: ID!, value: Int!): RatingResult!
    listenClick(slug: String!, platform: String!): Boolean!
    markNotificationsRead(ids: [ID!]): Boolean!

    follow(artistId: ID!): Artist!
    unfollow(artistId: ID!): Artist!
    "Represent this fan base (must be following it)."
    rep(artistId: ID!): User!

    applyAsArtist(name: String!, bio: String!, link: String): User!
    updateArtistProfile(artistId: ID!, input: ArtistProfileInput!): Artist!
    deleteMySong(songId: ID!): Boolean!

    saveLinks(songId: ID!, links: JSON!, isrc: String, credits: [String!]): SavedLinks!
    findLinks(songId: ID!, isrc: String): JSON!
    saveLyrics(songId: ID!, lines: [String!]!, synced: [SyncedLineInput!]): LyricsSaved!
    saveCredits(songId: ID!, writers: [String!], producers: [String!]): Credits
    findLyricsOnline(songId: ID!): JSON!

    adminDecideArtist(userId: ID!, status: String!, note: String): User!
    adminDeleteSong(songId: ID!): Boolean!
    adminFindAllLinks: JSON!
    adminSetArtistFlags(artistId: ID!, featured: Boolean, verified: Boolean): Artist!

    "Admin: add days of Premium to an account (0 ends it now)."
    adminSetPremium(userId: ID!, days: Int!, plan: String): User!
    "A fan asks for karaoke (Premium): publishes the beat, or makes one now and publishes it when it's ready."
    requestKaraoke(songId: ID!): Song!
    "Remove the vocals with Demucs to make a karaoke beat. It stays unpublished until you publish it."
    makeKaraoke(songId: ID!): Song!
    publishKaraoke(songId: ID!, published: Boolean!): Song!
    deleteKaraoke(songId: ID!): Song!
    "Find the song's tempo, beats and mix points again (for DJ mode)."
    analyzeMix(songId: ID!): Song!
    "Analyse every song for DJ mode. Returns how many were queued."
    adminAnalyzeAllMixes: Int!

    createLiveRoom(input: LiveRoomInput!): LiveRoom!
    "Open a scheduled room now."
    startLiveRoom(id: ID!): LiveRoom!
    inviteToLiveRoom(id: ID!, userIds: [ID!]!): LiveRoom!
    "A pass to join the call."
    joinLiveRoom(id: ID!): LiveJoin!
    endLiveRoom(id: ID!): LiveRoom!
    "Host: let a fan speak, or stop them."
    liveSetSpeaker(id: ID!, userId: ID!, canSpeak: Boolean!): Boolean!
    "Host: remove a fan from the room for good."
    liveRemove(id: ID!, userId: ID!): Boolean!
  }

  type AuthPayload { user: User! }

  type User {
    _id: ID!
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    role: String!
    canUpload: Boolean!
    "Their artist application, if any."
    artist: ArtistApplication!
    "The artist profile this account owns, if any."
    artistProfile: Artist
    "The fan base they're representing."
    repping: Artist
    "Can use Premium features (karaoke, DJ mode). Only for the account itself."
    hasPremium: Boolean!
    premium: Premium
  }
  type Premium {
    active: Boolean!
    until: DateTime
    "weekly | monthly | yearly | gift"
    plan: String
    "admin | payment"
    source: String
  }
  type PremiumPlan { id: ID!, name: String!, days: Int!, priceNgn: Int! }
  type BantTier { id: ID!, name: String!, priceNgn: Int! }
  type Pricing {
    "What artists keep of every fan payment, e.g. 85."
    artistKeepsPercent: Float!
    hitverseFeePercent: Float!
    "The lower fee founding artists pay for their first months."
    foundingFeePercent: Float!
    foundingMonths: Int!
    bants: [BantTier!]!
    topUpsNgn: [Int!]!
    premiumPlans: [PremiumPlan!]!
  }

  type ArtistApplication {
    status: String!
    name: String
    bio: String
    link: String
    appliedAt: DateTime
    reviewedAt: DateTime
    note: String
  }

  type Song {
    _id: ID!
    slug: String!
    title: String!
    "Display credit, e.g. 'Damodot & DJ Great'."
    artist: String!
    artistId: ID
    artistProfile: Artist
    audio: String!
    cover: String!
    album: ID
    trackNumber: Int
    duration: Float
    hasLyrics: Boolean
    hasSynced: Boolean
    previewOnly: Boolean
    uploader: ID
    createdAt: DateTime
    plays: Int
    likeCount: Int
    ratingSum: Float
    ratingCount: Int
    links: JSON
    isrc: String
    "Clicks on each 'Listen on' button. Only for the song's owner and admins."
    linkClicks: JSON
    "The karaoke beat (the song without vocals), once it's published."
    karaoke: String
    "ready | making | none | failed | off (the artist turned it off) | unavailable (30-second preview)"
    karaokeState: String!
    "Karaoke status and the unpublished beat to check. Only for the song's owner and admins."
    karaokeInfo: KaraokeInfo
    "Beat grid and mix points for DJ mode, once analysed."
    mix: MixInfo
    "none | queued | ready | failed"
    mixStatus: String!
  }

  type KaraokeInfo {
    "none | queued | processing | ready | failed"
    status: String!
    "upload (the artist's own beat) | auto (vocals removed by HitVerse)"
    source: String
    audio: String
    published: Boolean!
    "The artist turned karaoke off: fans can't ask for a beat."
    hidden: Boolean!
    error: String
    updatedAt: DateTime
  }
  "Beat n is at firstBeat + n * 60 / bpm (seconds). bpm is null if the song has no steady beat."
  type MixInfo { bpm: Float, firstBeat: Float!, mixIn: Float!, mixOut: Float }

  type Album {
    _id: ID!
    slug: String!
    title: String!
    artist: String
    artistId: ID
    cover: String!
    type: String
    order: Int
    trackCount: Int
  }

  type AlbumWithSongs { album: Album!, songs: [Song!]! }

  type SyncedLine { t: Float!, text: String! }
  input SyncedLineInput { t: Float!, text: String! }
  type Credits { writers: [String!], producers: [String!] }

  type Lyrics {
    slug: String!
    title: String!
    lyrics: [String!]!
    synced: [SyncedLine!]
    credits: Credits
  }
  type LyricsSaved { lyrics: [String!]!, synced: [SyncedLine!] }

  type RatingResult { value: Int!, ratingSum: Float!, ratingCount: Int! }

  type ListenAlbum { title: String!, type: String }
  type ListenSong {
    slug: String!
    title: String!
    artist: String!
    artistSlug: String
    cover: String!
    preview: String!
    duration: Float
    album: ListenAlbum
    links: JSON!
    "Services that supplied the links (for the credit on the page)."
    linkCredits: [String!]!
  }

  type SavedLinks { links: JSON!, isrc: String }

  type Notification {
    _id: ID!
    type: String!
    title: String!
    body: String
    link: String
    read: Boolean!
    createdAt: DateTime!
  }
  type NotificationFeed { items: [Notification!]!, unread: Int! }

  type FanBase { name: String!, member: String! }
  type Socials { instagram: String, tiktok: String, x: String, youtube: String, facebook: String, website: String }
  type GalleryItem { src: String!, title: String, alt: String }

  type Artist {
    _id: ID!
    slug: String!
    name: String!
    bio: String!
    genre: String!
    location: String!
    avatar: String!
    banner: String!
    socials: Socials!
    fanBase: FanBase!
    welcome: String!
    gallery: [GalleryItem!]!
    showcaseVideo: String!
    showcasePoster: String!
    featured: Boolean!
    verified: Boolean!
    onboarded: Boolean!
    followerCount: Int!
    songCount: Int!
    songs: [Song!]!
    "For the signed-in viewer."
    isFollowing: Boolean!
    isRepping: Boolean!
    canEdit: Boolean!
  }

  input SocialsInput { instagram: String, tiktok: String, x: String, youtube: String, facebook: String, website: String }
  input ArtistProfileInput {
    name: String
    bio: String
    genre: String
    location: String
    socials: SocialsInput
    fanBaseName: String
    fanBaseMember: String
    welcome: String
  }

  type Studio { user: User!, songs: [Song!]!, profile: Artist }

  type IsrcTrack {
    isrc: String!
    title: String!
    artist: String
    artwork: String
    duration: Float
    hasPreview: Boolean!
    links: JSON!
  }
  type SongRef { _id: ID!, slug: String!, title: String! }
  type IsrcLookup { track: IsrcTrack!, existing: SongRef, canAdd: Boolean!, reason: String }

  type Admin {
    artists(status: String): AdminArtists!
    songs: [AdminSong!]!
    links: AdminLinks!
    storage: Storage!
    profiles: [Artist!]!
    "Accounts by name or email; with no search, current Premium members."
    premiumMembers(search: String): [User!]!
  }
  type AdminArtists { counts: JSON!, artists: [AdminArtist!]! }
  type AdminArtist {
    _id: ID!
    firstName: String!
    lastName: String!
    email: String!
    artist: ArtistApplication!
    createdAt: DateTime
    songCount: Int!
    profile: Artist
  }
  type UploaderRef { _id: ID!, firstName: String, lastName: String, email: String, artist: ArtistApplication }
  type AdminSong {
    _id: ID!
    slug: String!
    title: String!
    artist: String!
    audio: String!
    cover: String!
    duration: Float
    plays: Int
    createdAt: DateTime
    uploader: UploaderRef
  }
  type AdminLinks { sources: JSON!, songs: [Song!]! }
  type LiveRoom {
    _id: ID!
    title: String!
    "audio | video"
    kind: String!
    "scheduled | live | ended"
    status: String!
    artist: Artist!
    fansCanSpeak: Boolean!
    startsAt: DateTime
    startedAt: DateTime
    endedAt: DateTime
    isHost: Boolean!
    inviteeCount: Int!
    "Only for the host."
    invitees: [LiveFan!]
    peopleInRoom: Int!
  }
  type LiveFan { _id: ID!, name: String! }
  type LiveJoin { token: String!, url: String!, room: LiveRoom! }
  input LiveRoomInput {
    artistId: ID!
    title: String!
    "audio | video"
    kind: String!
    invitees: [ID!]!
    fansCanSpeak: Boolean
    "Leave out to go live now."
    startsAt: DateTime
  }

  type Storage { mediaBytes: Float!, mediaFiles: Int!, totalBytes: Float!, limitBytes: Float!, songs: Int! }
`;
