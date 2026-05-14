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

const SENTRY_DSN =
    'https://a6014082c6d3ed50a49560a464511c64@o949044.ingest.us.sentry.io/4511387637317632';

const APPSFLYER_DEV_KEY = 'YsRgxuvyndybkdDmTioVYJ';
const APPSFLYER_APP_ID_IOS = '6760318488';
const APPSFLYER_IS_DEBUG = isStaging;

const R2_UPLOAD_URL = isStaging
    ? 'https://pm.rentloopapp.com/api/r2/upload'
    : 'https://pm.rentloopapp.com/api/r2/upload';
