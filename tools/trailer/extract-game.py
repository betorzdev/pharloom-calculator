"""tools/trailer/extract-game.py: what the trailer takes from the installed game, into its cache
(never the repo): Hornet's animation clips, as registered frames, and Lace's battle theme.
    python tools/trailer/extract-game.py "<Steam>/steamapps/common/Hollow Knight Silksong" <cache>
Needs UnityPy and Pillow (tools/trailer/make.js runs it with uvx when $PYTHON isn't set).
Team Cherry's art and music, used as the rest of the site uses the game's sprites (a fan project).

Writes, in <cache>:
    hornet/<Clip>/NN.png    each frame at the game's size, as the atlas holds it, upright
    hornet/<Clip>/clip.json its fps, wrap mode, loopStart, and per frame its quad's left and top
                            (texels from her origin, 64 a unit) and size
    clips.js                window.CLIPS: every clip.json, as a script (the stage reads no JSON)
    lace.wav                "H54-220 Lace Battle", Lace's battle theme (sfxstatic_assets_laceboss)
Where Hornet is: tools/extract-hornet.py's header (the "Knight" collection, her library of 535
clips). Found on 15-Oct-2026, patch 1.0.30000. """
import json, os, sys, warnings
import UnityPy
from PIL import Image

warnings.filterwarnings('ignore')
UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
PPU = 64
CLIPS = ['Fall', 'HardLand', 'Challenge Strong', 'Idle', 'Run', 'Run To Idle', 'Sit', 'Sit Idle']
MUSIC = ('sfxstatic_assets_laceboss.bundle', 'H54-220 Lace Battle')


def frame(d, tex):
    W, H = tex.size
    us = [p['x'] for p in d['uvs']]; vs = [p['y'] for p in d['uvs']]
    im = tex.crop((round(min(us) * W), round((1 - max(vs)) * H), round(max(us) * W), round((1 - min(vs)) * H)))
    if d['flipped']:
        im = im.transpose(Image.Transpose.TRANSVERSE)
    xs = [p['x'] for p in d['positions']]; ys = [p['y'] for p in d['positions']]
    return im, min(xs), max(ys)


def hornet(aa, out):
    env = UnityPy.load(os.path.join(aa, 'herocollections_assets_shared.bundle'))
    by_id = {o.path_id: o for o in env.objects}
    coll = cid = None
    for o in env.objects:
        if o.type.name == 'MonoBehaviour':
            t = o.read_typetree()
            if t.get('spriteCollectionName') == 'Knight':
                coll, cid = t, o.path_id
    lib = None
    for o in UnityPy.load(os.path.join(aa, 'herodynamic_assets_all.bundle')).objects:
        if o.type.name != 'MonoBehaviour':
            continue
        try:
            t = o.read_typetree()
        except Exception:
            continue
        clips = {c.get('name'): c for c in t.get('clips') or [] if isinstance(c, dict)}
        run = clips.get('Run')
        if run and all(f['spriteCollection']['m_PathID'] == cid for f in run['frames']):
            lib = clips
    if not coll or not lib:
        raise SystemExit("Hornet's collection or animation library not found")
    texs = [by_id[x['m_PathID']].read().image for x in coll['textures']]
    defs = coll['spriteDefinitions']
    every = {}
    for name in CLIPS:
        c = lib[name]
        d = os.path.join(out, 'hornet', name)
        os.makedirs(d, exist_ok=True)
        meta = []
        for i, f in enumerate(c['frames']):
            if f['spriteCollection']['m_PathID'] != cid:
                meta.append(None)
                continue
            dd = defs[f['spriteId']]
            im, left, top = frame(dd, texs[dd['materialId']])
            im.save(os.path.join(d, f'{i:02d}.png'))
            meta.append({'file': f'{i:02d}.png', 'left': round(left * PPU, 1), 'top': round(top * PPU, 1), 'w': im.width, 'h': im.height})
        every[name] = {'name': name, 'fps': c['fps'], 'wrap': c['wrapMode'], 'loopStart': c.get('loopStart', 0), 'frames': meta}
        print(f'  hornet/{name}  {len(meta)} frames at {c["fps"]:g} fps')
    with open(os.path.join(out, 'clips.js'), 'w') as fh:
        fh.write('window.CLIPS=' + json.dumps(every) + ';\n')


def music(aa, out):
    bundle, name = MUSIC
    for o in UnityPy.load(os.path.join(aa, bundle)).objects:
        if o.type.name == 'AudioClip':
            d = o.read()
            if d.m_Name == name:
                for data in d.samples.values():
                    with open(os.path.join(out, 'lace.wav'), 'wb') as fh:
                        fh.write(data)
                print(f'  lace.wav  {d.m_Length:.1f} s  <- {name}')
                return
    raise SystemExit(f'{name} not found in {bundle}')


if __name__ == '__main__':
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    aa = os.path.join(sys.argv[1], 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    os.makedirs(sys.argv[2], exist_ok=True)
    hornet(aa, sys.argv[2])
    music(aa, sys.argv[2])
