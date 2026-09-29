"""tools/extract-crests.py — each Crest as the game's Crest pane draws it (design/03-redesign.md,
step 8): its art into assets/crests/, and where each slot sits, with the game's slot frames, into
js/crest-slots.js.
Needs the game installed and UnityPy, as tools/extract-map.py:
    /tmp/unitypy/bin/python tools/extract-crests.py "<Steam>/steamapps/common/Hollow Knight Silksong"
Where they are (read on 28-Sep-2026): each ToolCrest in
dataassets_assets_assets/dataassets/tools/crestitems.bundle lists its slots, each with a Position
(in units from the Crest's centre, y up), a Type (0 red, 1 blue, 2 yellow, 3 Silk Skill) and
IsLocked (a Memory Locket opens it); its crestSprite is in crest.spriteatlas (white line art, 100
px to the unit). The Hunter has one ToolCrest per evolution (Hunter, Hunter_v2, Hunter_v3), its
slots moving out a little. The game's names: Warrior is the Beast, Toolmaster the Architect, Spell
the Shaman; Cloakless and Cursed (the Witch's curse) have no place on the site. The slot frames,
white and tinted by colour in the game, are in inventory.spriteatlas: UI_tool_slot_attack0000
(red), _defend0000 (blue), _explore0000 (yellow), _weave0000 (Silk Skill), _locked_fill.
Stops if a Crest's slots don't match js/data.js (CRESTS[].slots, from the wiki). Team Cherry's
art, published as the map is (the colophon says so). Re-run after a patch. """
import base64, io, json, os, subprocess, sys
from collections import Counter
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'   # Unity 6 strips its version from the bundles
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SITE = {'Hunter': ('hunter', 0), 'Hunter_v2': ('hunter', 1), 'Hunter_v3': ('hunter', 2), 'Reaper': ('reaper', None),
        'Wanderer': ('wanderer', None), 'Warrior': ('beast', None), 'Witch': ('witch', None),
        'Toolmaster': ('architect', None), 'Spell': ('shaman', None)}
FRAMES = {'red': 'UI_tool_slot_attack0000', 'blue': 'UI_tool_slot_defend0000', 'yellow': 'UI_tool_slot_explore0000',
          'skill': 'UI_tool_slot_weave0000', 'locked': 'UI_tool_slot_locked_fill'}
TYPE = ['red', 'blue', 'yellow', 'skill']

def webp(img, path):
    img.convert('RGBA').save(path, 'WEBP', quality=90, method=6)

def main(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    atl = os.path.join(aa, 'atlases_assets_assets', 'sprites', '_atlases')
    out = os.path.join(ROOT, 'assets', 'crests')
    os.makedirs(out, exist_ok=True)
    env = UnityPy.load(os.path.join(aa, 'dataassets_assets_assets', 'dataassets', 'tools', 'crestitems.bundle'),
                       os.path.join(atl, 'crest.spriteatlas.bundle'))
    slots, art = {}, {}
    for o in env.objects:
        if o.type.name != 'MonoBehaviour':
            continue
        try:
            d = o.read_typetree()
        except Exception:
            continue
        if 'slots' not in d or d['m_Name'] not in SITE:
            continue
        sid, stage = SITE[d['m_Name']]
        row = [[round(s['Position']['x'], 2), round(s['Position']['y'], 2), s['Type'], s['IsLocked']] for s in d['slots']]
        sp = o.read().crestSprite.read()
        name = f'{sid}-{stage + 1}' if stage is not None else sid
        webp(sp.image, os.path.join(out, name + '.webp'))
        # The atlas keeps the art trimmed: its centre sits off the Crest's (the sprite's pivot), where
        # the slots are measured from, by up to ¾ of a unit (the Hunter's).
        u, r, pv, off = sp.m_PixelsToUnits, sp.m_Rect, sp.m_Pivot, sp.m_RD.textureRectOffset
        w, h = sp.image.size
        art[name] = [round(w / u, 2), round(h / u, 2),
                     round((off.x + w / 2 - pv.x * r.width) / u, 2), round((off.y + h / 2 - pv.y * r.height) / u, 2)]
        if stage is None:
            slots[sid] = row
        else:
            slots.setdefault(sid, [None, None, None])[stage] = row
    # Each Crest's slots against the wiki's counts in js/data.js: [open, locked] per colour, and the skill slots.
    crests = json.loads(subprocess.run(['node', '-e', "require('./js/data.js'); console.log(JSON.stringify(SS.data.CRESTS.map((c) => [c.id, c.slots])))"],
                                       cwd=ROOT, capture_output=True, text=True, check=True).stdout)
    for cid, want in crests:
        if cid not in slots:
            sys.exit(f'extract-crests: no ToolCrest for {cid}')
        for row in (slots[cid] if cid == 'hunter' else [slots[cid]]):
            n = Counter((TYPE[t], lk) for x, y, t, lk in row)
            got = {c: [n[(c, 0)], n[(c, 1)]] for c in ('red', 'blue', 'yellow')}
            got['skill'] = n[('skill', 0)] + n[('skill', 1)]
            if any(got[c] != want[c] for c in ('red', 'blue', 'yellow')) or got['skill'] != want['skill']:
                sys.exit(f'extract-crests: {cid}\'s slots {got} ≠ js/data.js {want}')
    # The frames go inline, as data: URIs: the page tints them through a CSS mask, and a mask
    # won't take an image from a file over file:// (it needs CORS), the way the site must work.
    frames = {}
    for o in UnityPy.load(os.path.join(atl, 'inventory.spriteatlas.bundle')).objects:
        if o.type.name == 'Sprite':
            s = o.read()
            for k, name in FRAMES.items():
                if s.m_Name == name:
                    buf = io.BytesIO()
                    s.image.convert('RGBA').save(buf, 'WEBP', quality=90, method=6)
                    frames[k] = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
    missing = [k for k in FRAMES if k not in frames]
    if missing:
        sys.exit(f'extract-crests: no slot frame for {missing}')
    with open(os.path.join(ROOT, 'js', 'crest-slots.js'), 'w') as f:
        f.write("/* js/crest-slots.js: where each Crest's slots sit, as the game's Crest pane draws them: per Crest\n"
                "   (the Hunter, per evolution), [x, y, type, locked] in units from the Crest's centre (y up; 100 px\n"
                "   of its art to the unit), type 0 red, 1 blue, 2 yellow, 3 Silk Skill, locked 1 when a Memory\n"
                "   Locket opens it. The art is assets/crests/<id>.webp (the Hunter's, hunter-<evolution>.webp).\n"
                "   GENERATED by tools/extract-crests.py from the game's own files: not edited by hand. */\n"
                "(() => {\n  const SS = globalThis.SS || (globalThis.SS = {});\n"
                f"  SS.crestSlots = {json.dumps(dict(sorted(slots.items())), separators=(',', ':'))};\n"
                "  // Each art's size in the same units (its pixels over its pixels per unit) and where its centre sits from\n"
                "  // the Crest's (x, y up), to draw it in step with the slots.\n"
                f"  SS.crestArt = {json.dumps(dict(sorted(art.items())), separators=(',', ':'))};\n"
                "  // The game's slot frames (white, tinted by colour on the page), inline: a CSS mask can't take a file over file://.\n"
                f"  SS.crestFrames = {json.dumps(frames, separators=(',', ':'))};\n"
                "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.crestSlots;\n})();\n")
    print(f'{len(slots)} Crests → assets/crests/, their slots and {len(frames)} slot frames → js/crest-slots.js')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/.steam/steam/steamapps/common/Hollow Knight Silksong'))
