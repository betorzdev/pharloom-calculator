import json, os, time, urllib.parse, urllib.request, sys

API = "https://hollowknight.wiki/mw/api.php"
OUT = "raw"
os.makedirs(OUT, exist_ok=True)

def fetch(titles):
    params = {
        "action": "query", "prop": "revisions", "rvprop": "content",
        "rvslots": "main", "titles": "|".join(titles),
        "format": "json", "formatversion": "2",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "hollow-kb/1.0 (personal project)"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def safe(t):
    return t.replace("/", "_").replace(" ", "_")

def run(titles):
    missing, got = [], []
    for i in range(0, len(titles), 40):
        chunk = titles[i:i+40]
        try:
            d = fetch(chunk)
        except Exception as e:
            print("ERR", chunk[0], e); continue
        for p in d["query"]["pages"]:
            if p.get("missing"):
                missing.append(p["title"]); continue
            try:
                txt = p["revisions"][0]["slots"]["main"]["content"]
            except Exception:
                missing.append(p["title"]); continue
            open(os.path.join(OUT, safe(p["title"]) + ".wiki"), "w").write(txt)
            got.append(p["title"])
        time.sleep(0.4)
    return got, missing

if __name__ == "__main__":
    titles = []
    for f in sys.argv[1:]:
        if f.endswith(".txt"):
            titles += [l.strip() for l in open(f) if l.strip()]
        else:
            titles.append(f)
    titles = sorted(set(titles))
    got, missing = run(titles)
    print("fetched", len(got), "missing", len(missing))
    if missing: print("MISSING:", missing)
