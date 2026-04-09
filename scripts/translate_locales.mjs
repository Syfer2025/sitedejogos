import fs from 'fs';

async function translateText(text, targetLang) {
  if (!text) return text;
  
  // Replace {var} with HTML to prevent translation
  let varMap = {};
  let counter = 0;
  let processedText = text.replace(/\{([^}]+)\}/g, (match, p1) => {
    let key = `__VAR${counter}__`;
    varMap[key] = p1;
    counter++;
    return `<span translate="no">${key}</span>`;
  });

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(processedText)}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    let translated = "";
    if (data && data[0]) {
      data[0].forEach(seg => {
        if (seg[0]) translated += seg[0];
      });
    } else {
      translated = text;
    }
    
    // Restore variables
    translated = translated.replace(/<span translate="no">([^<]+)<\/span>/g, (match, p1) => {
      let originalVar = varMap[p1.trim()];
      return originalVar ? `{${originalVar}}` : match;
    });

    // Handle any mangled spacing around formatting
    translated = translated.replace(/\{\s+([^}]+)\s+\}/g, '{$1}');

    return translated;
  } catch (err) {
    console.error(`Error translating to ${targetLang}:`, err);
    return text;
  }
}

async function translateObj(obj, targetLang) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = await translateText(value, targetLang);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = await translateObj(value, targetLang);
    } else {
      result[key] = value;
    }
  }
  return result;
}

const locales = {
  "es-MX": "es",
  "es-CO": "es",
  "es-AR": "es",
  "es-ES": "es",
  "fr-FR": "fr",
  "de-DE": "de",
  "ru-RU": "ru",
  "pl-PL": "pl",
  "zh-CN": "zh-CN",
  "hi-IN": "hi",
  "bn-BD": "bn",
  "vi-VN": "vi",
  "th-TH": "th",
  "ms-MY": "ms",
  "id-ID": "id",
  "fil-PH": "tl",
  "ar-EG": "ar",
  "ar-SA": "ar",
  "tr-TR": "tr",
  "ur-PK": "ur"
};

const enUsPath = './src/messages/en-US.json';
const enUs = JSON.parse(fs.readFileSync(enUsPath, 'utf8'));

// Cache translations by target lang to avoid duplicate calls for es, ar
const cache = {};

async function run() {
  for (const [locale, langCode] of Object.entries(locales)) {
    console.log(`Processing ${locale} (${langCode})...`);
    let translatedObj;
    if (cache[langCode]) {
      translatedObj = cache[langCode];
    } else {
      translatedObj = await translateObj(enUs, langCode);
      cache[langCode] = translatedObj;
    }
    fs.writeFileSync(`./src/messages/${locale}.json`, JSON.stringify(translatedObj, null, 2) + '\n', 'utf8');
    console.log(`Saved ${locale}.json`);
  }
}

run().catch(console.error);
