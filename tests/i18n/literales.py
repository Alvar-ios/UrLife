# Herramienta (no es una prueba): saca de app.js los trozos de texto de sus cadenas ('…', "…", `…`), sin etiquetas HTML.
# Uso: python3 tests/i18n/literales.py app.js > literales.txt
import re, sys, html, warnings
warnings.filterwarnings("ignore")
src = open(sys.argv[1], encoding='utf8').read()
out = []; i = 0; n = len(src)
while i < n:
    c = src[i]
    if src.startswith('//', i): j = src.find('\n', i); i = n if j < 0 else j; continue
    if src.startswith('/*', i): j = src.find('*/', i + 2); i = n if j < 0 else j + 2; continue
    if c in '\'"`':
        j = i + 1; buf = []
        while j < n and src[j] != c:
            if src[j] == '\\' and j + 1 < n: buf.append(src[j:j+2]); j += 2; continue
            if c != '`' and src[j] == '\n': break
            buf.append(src[j]); j += 1
        s = ''.join(buf)
        try: s = s.encode('latin1', 'backslashreplace').decode('unicode_escape').encode('latin1').decode('utf8')
        except Exception: s = s.replace("\\'", "'").replace('\\"', '"')
        out.append(s); i = j + 1; continue
    i += 1
for s in out:
    for p in re.split(r'<[^>]*>|<[^>]*$|^[^<]*>', s):
        p = html.unescape(re.sub(r'\s+', ' ', p))
        if re.search(r'[A-Za-zÁÉÍÓÚáéíóúñÑ]{2}', p): print(p)
