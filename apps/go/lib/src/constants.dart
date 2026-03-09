enum AppENV { staging, production }

// NOTE: Update this before you build app.
const ENVIRONMENT = AppENV.staging;

const isStaging = ENVIRONMENT == AppENV.staging;
const API_BASE_URL = isStaging
    ? 'https://rentloop-api-staging.fly.dev'
    : 'https://rentloop-api-staging.fly.dev';

const WEBSITE = isStaging
    ? 'https://rentloop.fly.dev'
    : 'https://rentloop.fly.dev';

const SENTRY_DSN = '';
//TODO: paste rentloop_go sentry dsn
