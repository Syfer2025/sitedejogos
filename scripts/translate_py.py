import json
import os
from googletrans import Translator
import time

locales = {
  "fr-FR": "fr",
  "de-DE": "de",
  "ru-RU": "ru",
  "pl-PL": "pl",
  "zh-CN": "zh-cn",
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
}

def translate_dict(d, lang, translator):
    res = {}
    for k, v in d.items():
        if isinstance(v, dict):
            res[k] = translate_dict(v, lang, translator)
        else:
            # simple replacement for {xxx}
            parts = []
            import re
            matches = list(re.finditer(r'\{[^\}]+\}', v))
            if not matches:
                try:
                    res[k] = translator.translate(v, dest=lang).text
                except Exception as e:
                    print(f"Error: {e}")
                    res[k] = v
            else:
                # We can just skip variables translation by tricky replacement or just not translate strings with vars for safety
                # But let's try to translate carefully
                var_map = {}
                replaced = v
                for i, m in enumerate(matches):
                    marker = f"_VAR{i}_"
                    var_map[marker] = m.group(0)
                    replaced = replaced.replace(m.group(0), marker)
                try:
                    trans = translator.translate(replaced, dest=lang).text
                    for marker, orig in var_map.items():
                        trans = trans.replace(marker.lower(), orig).replace(marker.upper(), orig).replace(marker, orig)
                    res[k] = trans
                except Exception as e:
                    res[k] = v
            time.sleep(0.1) # small delay
    return res

os.chdir('/Users/alexmeiradossantos/gaming-portal')
with open('src/messages/en-US.json', 'r', encoding='utf-8') as f:
    en_us = json.load(f)

translator = Translator()

cache = {}

for locale, langcode in locales.items():
    print(f"Translating {locale}...")
    if langcode in cache:
        trans_obj = cache[langcode]
    else:
        trans_obj = translate_dict(en_us, langcode, translator)
        cache[langcode] = trans_obj
    
    with open(f'src/messages/{locale}.json', 'w', encoding='utf-8') as f:
        json.dump(trans_obj, f, ensure_ascii=False, indent=2)
    print(f"Saved {locale}")
