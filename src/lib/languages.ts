// ISO 639-1 language codes covering the world's ~50 most-spoken languages.

export interface Language {
  code: string;     // ISO 639-1 lowercase
  name: string;     // native autonym
  english: string;  // English name
}

const RAW: ReadonlyArray<Language> = [
  { code: "af", name: "Afrikaans",  english: "Afrikaans" },
  { code: "ar", name: "العربية",     english: "Arabic" },
  { code: "az", name: "Azərbaycan",  english: "Azerbaijani" },
  { code: "be", name: "Беларуская",  english: "Belarusian" },
  { code: "bg", name: "Български",   english: "Bulgarian" },
  { code: "bn", name: "বাংলা",        english: "Bengali" },
  { code: "bs", name: "Bosanski",    english: "Bosnian" },
  { code: "ca", name: "Català",      english: "Catalan" },
  { code: "cs", name: "Čeština",     english: "Czech" },
  { code: "da", name: "Dansk",       english: "Danish" },
  { code: "de", name: "Deutsch",     english: "German" },
  { code: "el", name: "Ελληνικά",    english: "Greek" },
  { code: "en", name: "English",     english: "English" },
  { code: "es", name: "Español",     english: "Spanish" },
  { code: "et", name: "Eesti",       english: "Estonian" },
  { code: "fa", name: "فارسی",        english: "Persian" },
  { code: "fi", name: "Suomi",       english: "Finnish" },
  { code: "fil", name: "Filipino",   english: "Filipino" },
  { code: "fr", name: "Français",    english: "French" },
  { code: "gu", name: "ગુજરાતી",       english: "Gujarati" },
  { code: "he", name: "עברית",        english: "Hebrew" },
  { code: "hi", name: "हिन्दी",        english: "Hindi" },
  { code: "hr", name: "Hrvatski",    english: "Croatian" },
  { code: "hu", name: "Magyar",      english: "Hungarian" },
  { code: "id", name: "Indonesia",   english: "Indonesian" },
  { code: "is", name: "Íslenska",    english: "Icelandic" },
  { code: "it", name: "Italiano",    english: "Italian" },
  { code: "ja", name: "日本語",       english: "Japanese" },
  { code: "kk", name: "Қазақ",       english: "Kazakh" },
  { code: "km", name: "ខ្មែរ",          english: "Khmer" },
  { code: "kn", name: "ಕನ್ನಡ",        english: "Kannada" },
  { code: "ko", name: "한국어",       english: "Korean" },
  { code: "lo", name: "ລາວ",         english: "Lao" },
  { code: "lt", name: "Lietuvių",    english: "Lithuanian" },
  { code: "lv", name: "Latviešu",    english: "Latvian" },
  { code: "ml", name: "മലയാളം",       english: "Malayalam" },
  { code: "mn", name: "Монгол",      english: "Mongolian" },
  { code: "mr", name: "मराठी",         english: "Marathi" },
  { code: "ms", name: "Bahasa Melayu", english: "Malay" },
  { code: "my", name: "မြန်မာ",         english: "Burmese" },
  { code: "nb", name: "Norsk Bokmål", english: "Norwegian" },
  { code: "ne", name: "नेपाली",        english: "Nepali" },
  { code: "nl", name: "Nederlands",  english: "Dutch" },
  { code: "pa", name: "ਪੰਜਾਬੀ",        english: "Punjabi" },
  { code: "pl", name: "Polski",      english: "Polish" },
  { code: "pt", name: "Português",   english: "Portuguese" },
  { code: "ro", name: "Română",      english: "Romanian" },
  { code: "ru", name: "Русский",     english: "Russian" },
  { code: "si", name: "සිංහල",        english: "Sinhala" },
  { code: "sk", name: "Slovenčina",  english: "Slovak" },
  { code: "sl", name: "Slovenščina", english: "Slovenian" },
  { code: "sq", name: "Shqip",       english: "Albanian" },
  { code: "sr", name: "Српски",      english: "Serbian" },
  { code: "sv", name: "Svenska",     english: "Swedish" },
  { code: "sw", name: "Kiswahili",   english: "Swahili" },
  { code: "ta", name: "தமிழ்",        english: "Tamil" },
  { code: "te", name: "తెలుగు",        english: "Telugu" },
  { code: "th", name: "ไทย",          english: "Thai" },
  { code: "tr", name: "Türkçe",      english: "Turkish" },
  { code: "uk", name: "Українська",  english: "Ukrainian" },
  { code: "ur", name: "اردو",         english: "Urdu" },
  { code: "uz", name: "Oʻzbek",      english: "Uzbek" },
  { code: "vi", name: "Tiếng Việt",  english: "Vietnamese" },
  { code: "zh", name: "中文",         english: "Chinese" },
];

export const LANGUAGES: ReadonlyArray<Language> = [...RAW].sort((a, b) =>
  a.english.localeCompare(b.english),
);

export const LANGUAGE_CODES: ReadonlyArray<string> = LANGUAGES.map((l) => l.code);

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l] as const));

export function languageByCode(code: string | null | undefined): Language | undefined {
  if (!code) return undefined;
  return BY_CODE.get(code.toLowerCase());
}

export function isLanguageCode(code: string): boolean {
  return BY_CODE.has(code.toLowerCase());
}

export function parseLanguages(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((c): c is string => typeof c === "string" && isLanguageCode(c));
  } catch {
    return [];
  }
}
