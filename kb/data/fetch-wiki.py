"""kb/data/fetch-wiki.py — downloads raw wikitext from hollowknight.wiki into kb/data/raw/.

    python3 kb/data/fetch-wiki.py                     every page in kb/data/pages.txt (npm run kb)
    python3 kb/data/fetch-wiki.py "Page name" x.txt   those pages, and the ones listed in x.txt

A title can also be `Category:<Name>` (its articles) or `Prefix:<Page>/` (its subpages, as the
49 `Enemy Gauntlets (Silksong)/<Area n>`). Redirects are followed and saved under the title
asked for. Each page is `raw/<Title>.wiki`, with `/` and spaces as `_`. No dependencies."""
import json, os, time, urllib.parse, urllib.request, sys

API = "https://hollowknight.wiki/mw/api.php"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "raw")
UA = {"User-Agent": "pharloom-calculator/1.0 (personal project; kb/data/fetch-wiki.py)"}
os.makedirs(OUT, exist_ok=True)

def api(**params):
    params.update(format="json", formatversion="2")
    req = urllib.request.Request(API + "?" + urllib.parse.urlencode(params), headers=UA)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception as e:
            if attempt == 3: raise
            time.sleep(2 + attempt * 3)

def members(cat):
    out, cont = [], {}
    while True:
        d = api(action="query", list="categorymembers", cmtitle=cat, cmlimit="500", cmnamespace="0", **cont)
        out += [m["title"] for m in d["query"]["categorymembers"]]
        if "continue" not in d: return out
        cont = {"cmcontinue": d["continue"]["cmcontinue"]}

def subpages(prefix):
    out, cont = [], {}
    while True:
        d = api(action="query", list="allpages", apprefix=prefix, apnamespace="0", aplimit="500", **cont)
        out += [p["title"] for p in d["query"]["allpages"]]
        if "continue" not in d: return out
        cont = {"apcontinue": d["continue"]["apcontinue"]}

def safe(t):
    return t.replace("/", "_").replace(" ", "_")

def run(titles):
    missing, got = [], []
    for i in range(0, len(titles), 40):
        chunk = titles[i:i+40]
        try:
            d = api(action="query", prop="revisions", rvprop="content", rvslots="main",
                    titles="|".join(chunk), redirects="1")
        except Exception as e:
            print("ERR", chunk[0], e); missing += chunk; continue
        # A redirected page is saved under the title that was asked for.
        back = {}
        for key in ("normalized", "redirects"):
            for r in d["query"].get(key, []):
                back[r["to"]] = back.get(r["from"], r["from"])
        for p in d["query"]["pages"]:
            if p.get("missing"):
                missing.append(p["title"]); continue
            try:
                txt = p["revisions"][0]["slots"]["main"]["content"]
            except Exception:
                missing.append(p["title"]); continue
            name = back.get(p["title"], p["title"])
            with open(os.path.join(OUT, safe(name) + ".wiki"), "w", encoding="utf-8") as f:
                f.write(txt)
            got.append(name)
        time.sleep(0.4)
    return got, missing

def expand(items):
    titles = []
    for t in items:
        if t.startswith("Category:"): titles += members(t)
        elif t.startswith("Prefix:"): titles += subpages(t[len("Prefix:"):])
        else: titles.append(t)
    return titles

def read_list(path):
    with open(path, encoding="utf-8") as f:
        return [l.strip() for l in f if l.strip() and not l.startswith("#")]

if __name__ == "__main__":
    args = sys.argv[1:] or [os.path.join(HERE, "pages.txt")]
    items = []
    for a in args:
        items += read_list(a) if a.endswith(".txt") else [a]
    titles = sorted(set(expand(items)))
    got, missing = run(titles)
    print("fetched", len(got), "missing", len(missing))
    if missing: print("MISSING:", missing)
