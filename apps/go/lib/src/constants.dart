enum AppENV { staging, production }

// NOTE: Update this before you build app.
const ENVIRONMENT = AppENV.staging;

const isStaging = ENVIRONMENT == AppENV.staging;
const API_BASE_URL = isStaging
    ? 'https://api.rentloopapp.com'
    : 'https://api.rentloopapp.com';

const WEBSITE = isStaging
    ? 'https://rentloopapp.com'
    : 'https://rentloopapp.com';

const SENTRY_DSN = String.fromEnvironment('SENTRY_DSN');

const APPSFLYER_DEV_KEY = String.fromEnvironment('APPSFLYER_DEV_KEY');
const APPSFLYER_APP_ID_IOS = String.fromEnvironment('APPSFLYER_APP_ID_IOS');
const APPSFLYER_IS_DEBUG = isStaging;

const R2_UPLOAD_URL = isStaging
    ? 'https://pm.rentloopapp.com/api/r2/upload'
    : 'https://pm.rentloopapp.com/api/r2/upload';
