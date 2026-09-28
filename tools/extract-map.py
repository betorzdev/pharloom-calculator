"""tools/extract-map.py — Pharloom's map from the game's own files: the rooms drawn as the game's
map screen draws them, into assets/map/rooms.webp (and the rooms that change with the game, into
assets/map/states.webp), and where each room is on it, into js/map.js.
Needs the game installed and UnityPy (no pip on the author's machine: uv, in an env of its own):
    uv venv /tmp/unitypy && uv pip install --python /tmp/unitypy/bin/python UnityPy
    /tmp/unitypy/bin/python tools/extract-map.py "<Steam>/steamapps/common/Hollow Knight Silksong"
The image is Team Cherry's art, published as the Hollow Knight site publishes its map (a fan
project; the colophon says so). Re-run it after a patch that touches the map.

Where it is (found on 27-Sep-2026, design/00-study.md §4.7):
  · maps_assets_all.bundle (Addressables, StreamingAssets/aa/StandaloneLinux64/): a tree under
    Game_Map_Hornet, one child per area (Bone, Crawl, Dock…), and under each area one GameObject
    per room named after its scene, with its Transform, a SpriteRenderer tinted with the area's
    colour and a component whose fullSprite is the room as drawn once the area's map is bought
    (the renderer holds the rough sketch until then); the icons (pins, arrows, markers) are
    deeper in the tree or in groups of their own, and aren't drawn: the site draws its own.
  · the pins the site draws (found on 28-Sep-2026): under a room, a "Bench Pin" (also "Toll",
    "Bellshrine", "Swamp Shaman"), "Bellway Pin" or "Tube Pin" (a Ventrica station), with a
    component whose visibleCondition is the pin set bought from the Mapper (hasPinBench…) and
    whose materialCondition is what lights it: the station unlocked (UnlockedShadowStation…),
    the toll paid (the room's bell_toll_machine). They're written to js/map.js as PINS, the
    condition in js/collectibles.js's form; a plain bench has none. Left out: the caravan's
    benches (they move with CaravanTroupeLocation), the Steel Soul, "Pre" and fake ones, the
    vendors (each with its own merchant's state), and the arrows and markers.
  · each room is drawn as the game's GameMapScene.SetMapped draws it (read in the game's code,
    28-Sep-2026): its states are Hidden, Rough and Full, and only a Rough room takes its
    fullSprite; a Hidden one (a room's secret or its other half) keeps its own sprite, though
    many point at their main room's fullSprite. altFullSprites and altColors change a room when
    their PlayerDataTest holds, hideCondition hides it, DeactivatePlayerDataTest and
    DeactivateIfPlayerdataFalse switch it off. Those tests read STATE: the whole world explored,
    Verdania after its Dancers (the game dims it and joins its rooms then) and Whiteward after the
    Unravelled. The flags in VARY change with the save (28-Sep-2026): Act 3 (act3MapUpdated
    hides the Cradle, Cogwork Core and the Ventrica hub, 14 rooms, and their destroyed rooms,
    which have no condition of their own, take their place) and the Abyss's diving bell (broken,
    gone, mended). The rooms those decide aren't in rooms.webp but in states.webp, one layer per
    condition, each cropped to its rooms; js/map.js LAYERS says where each goes and when, and
    js/app-map.js draws those whose condition the save's flags meet (js/rooms.js mapFlags).
  · the sprites are in atlases_assets_assets/sprites/_atlases/hornet_map.spriteatlas.bundle (a
    4096² BC7 texture, 1,199 sprites) and hornet_map_patch.spriteatlas.bundle.
  · Unity 6 strips its version from the bundles: UnityPy needs it set (6000.0.50f1, the one
    globalgamemanagers carries). """
import json, os, re, sys
import UnityPy
from PIL import Image

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
PPU_OUT = 48            # pixels per world unit on the site's image (the whole map is ~73 × 54 units)
NOT_AREAS = {'Pan Audio Loop', 'Main Quest Pins', 'Compass Icon', 'Shade Pos', 'Map Markers', 'Flea Tracker Markers'}
ICONS = ('pin_', 'quest_map_icon', 'Map_Arrow')
PIN = re.compile(r'^(Bench|Bellway|Tube) Pin( Toll| Bellshrine| Swamp Shaman)?( \(\d+\))?$')
PIN_KIND = {'Bench': 'bench', 'Bellway': 'bellway', 'Tube': 'ventrica'}


def full_image(sprite):
    """A sprite at its own size. The atlas packs most of the map's sprites with their transparent
    margins trimmed (869 of 1,204 in 1.0.30000), and UnityPy gives the trimmed texture; the pivot,
    the room's point on the map, is a fraction of the whole rectangle. So the texture goes back
    where it was in it: textureRectOffset from the rectangle's bottom left corner. Without this,
    every trimmed room was drawn off its place by what it lost (found on 28-Sep-2026). """
    im = sprite.image.convert('RGBA')
    rect, off = sprite.m_Rect, sprite.m_RD.textureRectOffset
    w, h = round(rect.width), round(rect.height)
    if (w, h) == im.size:
        return im
    whole = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    whole.paste(im, (round(off.x), h - round(off.y) - im.height))
    return whole


def condition(c):
    """A map component's condition → js/collectibles.js's form, or None when it's always true:
    its PlayerDataTest is groups (any) of tests (all), each a playerData bool that must be
    BoolValue; its PersistentBool, a sceneData flag, is one more way to be true."""
    if not c:
        return None
    alts = []
    for g in c['PlayerDataTest']['TestGroups']:
        tests = []
        for t in g['Tests']:
            if t['Type'] != 0:
                raise ValueError(f'a test that is not a bool: {t}')
            tests.append(['flag', t['FieldName']] if t['BoolValue'] else ['not', ['flag', t['FieldName']]])
        if tests:
            alts.append(tests[0] if len(tests) == 1 else ['all'] + tests)
    pb = c.get('PersistentBool') or {}
    if pb.get('Id'):
        b = ['bool', pb['SceneName'], pb['Id']]
        alts.append(b if pb['ExpectedValue'] else ['not', b])
    return None if not alts else alts[0] if len(alts) == 1 else ['any'] + alts

ROUGH = 1   # GameMapScene.States: Hidden, Rough, Full
CLASS, BYFILE, ACT3_HIDDEN = {}, {}, set()
# The state the map is drawn in: the whole world explored. Every playerData flag a room's
# condition reads is here; one that isn't stops the run, so a patch that adds one is seen.
# The flags in VARY change with the save (js/app-map.js reads them from its game): a room one of
# them decides goes into a layer (assets/map/states.webp), drawn over rooms.webp while its
# condition holds. The other flags are drawn as STATE says, in rooms.webp; STATE's value of a VARY
# flag is what the site shows with no save (Free mode): the world before Act 3.
STATE = {
    'act3MapUpdated': False,          # the Cradle, Cogwork Core and the Ventrica hub before they fall
    'defeatedCloverDancers': True,    # Verdania's colours and its two rooms once its bosses are gone
    'wardBossDefeated': True,         # Whiteward's pit opened by the Unravelled
    'HasWhiteFlower': False,          # the Abyss's diving bell, broken until the Everbloom
    'SeenDivingBellGoneAbyss': False,
    'HasJudgeStepsMap': True,         # Coral_19_base, drawn once the Blasted Steps are mapped
}
VARY = ('act3MapUpdated', 'HasWhiteFlower', 'SeenDivingBellGoneAbyss')


rgb = lambda c: (c['r'], c['g'], c['b']) if isinstance(c, dict) else (c.r, c.g, c.b)


# A condition over the VARY flags, in js/collectibles.js's form ('flag', 'not', 'all', 'any'), or
# True / False when it doesn't depend on them.
def c_not(c):
    return (not c) if isinstance(c, bool) else c[1] if c[0] == 'not' else ['not', c]


def c_join(op, cs):
    stop, skip = (False, True) if op == 'all' else (True, False)
    if any(c is stop for c in cs):
        return stop
    cs = [c for c in cs if c is not skip]
    return skip if not cs else cs[0] if len(cs) == 1 else [op] + cs


def holds(test):
    """A PlayerDataTest (groups, any of them; tests in a group, all) with STATE's flags put in:
    True, False, or a condition over the VARY flags. Empty: False."""
    groups = (test or {}).get('TestGroups') or []
    def one(t):
        if t['Type'] != 0:
            raise ValueError(f'a map condition that is not a bool: {t}')
        f = t['FieldName']
        if f not in STATE:
            raise KeyError(f'a map condition reads {f}: set it in STATE')
        if f in VARY:
            return ['flag', f] if t['BoolValue'] else ['not', ['flag', f]]
        return STATE[f] == bool(t['BoolValue'])
    return c_join('any', [c_join('all', [one(t) for t in g['Tests']]) for g in groups if g['Tests']])


def fixed(c, what):
    """A room's drawing and colour are the same in every state the site shows: only whether the
    room is there changes with the save. A patch that breaks that stops the run."""
    if not isinstance(c, bool):
        raise ValueError(f'{what} changes with {c}: the site only switches whole rooms')
    return c


def in_state(c, flags):
    """A condition over the VARY flags, with those in `flags` true and the rest false."""
    if isinstance(c, bool):
        return c
    if c[0] == 'flag':
        return c[1] in flags
    if c[0] == 'not':
        return not in_state(c[1], flags)
    return (all if c[0] == 'all' else any)(in_state(x, flags) for x in c[1:])


def resolve(owner, pptr):
    """A type tree's PPtr, relative to the file that holds `owner`: 0 is that file, n its n-th
    external (the atlas bundle's file, for the sprites)."""
    f, pid = pptr['m_FileID'], pptr['m_PathID']
    if not pid:
        return None
    name = owner.assets_file.name if f == 0 else owner.assets_file.externals[f - 1].path.split('/')[-1]
    o = BYFILE.get(name.lower(), {}).get(pid)
    return o.read() if o else None


HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')


def main(game, ppu=48):
    """ppu 48: rooms.webp, states.webp and js/map.js (the site's positions); any other: only the
    two images at that resolution, as rooms-hd.webp and states-hd.webp, which the Map swaps in close
    up (the game draws its map at 100 pixels a unit; 96 is twice the site's). The same layout, only
    scaled: the marks go by percentages."""
    global PPU_OUT
    PPU_OUT = ppu
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    atl = os.path.join(aa, 'atlases_assets_assets', 'sprites', '_atlases')
    mono = next(f for f in os.listdir(aa) if f.endswith('_monoscripts.bundle'))   # the scripts' class names
    env = UnityPy.load(os.path.join(aa, 'maps_assets_all.bundle'), os.path.join(atl, 'hornet_map.spriteatlas.bundle'),
                       os.path.join(atl, 'hornet_map_patch.spriteatlas.bundle'), os.path.join(aa, mono))
    T = {o.path_id: o.read() for o in env.objects if o.type.name == 'Transform'}
    for o in env.objects:
        BYFILE.setdefault(o.assets_file.name.lower(), {})[o.path_id] = o
        if o.type.name == 'MonoScript':
            CLASS[o.path_id] = o.read().m_ClassName
    # The rooms the game hides once act3MapUpdated: their Act 3 rooms aren't drawn over them.
    for o in env.objects:
        if o.type.name == 'MonoBehaviour':
            tree = o.read_typetree()
            if CLASS.get(tree['m_Script']['m_PathID']) == 'GameMapScene' and any(
                    t['FieldName'] == 'act3MapUpdated' for g in tree['hideCondition'].get('TestGroups') or [] for t in g['Tests']):
                ACT3_HIDDEN.add(o.read().m_GameObject.read().m_Name)

    def chain(t):
        out = []
        while t is not None:
            out.append(t)
            f = t.m_Father.m_PathID
            t = T.get(f) if f else None
        return list(reversed(out))   # root first

    def world(ts):
        x = y = 0.0
        sx = sy = 1.0
        for t in ts:
            lp, ls = t.m_LocalPosition, t.m_LocalScale
            x, y = x + lp.x * sx, y + lp.y * sy
            sx, sy = sx * ls.x, sy * ls.y
        return x, y, sx, sy

    rooms, pins = [], []
    for o in env.objects:
        if o.type.name != 'GameObject':
            continue
        go = o.read()
        comps = [(getattr(c, 'component', c)).deref() for c in go.m_Components]
        tr = next((c.read() for c in comps if c.type.name == 'Transform'), None)
        sr = next((c.read() for c in comps if c.type.name == 'SpriteRenderer'), None)
        if tr is None or sr is None:
            continue
        ts = chain(tr)
        names = [t.m_GameObject.read().m_Name for t in ts]
        # A pin: Game_Map_Hornet / <area> / <room> / … / <kind> Pin.
        m = PIN.match(go.m_Name)
        if m and len(names) >= 4 and names[0] == 'Game_Map_Hornet':
            lit = None
            for c in comps:
                if c.type.name == 'MonoBehaviour':
                    tree = c.read_typetree()
                    if 'materialCondition' in tree:
                        lit = condition(tree['materialCondition'])
            x, y, _, _ = world(ts)
            pins.append({'kind': PIN_KIND[m.group(1)], 'scene': names[2], 'x': x, 'y': y, 'lit': lit})
            continue
        # A room: Game_Map_Hornet / <area> / <room>, drawn as GameMapScene.SetMapped draws it.
        if len(names) != 3 or names[0] != 'Game_Map_Hornet' or names[1] in NOT_AREAS:
            continue
        own = sprite = None
        try:
            own = sr.m_Sprite.read()
        except Exception:
            own = None   # a room with no drawing of its own (Halfway_01): kept as a point
        sprite, color, on = own, sr.m_Color, bool(sr.m_Enabled and go.m_IsActive)
        for c in comps:
            if c.type.name != 'MonoBehaviour':
                continue
            tree = c.read_typetree()
            cls = CLASS.get(tree['m_Script']['m_PathID'])
            if cls == 'GameMapScene':
                # The full drawing only for a room that starts Rough; a Hidden one keeps its own.
                if tree['initialState'] == ROUGH and tree['fullSprite']['m_PathID']:
                    sprite = resolve(c, tree['fullSprite']) or own
                for alt in tree['altFullSprites']:
                    if fixed(holds(alt['Condition']), names[2] + "'s drawing"):
                        sprite = resolve(c, alt['Sprite']) or sprite
                        break
                for alt in tree['altColors']:
                    if fixed(holds(alt['Condition']), names[2] + "'s colour"):
                        color = alt['Color']   # a type tree's Color: a dict
                        break
                on = c_join('all', [on, c_not(holds(tree['hideCondition']))])
            elif cls == 'DeactivatePlayerDataTest':
                on = c_join('all', [on, c_not(holds(tree['test']))])
            elif cls == 'DeactivateIfPlayerdataFalse':
                f = tree['boolName']
                if f not in STATE:
                    raise KeyError(f'a map condition reads {f}: set it in STATE')
                on = c_join('all', [on, ['flag', f] if f in VARY else STATE[f]])
        if sprite is not None and sprite.m_Name.startswith(ICONS):
            continue
        x, y, sx, sy = world(ts)
        rooms.append({'scene': names[2], 'area': names[1], 'x': x, 'y': y, 'sx': sx, 'sy': sy, 'sprite': sprite,
                      'color': rgb(color) + (1.0,), 'on': on})   # OnAwake sets the alpha to 1

    # The extent, without the few objects parked far from the map (an editor's leftovers).
    xs = sorted(r['x'] for r in rooms)
    rooms = [r for r in rooms if xs[5] - 30 <= r['x'] <= xs[-6] + 30]
    placed, boxes, points = [], {}, []
    for r in rooms:
        if r['sprite'] is None:
            points.append(r)
            continue
        try:
            im = full_image(r['sprite'])
        except Exception:
            continue
        k = PPU_OUT / r['sprite'].m_PixelsToUnits
        w, h = max(1, round(im.width * k * abs(r['sx']))), max(1, round(im.height * k * abs(r['sy'])))
        im = im.resize((w, h), Image.LANCZOS)
        if r['sx'] < 0:
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
        cr, cg, cb, ca = r['color']
        ch = im.split()
        im = Image.merge('RGBA', tuple(band.point(lambda v, m=m: int(v * m)) for band, m in zip(ch, (cr, cg, cb, ca))))
        pv = r['sprite'].m_Pivot
        placed.append((r, im, pv))
    minx = min(r['x'] for r, im, pv in placed) - 4
    maxx = max(r['x'] for r, im, pv in placed) + 4
    miny = min(r['y'] for r, im, pv in placed) - 4
    maxy = max(r['y'] for r, im, pv in placed) + 4
    W, H = round((maxx - minx) * PPU_OUT), round((maxy - miny) * PPU_OUT)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    at = []
    for r, im, pv in placed:
        px = round((r['x'] - minx) * PPU_OUT - im.width * pv.x)
        py = round((maxy - r['y']) * PPU_OUT - im.height * (1 - pv.y))
        at.append((r, im, px, py))
        boxes.setdefault(r['scene'], [px, py, im.width, im.height, r['area']])
    # The destroyed rooms have no condition of their own: the game maps them once Hornet is in
    # them, in Act 3. One that covers a room the game hides once act3MapUpdated (the Cradle,
    # Cogwork Core, the Ventrica hub) is there only then; the Act 3 rooms that stand anywhere else
    # are new places, and are always drawn.
    gone = [(px, py, im.width, im.height) for r, im, px, py in at if r['scene'] in ACT3_HIDDEN]
    def covers(px, py, w, h):
        return any(min(px + w, gx + gw) - max(px, gx) > 0.2 * min(w, gw) and min(py + h, gy + gh) - max(py, gy) > 0.2 * min(h, gh)
                   for gx, gy, gw, gh in gone)
    for r, im, px, py in at:
        if '_Destroyed' in r['scene'] and covers(px, py, im.width, im.height):
            r['on'] = c_join('all', [r['on'], ['flag', 'act3MapUpdated']])
    # rooms.webp: the rooms that are there in every state. Each condition's rooms: a layer.
    layers = {}
    for r, im, px, py in at:
        if r['on'] is True:
            canvas.alpha_composite(im.crop((max(0, -px), max(0, -py), im.width, im.height)), (max(0, px), max(0, py)))
        elif r['on'] is not False:
            layers.setdefault(json.dumps(r['on']), []).append((r, im, px, py))
    for r in points:
        boxes.setdefault(r['scene'], [round((r['x'] - minx) * PPU_OUT), round((maxy - r['y']) * PPU_OUT), 0, 0, r['area']])

    # states.webp: the layers one under another, each cropped to its rooms, with a gap between
    # (the lossy image bleeds a pixel or two). LAYERS: [when, x, y, w, h, top, scenes], `top` its
    # row in states.webp.
    GAP = 4
    LAYERS, cut, top = [], [], 0
    for when, rs in sorted(layers.items()):
        x0, y0 = max(0, min(px for r, im, px, py in rs)), max(0, min(py for r, im, px, py in rs))
        x1, y1 = min(W, max(px + im.width for r, im, px, py in rs)), min(H, max(py + im.height for r, im, px, py in rs))
        part = Image.new('RGBA', (x1 - x0, y1 - y0), (0, 0, 0, 0))
        for r, im, px, py in rs:
            part.alpha_composite(im.crop((max(0, -px), max(0, -py), im.width, im.height)), (max(0, px) - x0, max(0, py) - y0))
        LAYERS.append([json.loads(when), x0, y0, x1 - x0, y1 - y0, top, sorted({r['scene'] for r, im, px, py in rs})])
        cut.append((part, top))
        top += part.height + GAP
    sheet = Image.new('RGBA', (max(p.width for p, _ in cut), top - GAP), (0, 0, 0, 0))
    for part, y in cut:
        sheet.alpha_composite(part, (0, y))
    layer_of = {s: i for i, l in enumerate(LAYERS) for s in l[6]}
    for l in LAYERS:
        print('layer', json.dumps(l[0]), l[1:6], ', '.join(l[6]))

    # The pins in the image's pixels; one of a kind per spot and state (a room's two states can
    # draw it twice). A pin in a layer's room is there when its room is.
    PINS = []
    for p in sorted(pins, key=lambda p: (p['kind'], p['scene'], p['x'], p['y'])):
        px, py = round((p['x'] - minx) * PPU_OUT), round((maxy - p['y']) * PPU_OUT)
        if any(q[0] == p['kind'] and abs(q[1] - px) < 12 and abs(q[2] - py) < 12 and layer_of.get(q[3]) == layer_of.get(p['scene'])
               for q in PINS):
            continue
        PINS.append([p['kind'], px, py, p['scene']] + ([p['lit']] if p['lit'] else []))

    out = os.path.join(ROOT, 'assets', 'map')
    os.makedirs(out, exist_ok=True)
    if ppu != 48:
        canvas.save(os.path.join(out, 'rooms-hd.webp'), 'WEBP', quality=80, method=6)
        sheet.save(os.path.join(out, 'states-hd.webp'), 'WEBP', quality=80, method=6)
        print(f'{W} × {H} px → assets/map/rooms-hd.webp ({os.path.getsize(os.path.join(out, "rooms-hd.webp")) // 1024} KB), states-hd.webp')
        return
    canvas.save(os.path.join(out, 'rooms.webp'), 'WEBP', quality=85, method=6)
    sheet.save(os.path.join(out, 'states.webp'), 'WEBP', quality=85, method=6)
    data = {'W': W, 'H': H, 'PPU': PPU_OUT, 'ROOMS': dict(sorted(boxes.items())), 'PINS': PINS,
            'LAYERS': LAYERS, 'SW': sheet.width, 'SH': sheet.height,
            'VARY': list(VARY), 'FREE': [f for f in VARY if STATE[f]]}
    src = ("/* js/map.js — where each room is on assets/map/rooms.webp, by its scene name.\n"
           "   GENERATED by tools/extract-map.py from the game's own files (the map screen's tree):\n"
           "   not edited by hand. W, H: the image's size; PPU: its pixels per world unit;\n"
           "   ROOMS: scene → [x, y, w, h, area] in the image's pixels (the area as the game names its\n"
           "   branch of the map: Bone, Crawl, Dock…); w = h = 0 for a room with no drawing of its own,\n"
           "   a point where the game places it.\n"
           "   PINS: [kind, x, y, scene, lit?]: the game's own pins for the benches, the Bellways and the\n"
           "   Ventrica stations (kind: bench, bellway, ventrica), and what lights one (the station\n"
           "   unlocked, the toll paid) in js/collectibles.js's form; a plain bench has none. A pin is\n"
           "   there when its scene's room is.\n"
           "   LAYERS: [when, x, y, w, h, top, scenes]: the rooms that change with the game, not in\n"
           "   rooms.webp but in assets/map/states.webp (SW × SH), one layer per condition: drawn at\n"
           "   x, y (w × h) on the map while `when` holds (js/collectibles.js's form over the VARY\n"
           "   flags), from row `top` of states.webp. VARY: the playerData flags they read; FREE: those\n"
           "   set with no save (none: the world before Act 3). */\n"
           "(() => {\n  'use strict';\n  const SS = globalThis.SS || (globalThis.SS = {});\n"
           f"  SS.map = {json.dumps(data, separators=(',', ':'))};\n"
           "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.map;\n})();\n")
    open(os.path.join(ROOT, 'js', 'map.js'), 'w').write(src)
    print(f'{len(PINS)} pins ({", ".join(f"{sum(p[0] == k for p in PINS)} {k}" for k in PIN_KIND.values())}), {len(boxes)} rooms, {W} × {H} px → assets/map/rooms.webp '
          f'({os.path.getsize(os.path.join(out, "rooms.webp")) // 1024} KB), {len(LAYERS)} layers → assets/map/states.webp '
          f'({os.path.getsize(os.path.join(out, "states.webp")) // 1024} KB), js/map.js')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('usage: extract-map.py "<Steam>/steamapps/common/Hollow Knight Silksong"')
    main(sys.argv[1])
    main(sys.argv[1], 96)   # the close-up images (rooms-hd.webp, states-hd.webp)
