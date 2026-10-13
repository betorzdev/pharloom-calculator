"""tools/promo/extract-game.py: what the trailer (tools/promo/make.js) takes from the installed game,
into its work folder, never the repo: its music and Hornet's animations. Needs UnityPy and Pillow
(tools/extract-map.py's header says how):
    /tmp/unitypy/bin/python tools/promo/extract-game.py "<Steam>/steamapps/common/Hollow Knight Silksong" [<out>]
<out> defaults to make.js's (the system's temp/pharloom-promo). Team Cherry's art and Christopher
Larkin's music: they go in a fan video, not on the site (YouTube's Content ID may claim the
video; the end card credits both).

Found on 14-Oct-2026, patch 1.0.30000:
  · music/judge.wav: "H118 Final Judge v2-105", an AudioClip in StreamingAssets/aa/<platform>/
    audiocuesstatic_assets_areacoral.bundle (decoded by UnityPy's FMOD). 104.73 s, a loop of 32
    bars at 73⅓ bpm: a beat every 9/11 s from its first sample (compose.html cuts on that grid).
    Every music-length clip in the game, with its bundle, is listed by --list.
  · hornet/*.png and hornet/hornet.json: whole clips of hers from her animation library (the
    one in herodynamic_assets_all.bundle with the most clips: 502, the hero's), at the game's
    size, every clip in cells of one size around one origin, so they chain without a jump. Read
    as tools/extract-hornet.py reads them (its frame()). hornet.json: the cell, the origin in it,
    and each clip's file, frames, fps, loop start and floor (the cell's y of her lowest pixel). """
import importlib.util, json, os, sys, tempfile, warnings
import UnityPy
from PIL import Image

warnings.filterwarnings('ignore')
UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'   # Unity 6 strips it from the bundles (extract-map.py)
MUSIC = {'judge': ('audiocuesstatic_assets_areacoral.bundle', 'H118 Final Judge v2-105')}
CLIPS = ['Fall', 'HardLand', 'Challenge Strong']
HERE = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True   # no __pycache__ left in tools/ by the import below
spec = importlib.util.spec_from_file_location('extract_hornet', os.path.join(HERE, '..', 'extract-hornet.py'))
EH = importlib.util.module_from_spec(spec); spec.loader.exec_module(EH)


def bundles(game):
    data = next(os.path.join(game, d) for d in os.listdir(game) if d.endswith('_Data'))
    aa = os.path.join(data, 'StreamingAssets', 'aa')   # StandaloneLinux64, StandaloneWindows64…
    return next(os.path.join(aa, d) for d in os.listdir(aa) if os.path.isdir(os.path.join(aa, d)))


def music(where, out):
    os.makedirs(out, exist_ok=True)
    for name, (bundle, clip) in MUSIC.items():
        for obj in UnityPy.load(os.path.join(where, bundle)).objects:
            if obj.type.name == 'AudioClip' and obj.read().m_Name == clip:
                for wav in obj.read().samples.values():
                    with open(os.path.join(out, name + '.wav'), 'wb') as f:
                        f.write(wav)
                print(f'  music/{name}.wav  ← {clip}')
                break
        else:
            sys.exit(f'{clip} is not in {bundle}')


def hornet(where, out):
    env = UnityPy.load(os.path.join(where, 'herocollections_assets_shared.bundle'))
    by_id = {o.path_id: o for o in env.objects}
    coll = None
    for o in env.objects:
        if o.type.name == 'MonoBehaviour':
            t = o.read_typetree()
            if t.get('spriteCollectionName') == 'Knight':
                coll, coll_id = t, o.path_id
    if not coll:
        sys.exit('No "Knight" sprite collection')
    textures = [by_id[x['m_PathID']].read().image for x in coll['textures']]
    lib = {}
    for o in UnityPy.load(os.path.join(where, 'herodynamic_assets_all.bundle')).objects:
        if o.type.name != 'MonoBehaviour':
            continue
        try:
            t = o.read_typetree()
        except Exception:
            continue
        clips = {c.get('name'): c for c in t.get('clips') or [] if isinstance(c, dict)}
        if 'Run' in clips and len(clips) > len(lib):
            lib = clips
    got = {}
    for name in CLIPS:
        clip = lib[name]
        if any(f['spriteCollection']['m_PathID'] != coll_id for f in clip['frames']):
            sys.exit(f'{name}: a frame from another collection')
        got[name] = (clip, [EH.frame(coll['spriteDefinitions'][f['spriteId']], textures) for f in clip['frames']])
    PPU = EH.PPU
    every = [fr for _, frames in got.values() for fr in frames]
    left = min(l * PPU for _, l, _ in every); right = max(l * PPU + im.width for im, l, _ in every)
    top = max(tp * PPU for _, _, tp in every); bottom = min(tp * PPU - im.height for im, _, tp in every)
    pad = 4
    cw, ch = round(right - left) + 2 * pad, round(top - bottom) + 2 * pad
    ox, oy = pad - round(left), pad + round(top)
    meta = {'cell': [cw, ch], 'origin': [ox, oy], 'clips': {}}
    os.makedirs(out, exist_ok=True)
    for name, (clip, frames) in got.items():
        strip = Image.new('RGBA', (cw * len(frames), ch), (0, 0, 0, 0))
        for i, (im, l, tp) in enumerate(frames):
            strip.alpha_composite(im.convert('RGBA'), (i * cw + ox + round(l * PPU), oy - round(tp * PPU)))
        file = name.lower().replace(' ', '-') + '.png'
        strip.save(os.path.join(out, file), optimize=True)
        floor = max(oy - round(tp * PPU) + im.height for im, _, tp in frames)
        meta['clips'][name] = {'file': file, 'n': len(frames), 'fps': clip['fps'], 'loopStart': clip['loopStart'], 'floor': floor}
        print(f'  hornet/{file}  {len(frames)} frames at {clip["fps"]:g} fps  ← {name}')
    with open(os.path.join(out, 'hornet.json'), 'w') as f:
        json.dump(meta, f, indent=1)


def listing(where):
    for path in sorted(p for p in os.listdir(where) if p.startswith('audiocues')):
        try:
            objs = UnityPy.load(os.path.join(where, path)).objects
        except Exception:
            continue
        for obj in objs:
            if obj.type.name == 'AudioClip':
                clip = obj.read()
                if clip.m_Length >= 40:
                    print(f'{clip.m_Length:6.1f} s  {clip.m_Name}  [{path}]', flush=True)


def main():
    args = [a for a in sys.argv[1:] if a != '--list']
    if not args:
        sys.exit(__doc__)
    where = bundles(args[0])
    if '--list' in sys.argv:
        listing(where)
        return
    out = args[1] if len(args) > 1 else os.path.join(tempfile.gettempdir(), 'pharloom-promo')
    music(where, os.path.join(out, 'music'))
    hornet(where, os.path.join(out, 'hornet'))


if __name__ == '__main__':
    main()
