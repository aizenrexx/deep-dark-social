#!/usr/bin/env python3
"""Fetch Microsoft Fluent Emoji 3D PNGs (MIT-licensed) for the reaction set."""
import json, os, sys, urllib.request, urllib.parse

FACES = {
    "like": "Thumbs up",
    "love": "Red heart",
    "adore": "Smiling face with heart-eyes",
    "care": "Hugging face",
    "haha": "Face with tears of joy",
    "rofl": "Rolling on the floor laughing",
    "wow": "Face with open mouth",
    "shock": "Face screaming in fear",
    "sad": "Crying face",
    "angry": "Pouting face",
    "fire": "Fire",
    "party": "Party popper",
    "clap": "Clapping hands",
    "pray": "Folded hands",
    "think": "Thinking face",
    "cool": "Smiling face with sunglasses",
    "hearts": "Smiling face with hearts",
    "hundred": "Hundred points",
    "eyes": "Eyes",
    "sleep": "Sleeping face",
    "shoe": "Mans shoe",
    "middle": "Middle finger",
    "thumbsdown": "Thumbs down",
    "poo": "Pile of poo",
    "vomit": "Face vomiting",
}
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "reactions")
os.makedirs(OUT, exist_ok=True)
API = "https://api.github.com/repos/microsoft/fluentui-emoji/contents/assets"

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "dds-fetch", "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def find_png(folder):
    # Try <folder>/3D, then <folder>/Default/3D (skin-tone layout)
    for sub in ("3D", "Default/3D"):
        url = f"{API}/{urllib.parse.quote(folder)}/{urllib.parse.quote(sub, safe='/')}"
        try:
            items = get(url)
        except Exception:
            continue
        for it in items:
            if "_3d" in it["name"] and it["name"].endswith(".png"):
                return it["download_url"]
    return None

ok, fail = [], []
for key, folder in FACES.items():
    dest = os.path.join(OUT, key + ".png")
    if os.path.exists(dest) and os.path.getsize(dest) > 3000:
        ok.append(key); continue
    url = find_png(folder)
    if not url:
        fail.append((key, folder)); continue
    req = urllib.request.Request(url, headers={"User-Agent": "dds-fetch"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    with open(dest, "wb") as f:
        f.write(data)
    ok.append(key)
    print(f"{key}: {len(data)//1024} KB")
print("OK:", len(ok), "FAIL:", fail)
sys.exit(1 if fail else 0)
