"""tools/extract-crests.py — each Crest as the game's Crest pane draws it (design/03-redesign.md,
step 8, and its review): its art into assets/crests/, and where each slot sits, with the game's
slot sprites and the Vesticrest's floating slots, into js/crest-slots.js.
Needs the game installed and UnityPy, as tools/extract-map.py:
    /tmp/unitypy/bin/python tools/extract-crests.py "<Steam>/steamapps/common/Hollow Knight Silksong"
Where they are (read on 28-Sep-2026): each ToolCrest in
dataassets_assets_assets/dataassets/tools/crestitems.bundle lists its slots, each with a Position
(in units from the Crest's centre, y up), a Type (0 red, 1 blue, 2 yellow, 3 Silk Skill) and
IsLocked (a Memory Locket opens it), and an AttackBinding (0 the Tool button alone, 1 with up, 2
with down: what fires a red slot's Tool or a Silk Skill slot's Skill); its crestSprite is in
crest.spriteatlas (white line art, 100 px to the unit). The Hunter has one ToolCrest per evolution
(Hunter, Hunter_v2, Hunter_v3), its slots moving out a little. The game's names: Warrior is the
Beast, Toolmaster the Architect, Spell the Shaman; Cloakless has no place on the site, and Cursed
(the Witch's curse, worn for a while in the story: no slots) only its art, for a save made then.
The slot sprites, white and tinted by colour in the game, are in inventory.spriteatlas (read on
13-Oct-2026, SPRITES below): an empty slot shows its sign (UI_tool_slot_attack0000 red,
_defend0000 blue, _explore0000 yellow, _weave0000 Silk Skill; a red or Skill slot on up or down
has its own, Tool_slot_attack_up0000 / _down0000 and UI_tool_slot_weave_up / _down); a full one
ends its EmptyToFull animation (animations_assets_shared) on UI_tool_slot_attack0004, a ring
(_up / _down notched for up and down). A locked one is Tool_slot_lock_ring alone (read on
13-Oct-2026): each slot draws its sign on one renderer ("Background", in the pane's Template Crest),
and its Locked animation (toolui_assets_all, "Attack Slot Locked", shared by every colour) swaps the
sign for the ring, centred; InventoryToolCrestSlot.UpdateSlotDisplay (Assembly-CSharp 1.0.30000)
scales it to 0.8, tints it the slot colour's grey and fades the slot to half (js/app-tools.js, the
--slot-lock tokens). UI_tool_slot_locked_fill, on "Background_Filled", only shows on the Crests the
list leaves as silhouettes, which the site doesn't draw.
The Vesticrest's slots float beside the Crest in the pane's "Floating Slots"
(coremanagers_assets__gamecameras.bundle, Tools): a column of slots between white brackets
(UI_tool_slot_extra_sockets top, mid, bottom), read from the prefab into SS.crestFloat.
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
# The sprites, by the site's names: a sign per colour (and per button for red and the Silk Skills), the full
# slot's ring, the lock ring and the Vesticrest's brackets.
SPRITES = {'red': 'UI_tool_slot_attack0000', 'red-up': 'Tool_slot_attack_up0000', 'red-down': 'Tool_slot_attack_down0000',
           'blue': 'UI_tool_slot_defend0000', 'yellow': 'UI_tool_slot_explore0000',
           'skill': 'UI_tool_slot_weave0000', 'skill-up': 'UI_tool_slot_weave_up', 'skill-down': 'UI_tool_slot_weave_down',
           'ring': 'UI_tool_slot_attack0004', 'ring-up': 'UI_tool_slot_attack0004_up', 'ring-down': 'UI_tool_slot_attack0004_down',
           'lock': 'Tool_slot_lock_ring', 'bracket-top': 'UI_tool_slot_extra_sockets_0000_top',
           'bracket-mid': 'UI_tool_slot_extra_sockets_0001_mid', 'bracket-bot': 'UI_tool_slot_extra_sockets_0002_bot'}
TYPE = ['red', 'blue', 'yellow', 'skill']

def webp(img, path):
    img.convert('RGBA').save(path, 'WEBP', quality=90, method=6)

def box(sp):
    """A sprite's size in units and where its centre sits from its pivot (x, y up): the atlas keeps it trimmed."""
    u, r, pv, off = sp.m_PixelsToUnits, sp.m_Rect, sp.m_Pivot, sp.m_RD.textureRectOffset
    w, h = sp.image.size
    return [round(w / u, 2), round(h / u, 2), round((off.x + w / 2 - pv.x * r.width) / u, 2), round((off.y + h / 2 - pv.y * r.height) / u, 2)]

def transform(go):
    for c in go.m_Component:
        t = (c.component if hasattr(c, 'component') else c).read()
        if type(t).__name__ in ('Transform', 'RectTransform'):
            return t

def children(go):
    """A GameObject's children by name: (GameObject, local x, local y, scale x)."""
    out = {}
    for ch in transform(go).m_Children:
        t = ch.read()
        g = t.m_GameObject.read()
        out[g.m_Name] = (g, t.m_LocalPosition.x, t.m_LocalPosition.y, t.m_LocalScale.x)
    return out

def floating(aa):
    """The Vesticrest's Floating Slots, in the Crest's units (the group's scale over the Crest List's): its
    slots' y (blue, then yellow), their scale, and the brackets [sprite, y] round one slot or two."""
    env = UnityPy.load(os.path.join(aa, 'coremanagers_assets__gamecameras.bundle'))
    gos = {}
    for o in env.objects:
        if o.type.name == 'GameObject':
            g = o.read()
            if g.m_Name in ('Floating Slots', 'Crest List') and g.m_Name not in gos:
                gos[g.m_Name] = g
    if len(gos) != 2:
        sys.exit(f'extract-crests: no Floating Slots or Crest List in the Tools pane ({list(gos)})')
    k = transform(gos['Floating Slots']).m_LocalScale.x / transform(gos['Crest List']).m_LocalScale.x
    kids = children(gos['Floating Slots'])
    slots = [round(kids[n][2] * k, 2) for n in ('Defend Slot', 'Explore Slot')]
    br = children(kids['Brackets'][0])
    NAMES = {'Top Bracket': 'bracket-top', 'Mid Bracket': 'bracket-mid', 'Bottom Bracket': 'bracket-bot'}
    brackets = {}
    for n, key in (('1 Slot Brackets', '1'), ('2 Slot Brackets', '2')):
        g, _, gy, _ = br[n]
        brackets[key] = [[NAMES[c], round((gy + y) * k, 2)] for c, (_, _, y, _) in children(g).items()]
    return {'k': round(k, 3), 'scale': round(kids['Defend Slot'][3], 2), 'slots': slots, 'brackets': brackets}

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
        if d.get('m_Name') == 'Cursed':
            # The curse's Crest: only its art (a save made while cursed shows it, with no slots).
            sp = o.read().crestSprite.read()
            webp(sp.image, os.path.join(out, 'cursed.webp'))
            art['cursed'] = box(sp)
            continue
        if 'slots' not in d or d['m_Name'] not in SITE:
            continue
        sid, stage = SITE[d['m_Name']]
        row = [[round(s['Position']['x'], 2), round(s['Position']['y'], 2), s['Type'], s['IsLocked'], s['AttackBinding']] for s in d['slots']]
        sp = o.read().crestSprite.read()
        name = f'{sid}-{stage + 1}' if stage is not None else sid
        webp(sp.image, os.path.join(out, name + '.webp'))
        # The atlas keeps the art trimmed: its centre sits off the Crest's (the sprite's pivot), where
        # the slots are measured from, by up to ¾ of a unit (the Hunter's).
        art[name] = box(sp)
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
            n = Counter((TYPE[t], lk) for x, y, t, lk, bind in row)
            got = {c: [n[(c, 0)], n[(c, 1)]] for c in ('red', 'blue', 'yellow')}
            got['skill'] = n[('skill', 0)] + n[('skill', 1)]
            if any(got[c] != want[c] for c in ('red', 'blue', 'yellow')) or got['skill'] != want['skill']:
                sys.exit(f'extract-crests: {cid}\'s slots {got} ≠ js/data.js {want}')
    # The frames go inline, as data: URIs: the page tints them through a CSS mask, and a mask
    # won't take an image from a file over file:// (it needs CORS), the way the site must work.
    sprites = {}
    for o in UnityPy.load(os.path.join(atl, 'inventory.spriteatlas.bundle')).objects:
        if o.type.name == 'Sprite':
            s = o.read()
            for k, name in SPRITES.items():
                if s.m_Name == name:
                    buf = io.BytesIO()
                    s.image.convert('RGBA').save(buf, 'WEBP', quality=90, method=6)
                    sprites[k] = ['data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode(), *box(s)]
    missing = [k for k in SPRITES if k not in sprites]
    if missing or 'cursed' not in art:
        sys.exit(f'extract-crests: no slot sprite for {missing}, or no Cursed Crest art')
    float_ = floating(aa)
    with open(os.path.join(ROOT, 'js', 'crest-slots.js'), 'w') as f:
        f.write("/* js/crest-slots.js: where each Crest's slots sit, as the game's Crest pane draws them: per Crest\n"
                "   (the Hunter, per evolution), [x, y, type, locked, button] in units from the Crest's centre (y up;\n"
                "   100 px of its art to the unit), type 0 red, 1 blue, 2 yellow, 3 Silk Skill, locked 1 when a Memory\n"
                "   Locket opens it, button 0 the Tool button alone, 1 with up, 2 with down (a red or Skill slot's).\n"
                "   The art is assets/crests/<id>.webp (the Hunter's, hunter-<evolution>.webp; cursed.webp, the curse's).\n"
                "   GENERATED by tools/extract-crests.py from the game's own files: not edited by hand. */\n"
                "(() => {\n  const SS = globalThis.SS || (globalThis.SS = {});\n"
                f"  SS.crestSlots = {json.dumps(dict(sorted(slots.items())), separators=(',', ':'))};\n"
                "  // Each art's size in the same units (its pixels over its pixels per unit) and where its centre sits from\n"
                "  // the Crest's (x, y up), to draw it in step with the slots.\n"
                f"  SS.crestArt = {json.dumps(dict(sorted(art.items())), separators=(',', ':'))};\n"
                "  // The game's slot sprites (white, tinted by colour on the page), inline, as a CSS mask can't take a file over\n"
                "  // file://: [data URI, width, height, centre x, centre y] in the same units. A sign per colour and button\n"
                "  // (red-up, skill-down...), the full slot's ring (ring, ring-up, ring-down), the lock ring, the Vesticrest's brackets.\n"
                f"  SS.crestSprites = {json.dumps(sprites, separators=(',', ':'))};\n"
                "  // Each colour's sign as a picture (the Map's Eva marks).\n"
                "  SS.crestFrames = Object.fromEntries(['red', 'blue', 'yellow', 'skill'].map((k) => [k, SS.crestSprites[k][0]]));\n"
                "  // The Vesticrest's Floating Slots, in the Crest's units: the slots' y (blue, yellow) and scale, and the\n"
                "  // brackets [sprite, y] round one slot or two.\n"
                f"  SS.crestFloat = {json.dumps(float_, separators=(',', ':'))};\n"
                "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.crestSlots;\n})();\n")
    print(f'{len(slots)} Crests and the curse\'s art → assets/crests/; their slots, {len(sprites)} slot sprites and the Vesticrest → js/crest-slots.js')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/.steam/steam/steamapps/common/Hollow Knight Silksong'))
