"""tools/extract-map.py — Pharloom's map from the game's own files, piece by piece as the game's map
screen draws it: every piece's drawings into assets/map/pieces.webp (and pieces-hd.webp, twice as
fine, for close up), and the rules that say which drawing each piece shows for a save, with where
each room is, into js/map.js.
Needs the game installed and UnityPy (no pip on the author's machine: uv, in an env of its own):
    uv venv /tmp/unitypy && uv pip install --python /tmp/unitypy/bin/python UnityPy numpy
    /tmp/unitypy/bin/python tools/extract-map.py "<Steam>/steamapps/common/Hollow Knight Silksong"
The image is Team Cherry's art, published as the Hollow Knight site publishes its map (a fan
project; the colophon says so). Re-run it after a patch that touches the map.

Where it is (found on 27-Sep-2026, design/00-study.md §4.7):
  · maps_assets_all.bundle (Addressables, StreamingAssets/aa/StandaloneLinux64/): a tree under
    Game_Map_Hornet, one child per area (Bone, Crawl, Dock…), and under each area one GameObject
    per map piece named after its scene (Greymoor_02, and its parts Greymoor_02_mid,
    Greymoor_02_top: the game maps a room by its parts), with its Transform, a SpriteRenderer and
    a GameMapScene; the icons (pins, arrows, markers) are deeper in the tree or in groups of their
    own, and aren't drawn: the site draws its own.
  · the pins the site draws (found on 28-Sep-2026): under a room, a "Bench Pin" (also "Toll",
    "Bellshrine", "Swamp Shaman"), "Bellway Pin" or "Tube Pin" (a Ventrica station), with a
    component whose visibleCondition is the pin set bought from the Mapper (hasPinBench…) and
    whose materialCondition is what lights it: the station unlocked (UnlockedShadowStation…),
    the toll paid (the room's bell_toll_machine). They're written to js/map.js as PINS, the
    condition in js/collectibles.js's form; a plain bench has none. The Flea Caravan's benches
    ("Bench Pin Caravan", 11-Oct-2026) carry where the caravan has to be for the game to show
    them (their DeactivatePlayerDataTest on CaravanTroupeLocation), and Fleatopia's "Pre" bench
    is there until the caravan comes, so Fleatopia always has one; they go after the rest, so
    the pins before keep their index (js/map-fixes.js keys them by it). Left out: the Steel Soul
    and fake ones, the vendors (each with its own merchant's state), and the arrows and markers.
    Two benches have no pin on the game's map: the Songclave's (UNPINNED), placed by its RestBench
    (kb/data/game/pickups.json, tools/extract-pickups.py) as tools/gen-spots.js places a point, and
    the Bellhome's (INSIDE: Belltown_Room_Spare has no drawing of its own, so it goes at its door in
    Belltown, the one the Belltown House Key opens, and it's lit once BelltownHouseUnlocked).
    Song_01b's RestBench is not one: its GameObject is switched off in the scene and nothing in the
    scene turns it on (read 12-Oct-2026), and no save rests there.
  · the sprites are in atlases_assets_assets/sprites/_atlases/hornet_map.spriteatlas.bundle (a
    4096² BC7 texture, 1,199 sprites) and hornet_map_patch.spriteatlas.bundle.
  · Unity 6 strips its version from the bundles: UnityPy needs it set (6000.0.50f1, the one
    globalgamemanagers carries).

How the game draws it (its code, Assembly-CSharp 1.0.30000, read with ILSpy on 3-Oct-2026:
GameMap.SetupMap and EnableUnlockedAreas, GameMapScene, PlayerDataTest, PositionConditions,
DeactivatePlayerDataTest, DeactivateIfPlayerdataFalse). js/rooms.js piecesOn does the same:
  · an area shows while its playerData bool holds (GameMap.mapZoneInfo's Parents: HasGreymoorMap
    for Greymoor and Wisp, HasMossGrottoMap for Bonetown and Tut…) or mapAllRooms is set. Dust
    Maze and Surface have no bool: the game never shows them.
  · a piece is mapped when mapAllRooms is set, its scene is in scenesMapped, every scene of its
    mappedIfAllMapped is, or its mappedParent is mapped.
  · a piece is drawn whole (SetMapped) when it starts Full, or is mapped, and Hornet has the Quill
    (hasQuill): a Rough piece then shows its fullSprite (its renderer's own sprite if it has
    none), a Hidden or Full one its renderer's own; the first altFullSprites whose condition holds
    replaces it, and the first altColors' colour its tint. Otherwise (SetNotMapped) a Hidden piece
    shows nothing and a Rough one its renderer's sprite, the rough sketch (grey when it has no
    fullSprite); a Full one, never set, keeps its renderer's sprite and tint.
  · hideCondition switches the renderer off when it holds (it has to have tests);
    DeactivatePlayerDataTest switches the piece off when its test holds; DeactivateIfPlayerdataFalse
    when its bool is false. A renderer off in the scene file stays off; a piece switched off in it
    is switched on by SetMapped.
  · a PlayerDataTest holds when any of its groups holds, a group when all its tests do; with no
    groups it holds. Tests read a bool, a number or a string of playerData.
  · PositionConditions moves an area: the first position whose condition holds gives an offset
    from where it is and a scale (the Slab with the Cloakless crest, the Dust Maze by its
    entrance).

What js/map.js carries for that (its header says it field by field): PIECES, each piece's rules
and its drawings' places in pieces.webp; ZONES, each area's bool and moves; VARS, the playerData
fields the rules read; FREE, their values with no save (the world explored before Act 3, with
Verdania's Dancers and the Unravelled beaten). With no save the site maps every piece but those
that only exist once the Cradle has fallen (act3 in PIECES).

How it's drawn (3-Oct-2026, against mapgenie's map of Pharloom): the game's sprites, placed at
their native 100 pixels a unit, meet cleanly. So each drawing is placed here to the fraction of a
pixel (placed()): rounded one by one, rooms that touch drew a gap or an overlap where they join.
Nothing reaches under its neighbours: a drawing grown a pixel to hide the seams drew its soft
edges and the ends of its outline over them. The seams were the browser's, which smoothed the
edge of each piece's window; the site now composes the pieces on a canvas first
(js/map-paint.js), and they meet as in the game.
Two more seams were ours (11-Oct-2026): drawn one over the other, two drawings that meet edge to
edge cover the pixel on the line less than whole (close_joins() gives it to the later one), and
the sheets were lossy, coding each drawing's edge against its neighbours in the sheet (a lighter
and a darker line along joins, blotched fills): they're lossless now. Each drawing's box holds
everything either size draws, so the fine one's faintest pixels aren't cut along it.
"""
import json, math, os, re, sys
import UnityPy
from PIL import Image

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
PPU = 48                # pixels per world unit on the site's map (the whole map is ~73 × 54 units)
HD = 2                  # pieces-hd.webp: twice as fine (the game draws its map at 100 pixels a unit)
NOT_AREAS = {'Pan Audio Loop', 'Main Quest Pins', 'Compass Icon', 'Shade Pos', 'Map Markers', 'Flea Tracker Markers'}
ICONS = ('pin_', 'quest_map_icon', 'Map_Arrow')
PIN = re.compile(r'^(Bench|Bellway|Tube) Pin( Toll| Bellshrine| Swamp Shaman| Caravan| Pre)?( \(\d+\))?$')
PIN_KIND = {'Bench': 'bench', 'Bellway': 'bellway', 'Tube': 'ventrica'}
# The benches the game's map has no pin for, placed by their scene's RestBench: the Songclave's
# (Song_Enclave; it appears once the Songclave grows, enclaveLevel, and stays in Act 3).
UNPINNED = ['Song_Enclave']
# A bench in a room with no place on the map: its scene → [the scene it's entered from, the playerData
# field whose door (pickups.json pd) it's entered by, the field that lights it].
INSIDE = {'Belltown_Room_Spare': ['Belltown', 'BelltownHouseUnlocked', 'BelltownHouseUnlocked']}
PICKUPS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'kb', 'data', 'game', 'pickups.json')
HIDDEN, ROUGH, FULL = 0, 1, 2   # GameMapScene.States
GREY = (0.5, 0.5, 0.5)          # Color.grey: a Rough piece with no fullSprite, not mapped
SHEET_W = 2048                  # pieces.webp's width, in the map's pixels
GAP = 2                         # between drawings in the sheet
# With no save: the world explored before Act 3, with Verdania's Dancers and the Unravelled beaten
# (Verdania's colours and its two rooms, Whiteward's pit). Every field a rule reads has to be here:
# one that isn't stops the run, so a patch that adds one is seen.
FREE = {
    'act3MapUpdated': False,          # the Cradle, Cogwork Core and the Ventrica hub before they fall
    'defeatedCloverDancers': True,
    'wardBossDefeated': True,
    'HasWhiteFlower': False,          # the Abyss's diving bell, broken until the Everbloom
    'SeenDivingBellGoneAbyss': False,
    'HasJudgeStepsMap': True,         # Coral_19_base, drawn once the Blasted Steps are mapped
    'CurrentCrestID': 'Hunter',       # the Slab where it is (it moves with the Cloakless crest)
    'MazeEntranceScene': '',          # the Dust Maze where it is
}


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
    """A pin's condition → js/collectibles.js's form, or None when it's always true: its
    PlayerDataTest is groups (any) of tests (all), each a playerData bool that must be BoolValue;
    its PersistentBool, a sceneData flag, is one more way to be true."""
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


def caravan_here(t):
    """A caravan bench's DeactivatePlayerDataTest → where the caravan has to be for the pin to
    show, in js/rooms.js's rule form over CaravanTroupeLocation: 'is' for a caravan's bench (off
    while the caravan is elsewhere), 'not is' for Fleatopia's "Pre" one (off once it's there). The
    group that tests the pin set bought (hasPinBench) is left out, as for every pin."""
    here = None
    for g in t['TestGroups']:
        for x in g['Tests']:
            if x['Type'] == 0 and x['FieldName'].startswith('hasPin'):
                continue
            if x['FieldName'] != 'CaravanTroupeLocation' or x['Type'] not in (1, 3) or x['NumType'] not in (0, 1) or here:
                raise ValueError(f'a bench pin switched off by something else: {t}')
            at = ['is', 'CaravanTroupeLocation', x['IntValue']]
            here = at if x['NumType'] == 1 else ['not', at]
    return here


# ── A map rule: a PlayerDataTest in js/rooms.js's form, read against a save's VARS ──
# True (always), False (never), or ['flag', f] (a bool), ['is', f, v] (a string, an enum or a
# number equal to v), ['has', f, v] (a string containing v), ['lt', f, v], ['gt', f, v], and
# 'not', 'all', 'any' over them. A field read goes into VARS.
VARS = set()


def c_not(c):
    return (not c) if isinstance(c, bool) else c[1] if c[0] == 'not' else ['not', c]


def c_join(op, cs):
    stop, skip = (False, True) if op == 'all' else (True, False)
    if any(c is stop for c in cs):
        return stop
    cs = [c for c in cs if c is not skip]
    return skip if not cs else cs[0] if len(cs) == 1 else [op] + cs


def test(t):
    """One PlayerDataTest.Test: Bool, Int, Float, Enum (by its number), String."""
    f = t['FieldName']
    if f not in FREE:
        raise KeyError(f'a map rule reads {f}: give it its value with no save in FREE')
    VARS.add(f)
    ty = t['Type']
    if ty == 0:
        return ['flag', f] if t['BoolValue'] else ['not', ['flag', f]]
    if ty == 4:
        v, op = t['StringValue'], t['StringType']   # Equal, NotEqual, Contains, NotContains
        c = ['is', f, v] if op in (0, 1) else ['has', f, v]
        return c if op in (0, 2) else ['not', c]
    v = t['IntValue'] if ty in (1, 3) else t['FloatValue']
    op = t['NumType']                               # Equal, NotEqual, LessThan, MoreThan
    return [['is', f, v], ['not', ['is', f, v]], ['lt', f, v], ['gt', f, v]][op]


def rule(pdt):
    """A PlayerDataTest: any group holds, a group when all its tests do; no groups: it holds."""
    groups = (pdt or {}).get('TestGroups') or []
    if not groups:
        return True
    return c_join('any', [c_join('all', [test(t) for t in g['Tests']]) for g in groups])


def holds(c, v):
    """A rule against a save's values (FREE, for the drawing with no save)."""
    if isinstance(c, bool):
        return c
    op = c[0]
    if op == 'flag':
        return v[c[1]] is True
    if op == 'is':
        return v[c[1]] == c[2]
    if op == 'has':
        return c[2] in str(v[c[1]])
    if op == 'lt':
        return v[c[1]] < c[2]
    if op == 'gt':
        return v[c[1]] > c[2]
    if op == 'not':
        return not holds(c[1], v)
    return (all if op == 'all' else any)(holds(x, v) for x in c[1:])


def resolve(owner, pptr, byfile):
    """A type tree's PPtr, relative to the file that holds `owner`: 0 is that file, n its n-th
    external (the atlas bundle's file, for the sprites)."""
    f, pid = pptr['m_FileID'], pptr['m_PathID']
    if not pid:
        return None
    name = owner.assets_file.name if f == 0 else owner.assets_file.externals[f - 1].path.split('/')[-1]
    o = byfile.get(name.lower(), {}).get(pid)
    return o.read() if o else None


SUPER = 4   # placed drawings are drawn this many times finer, then averaged down


def placed(sprite, color, wx, wy, sx, sy, ox, oy, ppu):
    """A sprite drawn on the map's own pixel grid at `ppu` pixels a unit: flipped as its scale
    says, at its exact place (its pivot at world point wx, wy; ox, oy the map's top left corner in
    world units), multiplied by its tint (the renderer's colour, alpha 1: GameMapScene.OnAwake
    sets it). Returns the drawing and its top left pixel. Each drawing is placed to the fraction
    of a pixel, not rounded on its own, so that edges which meet in the game meet here: rounded
    one by one, rooms that touch drew a hairline gap or overlap where they join (3-Oct-2026)."""
    im = full_image(sprite)
    pvx, pvy = sprite.m_Pivot.x, sprite.m_Pivot.y
    if sx < 0:
        im, pvx = im.transpose(Image.FLIP_LEFT_RIGHT), 1 - pvx
    kx, ky = ppu / sprite.m_PixelsToUnits * abs(sx), ppu / sprite.m_PixelsToUnits * abs(sy)
    left = (wx - ox) * ppu - im.width * kx * pvx
    top = (oy - wy) * ppu - im.height * ky * (1 - pvy)
    X0, Y0 = math.floor(left), math.floor(top)
    w, h = max(1, math.ceil(left + im.width * kx) - X0), max(1, math.ceil(top + im.height * ky) - Y0)
    pre = im.convert('RGBa')   # premultiplied, so that the averaging doesn't darken the edges
    out = pre.transform((w * SUPER, h * SUPER), Image.AFFINE,
                        (1 / (SUPER * kx), 0, (X0 - left) / kx, 0, 1 / (SUPER * ky), (Y0 - top) / ky),
                        resample=Image.BILINEAR).reduce(SUPER).convert('RGBA')
    ch = out.split()
    out = Image.merge('RGBA', tuple(band.point(lambda v, m=m: int(v * m)) for band, m in zip(ch, tuple(color) + (1.0,))))
    return out, X0, Y0


def canvas_box(sprite, wx, wy, sx, sy, ox, oy, ppu):
    """The drawing's whole canvas on the map as ROOMS has always kept it (rounded one by one): the
    marks are placed by it, so it mustn't move."""
    k = ppu / sprite.m_PixelsToUnits
    im = full_image(sprite)
    w, h = max(1, round(im.width * k * abs(sx))), max(1, round(im.height * k * abs(sy)))
    pv = sprite.m_Pivot
    return [round((wx - ox) * ppu - w * pv.x), round((oy - wy) * ppu - h * (1 - pv.y)), w, h]


JOIN = (0.92, 1.08)   # two partly covered pixels whose coverages add up to about one: a join
OVERLAP = 1.5         # up to this, two facing edges that add up to more than one: a join placed a fraction over
EDGE = (8, 247)       # partly covered: the fills are 254 or 255, and below 8 a pixel's colour is a guess


def close_joins(looks, which, f, W):
    """Where two pieces meet edge to edge (a room's parts along their cut, two rooms that touch),
    each drawing has the pixel on the line partly covered, a coverage and its complement: the
    drawing whose edge falls 0.25 of the way in has 0.25 there, its neighbour 0.75. Drawn one over
    the other, they cover it 0.25 + 0.75 × 0.75, not 1, and the black under them shows through
    along the whole join (up to a quarter of it: Library_09_top against Enclave_bridge_left).
    Each drawing is smoothed on its own, so only here, where all of them are known, can this be
    put right: on such a pixel the piece the game draws later (its neighbour is under it) takes
    both coverages and their colours, mixed by them, so the two cover it whole together as one
    drawing of both would; alone, its edge is at most a pixel harder. So too where two edges
    face each other (their drawings on opposite sides of the pixel) and add up to a little more
    than one (up to OVERLAP): placed to the fraction, the two drawings overlap there by part of a
    pixel, which the fine drawing shows (Library_09_top's 191 and Enclave_bridge_left's 128 of
    255 made 223, a darker line along the join), and one drawing of both would cover it whole.
    Other pixels partly covered by two pieces are overlaps or gaps, and are left as they are; so are drawings of the same piece (its sprites and tints are alternatives, never
    drawn together). `which` is the drawing at `f` pixels a map pixel ('im', 'hd'); W the map's
    width. Returns how many pixels it closed."""
    import numpy as np
    idx, px, own, grad = [], [], [], []
    for i, lk in enumerate(looks):
        a = np.asarray(lk[which], dtype=np.int64)
        ys, xs = np.nonzero((a[:, :, 3] >= EDGE[0]) & (a[:, :, 3] <= EDGE[1]))
        idx.append((ys + lk['y'] * f) * (W * f) + xs + lk['x'] * f)
        px.append(a[ys, xs])
        own.append(np.full(len(ys), i))
        # Which way the drawing lies from the pixel: towards where its coverage grows.
        al = np.pad(a[:, :, 3], 1)
        grad.append(np.stack([al[ys + 1, xs + 2] - al[ys + 1, xs], al[ys + 2, xs + 1] - al[ys, xs + 1]], axis=1))
    idx, px, own, grad = np.concatenate(idx), np.concatenate(px), np.concatenate(own), np.concatenate(grad)
    o = np.argsort(idx, kind='stable')
    idx, px, own, grad = idx[o], px[o], own[o], grad[o]
    starts = np.flatnonzero(np.r_[True, idx[1:] != idx[:-1]])
    ends = np.r_[starts[1:], len(idx)]
    lo, hi = JOIN[0] * 255, JOIN[1] * 255
    fix = {}   # look → {pixel: (r, g, b, a)}
    for s, e in zip(starts[ends - starts >= 2], ends[ends - starts >= 2]):
        es = [(looks[own[k]]['rank'], own[k], px[k], grad[k]) for k in range(s, e)]
        for rl, il, pl, gl in es:
            for re_, ie, pe, ge in es:
                al_, ae = int(pl[3]), int(pe[3])
                facing = int(gl[0]) * int(ge[0]) + int(gl[1]) * int(ge[1]) < 0
                if re_ < rl and (lo <= al_ + ae <= hi or (facing and hi < al_ + ae <= OVERLAP * 255)):
                    rgb = [round((int(pl[c]) * al_ + int(pe[c]) * ae) / (al_ + ae)) for c in range(3)]
                    fix.setdefault(il, {})[int(idx[s])] = tuple(rgb) + (min(255, al_ + ae),)
                    break
    n = 0
    for i, at in fix.items():
        lk = looks[i]
        a = np.array(lk[which])
        for k, v in at.items():
            y, x = divmod(k, W * f)
            a[y - lk['y'] * f, x - lk['x'] * f] = v
            n += 1
        lk[which] = Image.fromarray(a, 'RGBA')
    return n


HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')


def main(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    atl = os.path.join(aa, 'atlases_assets_assets', 'sprites', '_atlases')
    mono = next(f for f in os.listdir(aa) if f.endswith('_monoscripts.bundle'))   # the scripts' class names
    env = UnityPy.load(os.path.join(aa, 'maps_assets_all.bundle'), os.path.join(atl, 'hornet_map.spriteatlas.bundle'),
                       os.path.join(atl, 'hornet_map_patch.spriteatlas.bundle'), os.path.join(aa, mono))
    CLASS, BYFILE, T = {}, {}, {}
    for o in env.objects:
        BYFILE.setdefault(o.assets_file.name.lower(), {})[o.path_id] = o
        if o.type.name == 'MonoScript':
            CLASS[o.path_id] = o.read().m_ClassName
        if o.type.name in ('Transform', 'RectTransform'):
            T[o.path_id] = o.read()
    go_name = {}

    def chain(t):
        out = []
        while t is not None:
            out.append(t)
            f = t.m_Father.m_PathID
            t = T.get(f) if f else None
        return list(reversed(out))   # root first

    def names_of(t):
        return [x.m_GameObject.read().m_Name for x in chain(t)]

    def world(ts):
        x = y = 0.0
        sx = sy = 1.0
        for t in ts:
            lp, ls = t.m_LocalPosition, t.m_LocalScale
            x, y = x + lp.x * sx, y + lp.y * sy
            sx, sy = sx * ls.x, sy * ls.y
        return x, y, sx, sy

    for t in T.values():
        go_name[t.m_GameObject.m_PathID] = t
    behaviours = {}   # GameObject's path id → [(class, type tree, object)]
    for o in env.objects:
        if o.type.name == 'MonoBehaviour':
            tree = o.read_typetree()
            behaviours.setdefault(tree['m_GameObject']['m_PathID'], []).append((CLASS.get(tree['m_Script']['m_PathID']), tree, o))

    # The areas: which bool shows each (GameMap.mapZoneInfo), and how it moves (PositionConditions).
    zone_bool, zone_moves = {}, {}
    for gid, bs in behaviours.items():
        for cls, tree, o in bs:
            if cls == 'GameMap':
                for z in tree['mapZoneInfo']:
                    for p in z['Parents']:
                        t = go_name.get(p['Parent']['m_PathID'])
                        if t is not None:
                            zone_bool[names_of(t)[-1]] = p['PlayerDataBool'] or None
            elif cls == 'PositionConditions':
                t = go_name[gid]
                ns = names_of(t)
                if len(ns) == 2 and ns[0] == 'Game_Map_Hornet':
                    zone_moves[ns[1]] = [[rule(q['Condition']), q['Offset']['x'], q['Offset']['y'], q['Scale']['x'], q['Scale']['y']]
                                         for q in tree['positionsOrdered']]

    # The pieces: Game_Map_Hornet / <area> / <piece>, with the GameMapScene's rules.
    pieces, pins = [], []
    by_id = {}
    for o in env.objects:
        if o.type.name != 'GameObject':
            continue
        go = o.read()
        comps = [(getattr(c, 'component', c)).deref() for c in go.m_Components]
        tr = next((c.read() for c in comps if c.type.name in ('Transform', 'RectTransform')), None)
        sr = next((c.read() for c in comps if c.type.name == 'SpriteRenderer'), None)
        if tr is None:
            continue
        ts = chain(tr)
        names = [t.m_GameObject.read().m_Name for t in ts]
        # A pin: Game_Map_Hornet / <area> / <room> / … / <kind> Pin.
        m = PIN.match(go.m_Name)
        if m and sr is not None and len(names) >= 4 and names[0] == 'Game_Map_Hornet':
            lit = here = None
            caravan = m.group(2) in (' Caravan', ' Pre')
            for cls, tree, _ in behaviours.get(o.path_id, []):
                if 'materialCondition' in tree:
                    lit = condition(tree['materialCondition'])
                if caravan and cls == 'DeactivatePlayerDataTest':
                    here = caravan_here(tree['test'])
            if caravan and not here:
                raise ValueError(f'a caravan bench that never goes: {"/".join(names)}')
            x, y, _, _ = world(ts)
            pins.append({'kind': PIN_KIND[m.group(1)], 'scene': names[2], 'x': x, 'y': y, 'lit': lit, 'here': here, 'caravan': caravan})
            continue
        if sr is None or len(names) != 3 or names[0] != 'Game_Map_Hornet' or names[1] in NOT_AREAS:
            continue
        bs = behaviours.get(o.path_id, [])
        gms = next((tree for cls, tree, _ in bs if cls == 'GameMapScene'), None)
        gms_o = next((ob for cls, tree, ob in bs if cls == 'GameMapScene'), None)
        try:
            own = sr.m_Sprite.read()
        except Exception:
            own = None   # a room with no drawing of its own (Halfway_01): kept as a point
        if own is not None and own.m_Name.startswith(ICONS):
            continue
        p = {'scene': names[2], 'area': names[1], 'own': own, 'color': (sr.m_Color.r, sr.m_Color.g, sr.m_Color.b),
             'renderer': bool(sr.m_Enabled), 'active': bool(go.m_IsActive), 'ts': ts, 'state': FULL, 'full': None,
             'alt_sprites': [], 'alt_colors': [], 'hide': False, 'off': False, 'parent': None, 'ifall': [], 'gid': o.path_id}
        if gms is not None:
            p['state'] = gms['initialState']
            p['full'] = resolve(gms_o, gms['fullSprite'], BYFILE) if gms['fullSprite']['m_PathID'] else None
            p['alt_sprites'] = [(rule(a['Condition']), resolve(gms_o, a['Sprite'], BYFILE)) for a in gms['altFullSprites']]
            p['alt_colors'] = [(rule(a['Condition']), (a['Color']['r'], a['Color']['g'], a['Color']['b'])) for a in gms['altColors']]
            # hideCondition only counts with tests (OnEnable checks TestGroups.Length).
            p['hide'] = rule(gms['hideCondition']) if (gms['hideCondition'].get('TestGroups') or []) else False
            p['parent'] = gms['mappedParent']['m_PathID'] or None
            p['ifall'] = [x['m_PathID'] for x in gms['mappedIfAllMapped'] if x['m_PathID']]
        offs = []
        for cls, tree, _ in bs:
            if cls == 'DeactivatePlayerDataTest':
                offs.append(rule(tree['test']))
            elif cls == 'DeactivateIfPlayerdataFalse':
                if tree['objectToDeactivate']['m_PathID']:
                    raise ValueError(f'{names[2]}: DeactivateIfPlayerdataFalse switches off another object')
                if tree['boolName'] not in FREE:
                    raise KeyError(f'a map rule reads {tree["boolName"]}: give it its value with no save in FREE')
                VARS.add(tree['boolName'])
                offs.append(['not', ['flag', tree['boolName']]])
        p['off'] = c_join('any', offs)
        pieces.append(p)
        by_id[o.path_id] = p
        if gms_o is not None:
            by_id[gms_o.path_id] = p   # mappedParent and mappedIfAllMapped point at the GameMapScene, not its GameObject
    for p in pieces:
        p['parent'] = by_id[p['parent']]['scene'] if p['parent'] in by_id else None
        p['ifall'] = [by_id[i]['scene'] for i in p['ifall'] if i in by_id]

    # The extent, without the few objects parked far from the map (an editor's leftovers).
    for p in pieces:
        p['x'], p['y'], p['sx'], p['sy'] = world(p['ts'])
        p['z'] = sum(t.m_LocalPosition.z for t in p['ts'])
    xs = sorted(p['x'] for p in pieces)
    pieces = [p for p in pieces if xs[5] - 30 <= p['x'] <= xs[-6] + 30]

    # Each piece's drawings: whole (each sprite × each tint the rules can give), and the sketch.
    def whole_sprite(p):
        return (p['full'] or p['own']) if p['state'] == ROUGH else p['own']
    for p in pieces:
        sprites = [(c, s) for c, s in p['alt_sprites'] if s is not None] + [(True, whole_sprite(p))]
        colors = p['alt_colors'] + [(True, p['color'])]
        p['sprites'], p['colors'] = sprites, colors
        p['looks'] = {}
        if sprites[-1][1] is None:
            continue
        for si, (_, s) in enumerate(sprites):
            for ci, (_, c) in enumerate(colors):
                p['looks'][f'{si},{ci}'] = (s, c)
        if p['state'] == ROUGH and p['own'] is not None:
            p['looks']['rough'] = (p['own'], p['color'] if p['full'] else GREY)

    # The map's frame, as before (the same pixels for ROOMS, PINS and the marks): the free-mode
    # drawing of every piece with one, 4 units of margin.
    drawn = [p for p in pieces if p['looks']]
    minx = min(p['x'] for p in drawn) - 4
    maxx = max(p['x'] for p in drawn) + 4
    miny = min(p['y'] for p in drawn) - 4
    maxy = max(p['y'] for p in drawn) + 4
    W, H = round((maxx - minx) * PPU), round((maxy - miny) * PPU)

    # Each drawing at both sizes, placed on the map (in its own pixels at that size).
    raw, boxes = [], {}
    for p in drawn:
        for key, (s, c) in p['looks'].items():
            im, px, py = placed(s, c, p['x'], p['y'], p['sx'], p['sy'], minx, maxy, PPU)
            # ROOMS keeps the whole drawing's canvas with its first rules (the marks are placed by it).
            if key == f'{len(p["sprites"]) - 1},{len(p["colors"]) - 1}':
                boxes.setdefault(p['scene'], canvas_box(s, p['x'], p['y'], p['sx'], p['sy'], minx, maxy, PPU) + [p['area']])
            hd, hpx, hpy = placed(s, c, p['x'], p['y'], p['sx'], p['sy'], minx, maxy, PPU * HD)
            raw.append((p, key, im, px, py, hd, hpx, hpy))

    # Each drawing's tight box on the map (in PPU pixels) and its place in the sheet: everything
    # either size draws, so that no soft edge or fade is cut along the box (a fine drawing cropped
    # to the coarse one's box lost the faintest pixels of its fades in a straight line).
    rank = {p['gid']: i for i, p in enumerate(sorted(pieces, key=lambda p: -p['z']))}   # the game's order
    looks = []
    for p, key, im, px, py, hd, hpx, hpy in raw:
        p.setdefault('cells', {})
        # A drawing with nothing to see (no pixel above 4 in 255) is no drawing.
        if not im.getchannel('A').point(lambda v: 255 if v > 4 else 0).getbbox():
            continue
        bb, bh = im.getchannel('A').getbbox(), hd.getchannel('A').getbbox()
        x0, y0 = px + bb[0], py + bb[1]
        x1, y1 = px + bb[2], py + bb[3]
        if bh:
            x0, y0 = min(x0, (hpx + bh[0]) // HD), min(y0, (hpy + bh[1]) // HD)
            x1, y1 = max(x1, -(-(hpx + bh[2]) // HD)), max(y1, -(-(hpy + bh[3]) // HD))
        w, h = x1 - x0, y1 - y0
        # The fine drawing cropped to the same box, twice as big (its own rounding aside).
        hd = hd.crop((x0 * HD - hpx, y0 * HD - hpy, x1 * HD - hpx, y1 * HD - hpy))
        p['cells'][key] = len(looks)
        looks.append({'x': x0, 'y': y0, 'w': w, 'h': h, 'im': im.crop((x0 - px, y0 - py, x1 - px, y1 - py)), 'hd': hd,
                      'rank': rank[p['gid']]})
    for p in pieces:
        if not p['looks']:
            boxes.setdefault(p['scene'], [round((p['x'] - minx) * PPU), round((maxy - p['y']) * PPU), 0, 0, p['area']])
    # Where two pieces meet edge to edge, each drawing's pixel on the line is partly covered, and
    # drawn one over the other they cover it less than whole: a dark line along every such join.
    joined = close_joins(looks, 'im', 1, W), close_joins(looks, 'hd', HD, W)

    # pieces.webp: the drawings on shelves, tallest first, SHEET_W wide; pieces-hd.webp the same,
    # twice as big.
    order = sorted(range(len(looks)), key=lambda i: (-looks[i]['h'], i))
    cx = cy = shelf = 0
    for i in order:
        lk = looks[i]
        if cx + lk['w'] > SHEET_W:
            cx, cy, shelf = 0, cy + shelf + GAP, 0
        lk['sx'], lk['sy'] = cx, cy
        cx += lk['w'] + GAP
        shelf = max(shelf, lk['h'])
    SW, SH = SHEET_W, cy + shelf
    sheet = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    sheet_hd = Image.new('RGBA', (SW * HD, SH * HD), (0, 0, 0, 0))
    for lk in looks:
        sheet.paste(lk['im'], (lk['sx'], lk['sy']))
        sheet_hd.paste(lk['hd'], (lk['sx'] * HD, lk['sy'] * HD))

    # The pieces that only exist once the Cradle has fallen: the destroyed ones (no rule of their
    # own: the game maps each once Hornet is in it, in Act 3). With no save they're left out; a
    # save maps them or not.
    # js/map.js PIECES, in the order the game draws them: every piece has the same sorting layer
    # and order, so its orthographic camera draws the farthest first (the largest z) and the
    # nearest over them (Song_09b over Song_09b_top, its broken top edge showing); a tie keeps the
    # bundle's order.
    cells = [[lk['x'], lk['y'], lk['w'], lk['h'], lk['sx'], lk['sy']] for lk in looks]
    PIECES = []
    for p in sorted(pieces, key=lambda p: -p['z']):
        if not p.get('cells'):
            continue
        e = {'s': p['scene'], 'a': p['area'], 'st': p['state']}
        n_s, n_c = len(p['sprites']), len(p['colors'])
        # The whole drawing: a cell per sprite × tint, the rules in order (the last always holds).
        e['w'] = [[p['cells'].get(f'{si},{ci}', -1) for ci in range(n_c)] for si in range(n_s)]
        if n_s > 1:
            e['ws'] = [c for c, _ in p['sprites'][:-1]]
        if n_c > 1:
            e['wc'] = [c for c, _ in p['colors'][:-1]]
        if 'rough' in p['cells']:
            e['r'] = p['cells']['rough']
        if p['hide'] is not False:
            e['hide'] = p['hide']
        if p['off'] is not False:
            e['off'] = p['off']
        if not p['renderer']:
            e['dark'] = 1          # its renderer is off in the scene file: never drawn
        if not p['active']:
            e['asleep'] = 1        # switched off in the scene file: only SetMapped switches it on
        if p['parent']:
            e['parent'] = p['parent']
        if p['ifall']:
            e['ifAll'] = p['ifall']
        if '_Destroyed' in p['scene']:
            e['act3'] = 1
        PIECES.append(e)

    # The areas: their bool and their moves, with the point they scale from (the area's own
    # position on the map, in pixels).
    ZONES = {}
    for area in sorted({p['area'] for p in pieces}):
        z = {'bool': zone_bool.get(area)}
        if area in zone_moves:
            t = next(p['ts'][1] for p in pieces if p['area'] == area)
            ax, ay = t.m_LocalPosition.x, t.m_LocalPosition.y
            z['at'] = [round((ax - minx) * PPU, 2), round((maxy - ay) * PPU, 2)]
            z['moves'] = [[c, round(dx * PPU, 2), round(-dy * PPU, 2), sx, sy] for c, dx, dy, sx, sy in zone_moves[area]]
        ZONES[area] = z

    # The pins in the map's pixels; one of a kind per spot and piece rule (a room's two states can
    # draw it twice). A pin in a piece that can be off is there when its piece is. The caravan's
    # last; one on the spot of another is there whenever either is (the Marrow's is the Act 3
    # bench's spot, which the game always pins; Fleatopia's "Pre" and caravan benches make one).
    rule_of = {p['scene']: json.dumps([p['hide'], p['off']]) for p in pieces}
    either = lambda a, b: None if a is None or b is None or a == ['not', b] or b == ['not', a] else ['any', a, b]
    PINS, here = [], {}
    for q in sorted(pins, key=lambda q: (q['caravan'], q['kind'], q['scene'], q['x'], q['y'])):
        px, py = round((q['x'] - minx) * PPU), round((maxy - q['y']) * PPU)
        same = next((i for i, o in enumerate(PINS) if o[0] == q['kind'] and abs(o[1] - px) < 12 and abs(o[2] - py) < 12
                     and rule_of.get(o[3]) == rule_of.get(q['scene'])), None)
        if same is not None:
            here[same] = either(here[same], q['here'])
            continue
        here[len(PINS)] = q['here']
        PINS.append([q['kind'], px, py, q['scene']] + ([q['lit']] if q['lit'] else []))
    for i, h in here.items():
        if h:
            PINS[i] += ([None] if len(PINS[i]) == 4 else []) + [h]
    # The benches the game doesn't pin: at their RestBench, x / width across their room's drawing
    # and y / height up it (the scene's size, its tk2dTileMap), as tools/gen-spots.js places points.
    seen = json.load(open(PICKUPS))
    for s in UNPINNED:
        r, b, size = boxes.get(s), seen['benches'].get(s.lower()), seen['sizes'].get(s.lower())
        if not (r and r[2] and b and size) or any(o[0] == 'bench' and o[3] == s for o in PINS):
            raise ValueError(f'{s}: no room, RestBench or size to place its bench by, or the game pins it now')
        PINS.append(['bench', round(r[0] + b[0] / size[0] * r[2]), round(r[1] + (1 - b[1] / size[1]) * r[3]), s])
    for s, (host, door, flag) in INSIDE.items():
        r, size = boxes.get(host), seen['sizes'].get(host.lower())
        at = next((e for e in seen['pd'].get(door, []) if e[0] == host.lower() and isinstance(e[3], (int, float))), None)
        if not (r and r[2] and size and at and seen['benches'].get(s.lower())) or any(o[3] == s for o in PINS):
            raise ValueError(f'{s}: no door in {host}, room or RestBench to place its bench by, or the game pins it now')
        PINS.append(['bench', round(r[0] + at[3] / size[0] * r[2]), round(r[1] + (1 - at[4] / size[1]) * r[3]), s, ['flag', flag]])

    out = os.path.join(ROOT, 'assets', 'map')
    os.makedirs(out, exist_ok=True)
    # Lossless: lossy, every drawing's edge pixels were coded against what lay beside it in the
    # sheet (another drawing, the gap), and where two drawings meet on the map one came out lighter
    # and the other darker, a line along the join; its fills were blotched and its colours ran.
    sheet.save(os.path.join(out, 'pieces.webp'), 'WEBP', lossless=True, quality=100, method=6)
    sheet_hd.save(os.path.join(out, 'pieces-hd.webp'), 'WEBP', lossless=True, quality=100, method=6)
    data = {'W': W, 'H': H, 'PPU': PPU, 'ROOMS': dict(sorted(boxes.items())), 'PINS': PINS,
            'PIECES': PIECES, 'CELLS': cells, 'SW': SW, 'SH': SH, 'ZONES': ZONES,
            'VARS': sorted(VARS), 'FREE': {k: FREE[k] for k in sorted(VARS)}}
    src = ("/* js/map.js — Pharloom's map piece by piece, as the game's map screen draws it, and where each\n"
           "   room is on it. GENERATED by tools/extract-map.py from the game's own files (the map\n"
           "   screen's tree and its code; the rules are in its header): not edited by hand.\n"
           "   W, H: the map's size in pixels; PPU: its pixels per world unit.\n"
           "   ROOMS: scene → [x, y, w, h, area] in the map's pixels (the area as the game names its\n"
           "   branch of the map: Bone, Crawl, Dock…); w = h = 0 for a room with no drawing of its own,\n"
           "   a point where the game places it.\n"
           "   PINS: [kind, x, y, scene, lit?, here?]: the game's own pins for the benches, the Bellways and\n"
           "   the Ventrica stations (kind: bench, bellway, ventrica), and what lights one (the station\n"
           "   unlocked, the toll paid) in js/collectibles.js's form; a plain bench has none (null when\n"
           "   here follows). A pin is there when its scene's piece is; a Flea Caravan bench's here is\n"
           "   where the caravan has to be, a rule over CaravanTroupeLocation. The caravan's come after\n"
           "   the rest, then the Songclave's and the Bellhome's benches, which the game doesn't pin.\n"
           "   PIECES: each map piece, in the order the game draws them (the farthest first): s its\n"
           "   scene, a its area, st its first state (0 Hidden, 1 Rough,\n"
           "   2 Full); w its whole drawing, a CELLS index per sprite (ws: the rules of all but the last)\n"
           "   and tint (wc), -1 for none; r its rough sketch; hide (hideCondition), off (switched off),\n"
           "   dark (its renderer off), asleep (switched off until mapped), parent (mappedParent), ifAll\n"
           "   (mappedIfAllMapped), act3 (only once the Cradle has fallen: left out with no save).\n"
           "   The rules: true, or ['flag', f], ['is', f, v], ['has', f, v], ['lt', f, v], ['gt', f, v],\n"
           "   'not', 'all', 'any', over VARS.\n"
           "   CELLS: [x, y, w, h, sx, sy]: a drawing's box on the map and its place in\n"
           "   assets/map/pieces.webp (SW × SH; pieces-hd.webp is twice as big).\n"
           "   ZONES: area → { bool: the playerData bool that shows it (none: never shown), at: the\n"
           "   point it scales from and moves: [rule, dx, dy, scale x, scale y], the first that holds }.\n"
           "   VARS: the playerData fields the rules read; FREE: their values with no save. */\n"
           "(() => {\n  'use strict';\n  const SS = globalThis.SS || (globalThis.SS = {});\n"
           f"  SS.map = {json.dumps(data, separators=(',', ':'))};\n"
           "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.map;\n})();\n")
    open(os.path.join(ROOT, 'js', 'map.js'), 'w').write(src)
    kb = lambda f: os.path.getsize(os.path.join(out, f)) // 1024
    print(f'{len(PINS)} pins ({", ".join(f"{sum(q[0] == k for q in PINS)} {k}" for k in PIN_KIND.values())}), '
          f'{len(PIECES)} pieces ({len(cells)} drawings), {len(boxes)} rooms, {len(ZONES)} areas, map {W} × {H} px; '
          f'assets/map/pieces.webp {SW} × {SH} ({kb("pieces.webp")} KB), pieces-hd.webp ({kb("pieces-hd.webp")} KB); '
          f'rules read {", ".join(sorted(VARS))}; joins closed: {joined[0]} pixels, {joined[1]} close up')

    # A check (not written): every piece as it shows with no save, over the map, to set against
    # the earlier single image (assets/map/rooms.webp, when it's still there).
    if len(sys.argv) > 2:
        flat = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        for e in PIECES:
            if e.get('act3') or e.get('dark') or holds(e.get('hide', False), FREE) or holds(e.get('off', False), FREE):
                continue
            si = next(i for i, c in enumerate(e.get('ws', []) + [True]) if holds(c, FREE))
            ci = next(i for i, c in enumerate(e.get('wc', []) + [True]) if holds(c, FREE))
            c = e['w'][si][ci]
            if c < 0:
                continue
            x, y, w, h, sx, sy = cells[c]
            flat.alpha_composite(sheet.crop((sx, sy, sx + w, sy + h)), (x, y))
        flat.save(sys.argv[2])
        print('free-mode drawing →', sys.argv[2])


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('usage: extract-map.py "<Steam>/steamapps/common/Hollow Knight Silksong" [check.png]')
    main(sys.argv[1])
