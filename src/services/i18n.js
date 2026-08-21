// i18n.js — minimal greeting helper.
//
// Pre-login (Login/Register screens): we don't know the person yet — no
// Profile.language exists until they've signed in. Default to a neutral
// symbol rather than guessing a script. We *can* peek at the device's
// system locale as a soft hint (if it's clearly 'or' or a known language),
// but we never assume Odia by default.
//
// Post-login (Home, etc.): use Profile.language from the day-panchang
// response (see api.js: getDayPanchang -> data.language, once the backend
// includes it) rather than hardcoding a script there either.

import * as Localization from 'expo-localization';

// Neutral, language-agnostic default — folded hands reads as a greeting
// in most cultures without asserting any specific language.
export const NEUTRAL_GREETING_SYMBOL = '🙏';

const GREETINGS = {
  as: 'নমস্কাৰ',       // Assamese
  bn: 'নমস্কার',       // Bengali
  brx: 'नमस्कार',      // Bodo
  doi: 'नमस्कार',      // Dogri
  gu: 'નમસ્તે',        // Gujarati
  hi: 'नमस्ते',        // Hindi
  kn: 'ನಮಸ್ಕಾರ',       // Kannada
  ks: 'नमस्कार',       // Kashmiri
  kok: 'नमस्कार',      // Konkani
  mai: 'प्रणाम',       // Maithili
  ml: 'നമസ്കാരം',      // Malayalam
  mni: 'ꯈꯨꯔꯨꯝꯖꯔꯤ',   // Manipuri
  mr: 'नमस्कार',       // Marathi
  ne: 'नमस्कार',       // Nepali
  or: 'ନମସ୍କାର',       // Odia
  pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',  // Punjabi
  sa: 'नमस्ते',        // Sanskrit
  sat: 'ᱡᱚᱦᱟᱨ',
  sd: 'नमस्ते',
  ta: 'வணக்கம்',
  te: 'నమస్కారం',
  ur: 'سلام',

  en: 'Welcome',
};

/**
 * For screens BEFORE login — best-effort hint from device locale only,
 * always falls back to the neutral symbol. Never used to assume the
 * user's actual preference; that only exists once Profile.language is
 * known after authentication.
 */
export function getPreLoginGreeting() {
  try {
    const deviceLang = Localization.getLocales?.()[0]?.languageCode; // e.g. 'or', 'hi', 'en'
    return GREETINGS[deviceLang] || NEUTRAL_GREETING_SYMBOL;
  } catch {
    return NEUTRAL_GREETING_SYMBOL;
  }
}

/**
 * For screens AFTER login — uses the real, known preference.
 * languageCode should come from the authenticated user's Profile
 * (e.g. response.language on /panchang/day/ once the backend serializer
 * includes it — see note in HomeScreen.js).
 */
export function getGreeting(languageCode) {
  return GREETINGS[languageCode] || GREETINGS.en;
}
