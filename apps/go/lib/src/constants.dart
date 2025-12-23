enum AppENV { staging, production }

// NOTE: Update this before you build app.
const ENVIRONMENT = AppENV.staging;

const isStaging = ENVIRONMENT == AppENV.staging;
const API_BASE_URL = isStaging
    ? 'https://myles-engine-staging.fly.dev/graphql'
    : 'https://server.mylespudo.com/graphql';

const WEBSITE = isStaging
    ? 'https://staging.rentloop.com'
    : 'https://rentloop.com';

const SENTRY_DSN = '';
//TODO: paste rentloop_go sentry dsn
