import { GraphQLScalarType, Kind } from 'graphql';
import { PLATFORM_IDS } from '../../lib/platforms.js';

export const SONG_FIELDS = 'slug title artist artistId audio cover album trackNumber duration hasLyrics hasSynced uploader createdAt plays likeCount ratingSum ratingCount links isrc previewOnly karaoke mix';
export const MY_SONG_FIELDS = 'slug title artist artistId audio cover duration plays hasLyrics createdAt links linkClicks isrc previewOnly hasSynced uploader karaoke mix';
export const onlyFilled = (links = {}) => Object.fromEntries(PLATFORM_IDS.filter((id) => links?.[id]).map((id) => [id, links[id]]));

const parseLiteral = (ast) => {
  switch (ast.kind) {
    case Kind.STRING: case Kind.BOOLEAN: return ast.value;
    case Kind.INT: case Kind.FLOAT: return Number(ast.value);
    case Kind.OBJECT: return Object.fromEntries(ast.fields.map((f) => [f.name.value, parseLiteral(f.value)]));
    case Kind.LIST: return ast.values.map(parseLiteral);
    default: return null;
  }
};

export const scalars = {
  JSON: new GraphQLScalarType({
    name: 'JSON',
    description: 'Any JSON value',
    serialize: (v) => v,
    parseValue: (v) => v,
    parseLiteral,
  }),
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'ISO 8601 date-time',
    serialize: (v) => (v ? new Date(v).toISOString() : null),
    parseValue: (v) => new Date(v),
    parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
  }),
};
