"""tools/extract-shops.py: what each shop sells and for how much, and what each wish gives, from
the game's own files. Needs the game installed and UnityPy, as tools/extract-map.py:
    /tmp/unitypy/bin/python tools/extract-shops.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--cache=<file>]

How the game does it (read on 28-Sep-2026, patch 1.0.30000):
  · dataassets/shopitems.bundle holds every ShopItem (its price in `cost`, or in a CostReference of
    costs.bundle when `costReference` is set, which wins: Frey's Multibinder says 120 and costs
    880; `requiredItem` × `requiredItemAmount` a Craftmetal; `extraAppearConditions` the
    playerData tests for it to show, blackThreadWorld being Act 3; `questsAppearConditions` a
    wish that must be done; `playerDataBoolName` the flag the purchase sets; `savedItem` what it
    gives: a Tool, a collectable, or a PlayerDataCollectable for the Tool Pouch and the Crafting
    Kit), and the ShopItemLists that group them into a stock (shopitems/mapperstock.asset.bundle
    has Shakra's).
  · A vendor is a ShopOwner in a scene: its stockList, or its own stock (the Mottled Skarr's).
    Only what a ShopOwner sells is sold: three ShopItems are in no stock (Grindle's Reserve Bind,
    Bellhart's Tool Pouch, the Forge's Tacks) and are left out, reported.
  · questsystem/quests.bundle: each Quest's rewardItem × rewardCount (rewardCountAct3 in Act 3), when
    the reward is given by the quest itself. The rest are given by an NPC's FSM, not read here
    (tools/gen-how.js joins them from the wiki and the completionist).
  · costs.bundle: Plinney's two paid Needle upgrades ("Nail Upgrade Further Cost", "Final").
It joins every Tool to the site's id (js/collectibles.js TOOLS, by the save's name) and every piece
of the 100% to its js/collectibles.js PIECES entry (by the flag the purchase sets, or by the wish
that gives it), and stops with an error when one doesn't join.
--cache=<file> keeps the scenes' shop owners, read once (the scan takes minutes). """
import json, os, pickle, struct, subprocess, sys
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
OUT = os.path.join(ROOT, 'js', 'shop.js')
# The vendors, by the stock a ShopOwner sells (or its GameObject, when it carries its own): the
# site's id for them. tools/gen-how.js gives them the game's names.
VENDOR = {
    'Grindle Stock': 'grindle', 'Bonebottom Peddler Stock': 'pebb', 'Bellhart Stock': 'frey',
    'Pilgrims Rest Stock': 'mort', 'Architect Stock': 'twelfth-architect', 'City Merchant Stock': 'jubilana',
    'Forgedaughter Stock': 'forge-daughter', 'Mapper Stock': 'shakra', 'Ant Merchant': 'mottled-skarr',
}
# What a bought or rewarded item is, when it isn't a Tool: the piece kinds of js/collectibles.js.
PIECE_ITEM = {'Heart Piece': 'mask-shard', 'Silk Spool': 'spool-fragment', 'Tool Pouch Pickup': 'tool-pouch',
              'Tool Kit Pickup': 'crafting-kit', 'Crest Socket Unlocker': 'memory-locket', 'Tool Metal': 'craftmetal',
              'Pale_Oil': 'pale-oil'}
CRAFTMETAL = 'Tool Metal'


def game_files(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    bundles = {f: os.path.join(dp, f) for dp, dn, fn in os.walk(aa) for f in fn if f.endswith('.bundle')}
    mono = next(p for f, p in bundles.items() if f.endswith('_monoscripts.bundle'))
    cls = {o.path_id: o.read().m_ClassName for o in UnityPy.load(mono).objects if o.type.name == 'MonoScript'}
    return aa, bundles, cls


script = lambda raw: struct.unpack_from('<q', raw, 20)[0] if len(raw) >= 28 else None
ext_name = lambda e: e.path.split('/')[-1].lower()


def index(bundles, cls):
    """Every MonoBehaviour of the data assets: (its file, path id) → (class, fields, the file's
    externals, the file), so that a pointer from any of them can be followed."""
    idx = {}
    for b, p in bundles.items():
        if 'dataassets' not in p:
            continue
        for o in UnityPy.load(p).objects:
            if o.type.name != 'MonoBehaviour':
                continue
            try:
                d = o.read_typetree()
            except Exception:
                continue
            f = o.assets_file
            idx[(f.name.lower(), o.path_id)] = (cls.get(script(o.get_raw_data())), d, [ext_name(e) for e in f.externals], f.name.lower())
    return idx


def follow(idx, ptr, src):
    """A pointer (m_FileID, m_PathID) read in src (an index entry, or (externals, file)) → its entry."""
    if not ptr or not ptr.get('m_PathID'):
        return None
    ext, own = (src[2], src[3]) if len(src) == 4 else src
    f = own if ptr['m_FileID'] == 0 else ext[ptr['m_FileID'] - 1]
    return idx.get((f, ptr['m_PathID']))


def owners(aa, cls):
    """Every ShopOwner in the scenes: (scene, GameObject, the scene file's externals and name, its
    stockList pointer, its own stock pointers)."""
    want = {k for k, v in cls.items() if v == 'ShopOwner'}
    scenes = os.path.join(aa, 'scenes_scenes_scenes')
    out = []
    for f in sorted(os.listdir(scenes)):
        if not f.endswith('.bundle'):
            continue
        for o in UnityPy.load(os.path.join(scenes, f)).objects:
            if o.type.name != 'MonoBehaviour' or script(o.get_raw_data()) not in want:
                continue
            d = o.read_typetree()
            try:
                go = o.read().m_GameObject.read().m_Name
            except Exception:
                go = None
            out.append((f[:-7], go, ([ext_name(e) for e in o.assets_file.externals], o.assets_file.name.lower()),
                        d.get('stockList'), d.get('stock') or []))
    return out


def site():
    """js/collectibles.js's TOOLS (save name → site id) and PIECES ([kind, act, check] by index)."""
    out = subprocess.run(['node', '-e', "const C=require('./js/collectibles.js');"
                          "console.log(JSON.stringify({tools:C.TOOLS,pieces:C.PIECES.map((p)=>p.slice(0,3))}))"],
                         cwd=ROOT, capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    tools = {n: tid for tid, names in d['tools'].items() for n in names}
    return tools, d['pieces']


def fail(msg):
    sys.exit('extract-shops: ' + msg)


def main(game, cache):
    aa, bundles, cls = game_files(game)
    idx = index(bundles, cls)
    if cache and os.path.exists(cache):
        shops = pickle.load(open(cache, 'rb'))
    else:
        shops = owners(aa, cls)
        if cache:
            pickle.dump(shops, open(cache, 'wb'))
    tools, pieces = site()
    of = lambda kind, check: [i for i, p in enumerate(pieces) if p[0] == kind and p[2] == check]

    def gives(entry, flag=None, quest=None):
        """What a ShopItem's savedItem, or a Quest's rewardItem, is on the site: { tool } or
        { piece } (an index of PIECES), or { thing } with the game's name for the rest."""
        if entry is None:
            return None
        cl, d = entry[0], entry[1]
        name = d['m_Name']
        if name in tools:
            return {'tool': tools[name]}
        if cl.startswith('ToolItem'):
            fail(f'the Tool {name} has no site id (js/collectibles.js TOOLS)')
        kind = PIECE_ITEM.get(name)
        if kind:
            at = of(kind, ['flag', flag]) if flag else of(kind, ['quest', quest]) if quest else []
            if len(at) == 1:
                return {'piece': at[0]}
            if kind in ('mask-shard', 'spool-fragment', 'tool-pouch', 'crafting-kit'):
                fail(f'{name} ({flag or quest}) joins {len(at)} pieces of js/collectibles.js PIECES')
        return {'thing': name}

    # The stocks the vendors sell, by their ShopItem path.
    sold = {}   # (file, path id) of a ShopItem → vendor id
    where = {}  # vendor id → scenes
    for scene, go, src, stock_list, stock in shops:
        lst = follow(idx, stock_list, src)
        if lst:
            vendor = VENDOR.get(lst[1]['m_Name']) or fail(f'a stock with no vendor: {lst[1]["m_Name"]} ({scene})')
            items = [(lst, p) for p in lst[1]['shopItems']]
        elif stock:
            vendor = VENDOR.get(go) or fail(f'a shop with its own stock and no vendor: {go} ({scene})')
            items = [(src, p) for p in stock]
        else:
            continue
        where.setdefault(vendor, set()).add(scene)
        for s, p in items:
            e = follow(idx, p, s) or fail(f'{vendor}: a ShopItem that is not in the data assets')
            sold[id(e)] = vendor
    if set(where) != set(VENDOR.values()):
        fail(f'vendors with no ShopOwner: {sorted(set(VENDOR.values()) - set(where))}')

    costs = {v[1]['m_Name']: v[1]['value'] for v in idx.values() if v[0] == 'CostReference'}
    shop, unsold = [], []
    for e in idx.values():
        if e[0] != 'ShopItem':
            continue
        d = e[1]
        if id(e) not in sold:
            unsold.append(d['m_Name'])
            continue
        cost = follow(idx, d['costReference'], e)
        req = follow(idx, d['requiredItem'], e)
        if req and req[1]['m_Name'] != CRAFTMETAL:
            fail(f'{d["m_Name"]} needs {req[1]["m_Name"]}, not Craftmetal')
        if d['currencyType'] != 0:
            fail(f'{d["m_Name"]} is paid in currency {d["currencyType"]}, not rosaries')
        tests = [t for g in d['extraAppearConditions']['TestGroups'] for t in g['Tests']]
        after = []
        for q in d['questsAppearConditions']:
            qe = follow(idx, q['Quest'], e)
            if not (q['CheckCompleted'] and q['IsCompleted']) and not (q['CheckWasEverCompleted'] and q['WasEverCompleted']):
                fail(f'{d["m_Name"]}: a wish condition that is not "done"')
            after.append(qe[1]['m_Name'])
        x = {'item': d['m_Name'], 'vendor': sold[id(e)]}
        g = gives(follow(idx, d['savedItem'], e), flag=d['playerDataBoolName'] or None)
        if g is None:  # a map, a pin, a furnishing: the flag it sets is what it is
            g = {'thing': d['playerDataBoolName'] or d['playerDataIntName']}
        x.update(g)
        x['name'] = d['displayName']['Key']
        x['price'] = cost[1]['value'] if cost else d['cost']
        if req:
            x['craftmetal'] = d['requiredItemAmount']
        if any(t['FieldName'] == 'blackThreadWorld' and t['BoolValue'] for t in tests):
            x['act'] = 3
        rest = [t['FieldName'] for t in tests if t['FieldName'] != 'blackThreadWorld' and t['Type'] == 0 and t['BoolValue']]
        if rest:
            x['needs'] = rest
        if after:
            x['after'] = after
        if d['playerDataBoolName']:
            x['flag'] = d['playerDataBoolName']
        shop.append(x)
    shop.sort(key=lambda x: (x['vendor'], x['item']))

    rewards = {}
    for e in idx.values():
        if e[0] != 'Quest':
            continue
        d = e[1]
        g = gives(follow(idx, d['rewardItem'], e), quest=d['m_Name'])
        if g is None:
            continue
        if d['rewardCount'] != 1:
            g['count'] = d['rewardCount']
        if d['rewardCountAct3']:
            g['countAct3'] = d['rewardCountAct3']
        rewards[d['m_Name']] = g
    needle = {'further': costs['Nail Upgrade Further Cost'], 'final': costs['Nail Upgrade Final Cost']}
    write(where, shop, dict(sorted(rewards.items())), needle, sorted(unsold))


def write(where, shop, rewards, needle, unsold):
    line = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    body = lambda xs: ',\n'.join('    ' + line(x) for x in xs)
    rw = ',\n'.join(f'    {json.dumps(k)}: {line(v)}' for k, v in rewards.items())
    vendors = ',\n'.join(f'    {json.dumps(k)}: {line(sorted(v))}' for k, v in sorted(where.items()))
    open(OUT, 'w').write(
        "/* js/shop.js: what each vendor sells and for how much, and what each wish gives, from the\n"
        "   game's own files (patch 1.0.30000). GENERATED by tools/extract-shops.py: not edited by hand.\n"
        "     VENDORS  vendor id → the scenes it sells in (its names: js/how.js NPCS)\n"
        "     SHOP     every item a vendor sells: item (the game's ShopItem), vendor, what it gives (tool:\n"
        "              a site Tool id; piece: an index of js/collectibles.js PIECES; thing: anything\n"
        "              else, by the game's name), name (its text key), price (rosaries), craftmetal (how\n"
        "              many it also takes), act 3 (only then), needs (playerData flags for it to show),\n"
        "              after (wishes, by save name, to be done first), flag (what buying it sets)\n"
        "     REWARDS  wish (save name) → what completing it gives, when the wish itself gives it\n"
        "              (the same shapes, and count); the rewards an NPC hands over aren't here\n"
        "     NEEDLE   Plinney's two paid upgrades, in rosaries (costs.bundle)\n"
        "     UNSOLD   ShopItems in no vendor's stock: in the files, not in the game */\n"
        "(() => {\n  'use strict';\n  const SS = globalThis.SS || (globalThis.SS = {});\n\n"
        f"  const VENDORS = {{\n{vendors},\n  }};\n\n"
        f"  const SHOP = [\n{body(shop)},\n  ];\n\n"
        f"  const REWARDS = {{\n{rw},\n  }};\n\n"
        f"  const NEEDLE = {line(needle)};\n\n"
        f"  const UNSOLD = {line(unsold)};\n\n"
        "  SS.shop = { VENDORS, SHOP, REWARDS, NEEDLE, UNSOLD };\n"
        "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.shop;\n})();\n")
    print(f'{len(shop)} items from {len(where)} vendors, {len(rewards)} wish rewards, {len(unsold)} unsold → js/shop.js')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        sys.exit('usage: extract-shops.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--cache=<file>]')
    opt = lambda k: next((a.split('=', 1)[1] for a in sys.argv if a.startswith(k + '=')), None)
    main(args[0], opt('--cache'))
