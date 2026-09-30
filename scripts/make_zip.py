"""Membuat report-deploy.zip dari folder deploy/ (path memakai '/' agar aman di Linux).
Pakai: python scripts/make_zip.py
"""
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "deploy")
OUT = os.path.join(ROOT, "report-deploy.zip")

if os.path.exists(OUT):
    os.remove(OUT)
n = 0
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for base, _dirs, files in os.walk(SRC):
        for f in files:
            p = os.path.join(base, f)
            arc = os.path.relpath(p, SRC).replace(os.sep, "/")
            if arc == "DEPLOY.txt":
                continue
            z.write(p, arc)
            n += 1
print("zip", OUT, n, "files", os.path.getsize(OUT) // 1024, "KB")
