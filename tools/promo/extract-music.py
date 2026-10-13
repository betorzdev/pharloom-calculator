"""tools/promo/extract-music.py: the music for the announcement video (tools/promo/make.js), from the
installed game, into <out>/music/ as WAV. Needs UnityPy (tools/extract-map.py's header says how):
    /tmp/unitypy/bin/python tools/promo/extract-music.py "<Steam>/steamapps/common/Hollow Knight Silksong" [<out>]
<out> defaults to make.js's (the system's temp/pharloom-promo). Christopher Larkin's music, Team
Cherry's: it goes in a fan video, never in the repo or on the site (YouTube's Content ID may claim
the video; the end card credits it).

Where they are (found on 13-Oct-2026, patch 1.0.30000): AudioClips in
StreamingAssets/aa/<platform>/audiocuesstatic_assets_menu.bundle, decoded by UnityPy's FMOD.
    Title          the main menu's theme (75 s), quiet and even: it matches the page, which is that menu
    Final_Credits  the credits (136 s): it builds to a peak about 48 s in (make.js starts it at 3 s) """
import os, sys, tempfile, warnings
import UnityPy

warnings.filterwarnings('ignore')
UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'   # Unity 6 strips it from the bundles (extract-map.py)
TRACKS = {'Title': 'title', 'Final_Credits': 'credits'}

def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    game = sys.argv[1]
    out = os.path.join(sys.argv[2] if len(sys.argv) > 2 else os.path.join(tempfile.gettempdir(), 'pharloom-promo'), 'music')
    data = next(os.path.join(game, d) for d in os.listdir(game) if d.endswith('_Data'))
    aa = os.path.join(data, 'StreamingAssets', 'aa')   # StandaloneLinux64, StandaloneWindows64…
    bundle = next(os.path.join(aa, d, 'audiocuesstatic_assets_menu.bundle') for d in os.listdir(aa)
                  if os.path.isfile(os.path.join(aa, d, 'audiocuesstatic_assets_menu.bundle')))
    os.makedirs(out, exist_ok=True)
    found = set()
    for obj in UnityPy.load(bundle).objects:
        if obj.type.name != 'AudioClip':
            continue
        clip = obj.read()
        if clip.m_Name not in TRACKS:
            continue
        for wav in clip.samples.values():
            with open(os.path.join(out, TRACKS[clip.m_Name] + '.wav'), 'wb') as f:
                f.write(wav)
        found.add(clip.m_Name)
        print(clip.m_Name, '->', os.path.join(out, TRACKS[clip.m_Name] + '.wav'))
    missing = set(TRACKS) - found
    if missing:
        sys.exit('not in the bundle: ' + ', '.join(sorted(missing)))

if __name__ == '__main__':
    main()
