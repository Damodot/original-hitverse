// Field lists shared by GraphQL queries, so every screen gets the same shape of data.
export const SONG = `
  _id slug title artist artistId audio cover album trackNumber duration hasLyrics hasSynced previewOnly
  uploader createdAt plays likeCount ratingSum ratingCount links isrc
  artistProfile { slug name }
  karaoke karaokeState mix { bpm firstBeat mixIn mixOut }
`;
export const KARAOKE_INFO = 'karaokeInfo { status source audio published hidden error updatedAt } mixStatus';
export const MY_SONG = `${SONG} linkClicks ${KARAOKE_INFO}`;
export const APPLICATION = 'status name bio link appliedAt reviewedAt note';
export const ARTIST_CARD = `
  _id slug name avatar banner genre location verified featured followerCount
  fanBase { name member } welcome
`;
export const ARTIST = `
  ${ARTIST_CARD} bio onboarded showcaseVideo showcasePoster songCount isFollowing isRepping canEdit
  socials { instagram tiktok x youtube facebook website }
  gallery { src title alt }
`;
export const USER = `
  id _id firstName lastName email role canUpload hasPremium
  premium { active until plan source }
  artist { ${APPLICATION} }
  repping { ${ARTIST_CARD} }
  artistProfile { _id slug name onboarded avatar fanBase { name member } }
`;
