import { blockFieldSuggestionsPlugin } from '@escape.tech/graphql-armor-block-field-suggestions';
import { costLimitPlugin } from '@escape.tech/graphql-armor-cost-limit';
import { maxAliasesPlugin } from '@escape.tech/graphql-armor-max-aliases';
import { maxDepthPlugin } from '@escape.tech/graphql-armor-max-depth';
import { createSchema, createYoga } from 'graphql-yoga';
import { config } from '../config.js';
import { buildContext } from './context.js';
import { maskError } from './errors.js';
import { adminResolvers } from './resolvers/admin.js';
import { artistResolvers } from './resolvers/artists.js';
import { audioResolvers } from './resolvers/audio.js';
import { authResolvers } from './resolvers/auth.js';
import { libraryResolvers } from './resolvers/library.js';
import { linkResolvers } from './resolvers/links.js';
import { liveResolvers } from './resolvers/live.js';
import { lyricsResolvers } from './resolvers/lyrics.js';
import { notificationResolvers } from './resolvers/notifications.js';
import { premiumResolvers } from './resolvers/premium.js';
import { scalars } from './resolvers/shared.js';
import { typeDefs } from './schema.js';

const parts = [authResolvers, libraryResolvers, artistResolvers, linkResolvers, lyricsResolvers, notificationResolvers, adminResolvers, audioResolvers, liveResolvers, premiumResolvers];
const merge = (key) => Object.assign({}, ...parts.map((p) => p[key] ?? {}));
// Type resolvers (Song, Artist, ...) can be split across files: merge each type's fields.
const typeResolvers = {};
for (const [type, fields] of parts.flatMap((p) => Object.entries(p))) {
  if (type !== 'Query' && type !== 'Mutation') typeResolvers[type] = { ...typeResolvers[type], ...fields };
}

export const schema = createSchema({
  typeDefs,
  resolvers: { ...scalars, ...typeResolvers, Query: merge('Query'), Mutation: merge('Mutation') },
});

export const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  context: ({ req, res }) => buildContext({ req, res }),
  // The in-browser explorer only in development.
  graphiql: !config.isProd,
  landingPage: false,
  maskedErrors: { maskError },
  plugins: [
    // Stop abusive queries: too deep, too many aliases, too expensive, or fishing for field names.
    maxDepthPlugin({ n: 8 }),
    maxAliasesPlugin({ n: 15 }),
    costLimitPlugin({ maxCost: 5000 }),
    ...(config.isProd ? [blockFieldSuggestionsPlugin()] : []),
  ],
});
