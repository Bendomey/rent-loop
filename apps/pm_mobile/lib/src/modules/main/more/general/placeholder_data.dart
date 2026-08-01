/// Placeholder data for the parts of General Settings that have no API yet.
///
/// Branding (logo, document accent colour) and Regional preferences (currency,
/// time zone, date format, language) are not on ClientModel and the backend
/// has no field for them. The UI is built to the design so it is ready to
/// wire up, but every control toasts via showGeneralComingSoon().
///
/// The edit sheets are the same story for a different reason: the app has no
/// client API class, so nothing here can be saved yet. Reads are live — they
/// come from currentUserNotifierProvider.
library;

const String kPlaceholderAccent = '#C8003A';

const List<String> kPlaceholderAccentSwatches = [
  '#C8003A',
  '#111110',
  '#1B6E4A',
  '#2456C4',
  '#BD5E16',
];

const String kPlaceholderCurrency = 'GHS — Ghana Cedi';
const String kPlaceholderTimezone = 'GMT (Africa/Accra)';
const String kPlaceholderDateFormat = 'DD MMM YYYY';
const String kPlaceholderLanguage = 'English (UK)';

const List<String> kCurrencyOptions = [
  'GHS — Ghana Cedi',
  'USD — US Dollar',
  'NGN — Nigerian Naira',
  'EUR — Euro',
];

const List<String> kTimezoneOptions = [
  'GMT (Africa/Accra)',
  'WAT (Africa/Lagos)',
  'EAT (Africa/Nairobi)',
  'GMT+1 (Europe/London)',
];

const List<String> kDateFormatOptions = [
  'DD MMM YYYY',
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
];

const List<String> kLanguageOptions = [
  'English (UK)',
  'English (US)',
  'French',
];

const List<String> kCountryOptions = ['Ghana', 'Nigeria', 'Kenya'];

const List<String> kBusinessTypeOptions = [
  'Property Manager',
  'Developer',
  'Agency',
];
