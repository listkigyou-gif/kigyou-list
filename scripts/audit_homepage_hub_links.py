# -*- coding: utf-8 -*-
import sys, re
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/src/app/[locale]/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Pattern for href={`...`} or href="..."
matches = re.findall(r'href=\{`([^`]+)`\}|href="([^"]+)"', text)
links = set()
for m in matches:
    raw = m[0] or m[1]
    norm = raw.replace("${locale}", "")
    norm = re.sub(r'//+', '/', norm)
    links.add(norm)

print("=== INTERNAL LINKS FOUND IN HOMEPAGE BODY (page.tsx) ===")
for l in sorted(links):
    print("  ", l)
