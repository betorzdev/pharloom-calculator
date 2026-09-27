# Silksong's visual language, measured

What the site takes from the game's own pixels: the HUD, the Crest screen and the map's tints.
Written as hallownest-calculator's `design/02-hollow-knight.md` was, and read the same way:
**[MEASURED]** is quantised from a sprite or screenshot on this machine, the rest is a reading of
it. Measured on 27 September 2026 with `tools/measure-palette.py` (`npm run palette`), which
downloads the wiki's files into `kb/data/art/` (not committed: Team Cherry's art) and prints
each one's colours with their share, hue, saturation and value. Re-run it after Sea of Sorrow.

## 1. The short version

1. **The HUD is bone, not colour.** Masks are an ivory with the faintest mauve (`#E7D8E0`, S 6%),
   almost Hollow Knight's (`#EADBE3`). **Silk is pure white** (`Silk.png` = `#FFFFFF`); the full
   spool is a warm bone (`#F0EBED`), the empty one a warm charcoal (`#514B4D`). The only
   saturated piece of the HUD is the **Plasmium mask**, a cyan-blue (`#57B3CE` on `#1D4879`),
   the same role and nearly the same colour as Hollow Knight's lifeblood (`#65C0D9`).
2. **The three Tool colours are one family.** Red `#EB857D`, blue `#76DEF0`, yellow `#F0CC7E`:
   the same saturation (46–51%) and value (92–94%), only the hue moves (4°, 189°, 41°). They're
   pastels on black, not Hornet's red. A locked slot is the same shape in grey (`#606060` with a
   `#DCDCDC` rim); a Skill slot is white.
3. **The game marks the selection with value, not hue.** On the Crest screen the chosen Crest is
   a white outline; the others are filled grey (`#808080`); the frame's filigree is white; the
   background is black (`#010101`) with **a warm spotlight** behind the centre (`#23201D`, H 30°,
   S 17%). There is no selection colour to borrow: the study's warning (don't take Hornet's red)
   stands, and the answer isn't another hue either.
4. **The map is black with one tint per area**, as Hollow Knight's: a dark fill and a lighter
   line of the same hue. But Pharloom's tints are **warmer and darker**: ochres, olives, rust,
   rose and slate, where Hallownest's were pale blues, greens and lilacs at 95–100% value.

## 2. The HUD **[MEASURED]**

| Piece | Sprite | Colours (share) | Reading |
|---|---|---|---|
| Mask | `SS Mask.png` | `#E7D8E0` 27%, `#C3B7C2` 27%, `#363335` 5%, black outline | Ivory, H 305–330°, S 6% |
| Plasmium mask | `SS Mask Lifeblood.png` | `#57B3CE` 30%, `#1D4879` 25%, `#3B9BC3` 24% | The HUD's one saturated colour |
| Silk | `Silk.png` | `#FFFFFF` 100% | White, 0% saturation: **measured, not assumed** |
| Spool, full | `Silk Spool HUD Complete Filled.png` | `#D1C9CB`, `#F0EBED`, `#DCD6D8`, `#8C8688` | Warm bone, H 336–345°, S 2–4% |
| Spool, empty | `Silk Spool HUD Complete.png` | `#030303`, `#514B4D`, `#312D2F`, `#BAB0B1` | Charcoal well with a bone rim |
| Crest wheel | `Hunter Crest HUD Filled.png` | `#DAD1D3`, `#979093`, `#3D393B` | The frame: bone on charcoal |
| Rosaries | `Rosaries.png` | `#A16161`, `#D1928D` on `#1C152C` / `#312134` | Dusky rose beads on plum: **no gold** |
| Shell shards | `Shell Shards.png` | `#F3F3F3` → `#171717` | Pure greyscale |

The rosaries aren't gold, as Hollow Knight's geo wasn't: a figure for them stays in bone, like
every other figure on the page.

## 3. The Crest screen **[MEASURED]**

| Piece | Sprite | Colour | HSV |
|---|---|---|---|
| Red slot | `Red Tools Icon.png` | `#EB857D` | H 4 S 47 V 92 |
| Blue slot | `Blue Tools Icon.png` | `#76DEF0` | H 189 S 51 V 94 |
| Yellow slot | `Yellow Tools Icon.png` | `#F0CC7E` | H 41 S 48 V 94 |
| Skill slot | `Silk Skills Icon.png` | `#FFFFFF` | white |
| Locked slot | `Red Tools Icon Locked.png` | `#606060`, rim `#DCDCDC` | grey |
| Crest (inventory) | `Hunter Crest Inventory.png` | `#FFFFFF`, `#838383` | white and mid grey |
| Vesticrest | `Vesticrest.png` | white with a blue (`#7CE4F9`) and a yellow (`#EECB7F`) slot | |
| The screen | `SS Crests Menu.png` (1920×1080) | background `#010101`; spotlight `#23201D`; idle Crests `#808080`; selected Crest and filigree `#FFFFFF`; text `#FDFDFC` / cream `#F1EBDC` | |

The slot colours are data (a Tool's colour says where it goes), so they're tokens of their own
and not the accent. The blue slot and the Plasmium mask are close hues (189° and 194°) but not
the same thing; the site shouldn't use one for the other.

## 4. The map: one tint per area **[MEASURED]**

`Silksong Small Map Clean.png` (4096×3043, the wiki's assembly of the in-game map) is black with
every area traced in its own hue; `Silksong Small Map Ruin Clean.png` is the Act 3 version and
barely moves (the same clusters within a few points). Per area, on its own `<Area> Map Clean.png`:
the **fill** is the commonest drawn colour and the **line** the brightest cluster with at least
3% of the drawn pixels, once the area's title (written in white on each map) is left out.

| Area | Fill | Line | Line HSV |
|---|---|---|---|
| Bellhart | `#634E34` | `#FCE5B9` | H 39 S 27 V 99 |
| Bilewater | `#3D3A16` | `#E9E7CA` | H 56 S 13 V 91 |
| Blasted Steps | `#3B2F1F` | `#B9A075` | H 38 S 37 V 73 |
| Bone Bottom | `#2D4125` | `#94BF81` | H 102 S 32 V 75 |
| Choral Chambers | `#554E30` | `#F0E5AB` | H 50 S 29 V 94 |
| Cogwork Core | `#3B3E2F` | `#AAAE90` | H 68 S 17 V 68 |
| Deep Docks | `#4D3213` | `#DAA254` | H 35 S 61 V 85 |
| Far Fields | `#262A11` | `#87924E` | H 70 S 47 V 57 |
| Grand Gate | `#4B453A` | `#D7CCB5` | H 41 S 16 V 84 |
| Greymoor | `#172729` | `#6E8F93` | H 186 S 25 V 58 |
| High Halls | `#47301C` | `#CA9D6E` | H 31 S 46 V 79 |
| Hunter's March | `#472119` | `#C47461` | H 12 S 51 V 77 |
| Memorium | `#4E493F` | `#E4DACA` | H 37 S 11 V 89 |
| Moss Grotto | `#2D4125` | `#A9CB99` | H 101 S 25 V 80 |
| Mosslands | `#2B4124` | `#92BD7F` | H 102 S 33 V 74 |
| Mount Fay | `#111B2A` | `#BAC4D2` | H 215 S 11 V 82 |
| Putrified Ducts | `#1D2D35` | `#729BAD` | H 198 S 34 V 68 |
| Sands of Karak | `#583038` | `#F1A1B4` | H 346 S 33 V 95 |
| Shellwood | `#3A3D2D` | `#B6BD9B` | H 72 S 18 V 74 |
| Sinner's Road | `#30251D` | `#B08772` | H 20 S 35 V 69 |
| The Abyss | `#202020` | `#BDBDBD` | neutral |
| The Cradle | `#242537` | `#8183AE` | H 237 S 26 V 68 |
| The Marrow | `#4A4A4A` | `#D8D8D8` | neutral |
| The Mist | `#494949` | `#9D9D9D` | neutral |
| The Slab | `#3A3E43` | `#B0B8C2` | H 213 S 9 V 76 |
| Underworks | `#242527` | `#7D8087` | H 222 S 7 V 53 |
| Verdania | `#163420` | `#5FA879` | H 141 S 43 V 66 |
| Weavenest Atla | `#242638` | `#9DA0BC` | H 234 S 16 V 74 |
| Whispering Vaults | `#5D411D` | `#E9B96F` | H 36 S 52 V 91 |
| Whiteward | `#474747` | `#CFCFCF` | neutral |
| Wisp Thicket | `#132F1B` | `#F0E6D2`? | the line's hue (40°) doesn't match the fill's (137°): probably a map icon, to check by eye |
| Wormways | `#2B251C` | `#988873` | H 34 S 24 V 60 |

The Red Memory has no map of its own on the wiki (404). The wiki's area list has 35 pages;
the Citadel is a hub over five of them and isn't measured apart.

**What this means for the site.** Hollow Knight's tints were pale (S 12–23%, V 95–100%, above
12:1 on black). Pharloom's lines are darker (V 53–99) and more saturated (up to 61%), but black
carries them: **every line passes AA on the page's black** (`#010101`: 5.3:1 for Underworks, the
lowest; 16.9:1 for Bellhart). On the warm spotlight (`#23201D`) six drop under 4.5:1 (Underworks
4.1, The Cradle 4.5, Greymoor and Hunter's March 4.6, Wormways 4.7, Far Fields 4.8 are at the
edge): those are fine as a rule or a fill, not as small text on a raised surface. The fills are
the area's ambience: they belong to the enemy's stage in the arena (the `--area-<id>-*` ramp
tokens.css reserves), not to text.

## 5. What goes into `css/tokens.css`

Done with this document (the values are one-to-one with a sprite):

- `--mask`, `--mask-line`, `--mask-empty`, `--silk`, `--silk-well`, `--silk-rim`, `--plasmium`,
  `--plasmium-line`, `--hud-frame`: §2.
- New: `--slot-red`, `--slot-blue`, `--slot-yellow`, `--slot-skill`, `--slot-locked`: §3.

**Left to decide** (they're design, not measurement, and they move the whole page):

1. **The surfaces.** Hollow Knight's blue-black (`#06080d`, `#16203a`…) is wrong for Pharloom:
   the game's screens are a neutral black with a warm spotlight (`#010101` → `#23201D`). The
   proposal: the same depth ramp as now, with the hue taken from 220° to about 30° and the
   saturation kept under 20%, so the page reads as the Crest screen does. Every ink step has to
   be re-checked for AA on the new surfaces (`design/01-web.md`).
2. **The accent.** The game has no selection hue (§1.3): it selects with white on grey. Two ways
   to honour that: a **warm bone accent** (the cream `#F1EBDC` of the screen's text, with the
   glow as the "on" state), or keep a hue and admit it's the site's, not the game's. The first
   is the game's; its risk is that bone is also the figures' ink, so "interactive" has to be
   told by the shape (the four kinds of button) and the glow, not by the colour alone.
3. **The section tints** (`--tint-sheet`, `-combat`, `-journal`, `-progress`): from §4's
   lines, the ones that stay above 7:1 on the spotlight too. A reading, not a measurement: Bellhart's `#FCE5B9` or Choral Chambers' `#F0E5AB`
   for the Crest screen, Sands of Karak's `#F1A1B4` for combat (8.1:1; Hunter's March's salmon is
   the closer idea but drops to 4.6:1), Mount Fay's
   `#BAC4D2` for the Journal, Moss Grotto's `#A9CB99` for Progress and the map.

## Sources

The wiki's files, through `Special:FilePath` (hollowknight.wiki, 27 September 2026): the HUD
sprites (`SS Mask.png`, `SS Mask Lifeblood.png`, `Silk.png`, `Silk Spool HUD Complete.png`,
`Silk Spool HUD Complete Filled.png`, `Hunter Crest HUD Filled.png`, `Rosaries.png`,
`Shell Shards.png`), the Crest screen's pieces (`Red/Blue/Yellow Tools Icon.png`,
`Red Tools Icon Locked.png`, `Silk Skills Icon.png`, `Hunter Crest Inventory.png`,
`Vesticrest.png`) and screenshot (`SS Crests Menu.png`), the world map
(`Silksong Small Map Clean.png`, `Silksong Small Map Ruin Clean.png`) and each area's
`<Area> Map Clean.png`. © Team Cherry; measured, not redistributed.
