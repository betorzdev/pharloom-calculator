import type { TrackableCategory } from "../types";

export const relics: TrackableCategory = {
  name: "Relics",
  description: "Ancient artifacts scattered across Pharloom.",
  sections: [
    {
      name: "Bone Scrolls",
      description:
        "Journals written by pilgrims, and other lower-class bugs of Pharloom. They can be sold to Relic Seeker Scrounge for 90 Rosaries.",
      items: [
        {
          name: "Bone Scroll · Greymoor",
          whichAct: 1,
          completionDetails:
            "Greymoor: Held by a corpse found after swimming all the way to the right in a secret room.",
          parsingInfo: { type: "relic", internalId: "Bone Record Greymoor_flooded_corridor" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478142",
        },
        {
          name: "Bone Scroll · Far Fields",
          whichAct: 1,
          prereqs: ["Drifter's Cloak"],
          completionDetails: "Far Fields: Found in a secret room, reachable with Drifter's Cloak.",
          parsingInfo: { type: "relic", internalId: "Bone Record Bone_East_14" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478213",
        },
        {
          name: "Bone Scroll · Underworks",
          whichAct: 2,
          completionDetails: "Underworks (Left): Behind a breakable wall.",
          parsingInfo: { type: "relic", internalId: "Bone Record Understore_Map_Room" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478553",
        },
        {
          name: "Bone Scroll · Wisp Thicket",
          whichAct: 2,
          completionDetails: "Wisp Thicket (Top): Platforming challenge.",
          parsingInfo: { type: "relic", internalId: "Bone Record Wisp Top" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479150",
        },
      ],
    },
    {
      name: "Weaver Effigies",
      description:
        "Effigies carved from bone that depict various Weaver figures, with prayers dedicated to the specific Weaver etched onto the body of the figure. They can be sold to Relic Seeker Scrounge for 150 Rosaries.",
      items: [
        {
          name: "Weaver Effigy · Bone Bottom",
          whichAct: 1,
          completionDetails:
            "Bone Bottom: In a secret room above Bone Bottom, easiest to reach with Drifter's Cloak and floating down from above.",
          parsingInfo: { type: "relic", internalId: "Weaver Totem Bonetown_upper_room" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478093",
        },
        {
          name: "Weaver Effigy · Shellwood",
          whichAct: 2,
          prereqs: ["Cling Grip"],
          completionDetails: "Shellwood: At the very top-right area inside the Chapel of the Witch.",
          parsingInfo: { type: "relic", internalId: "Weaver Totem Witch" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478794",
        },
        {
          name: "Weaver Effigy · The Slab",
          whichAct: 1,
          completionDetails: "The Slab (Bottom-right): Held by a corpse.",
          parsingInfo: { type: "relic", internalId: "Weaver Totem Slab_Bottom" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479034",
        },
      ],
    },
    {
      name: "Choral Commandments",
      description:
        "They carry orders and decrees from The Citadel. They can be sold to Relic Seeker Scrounge for 180 Rosaries.",
      items: [
        {
          name: "Choral Commandment · Bone Bottom",
          whichAct: 1,
          completionDetails: "Bone Bottom: On a high-up ledge, left from Mosshome.",
          parsingInfo: { type: "relic", internalId: "Seal Chit Aspid_01" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=477867",
        },
        {
          name: "Choral Commandment · Whiteward",
          whichAct: 2,
          completionDetails: "Whiteward: Top-left room.",
          parsingInfo: { type: "relic", internalId: "Seal Chit Ward Corpse" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478914",
        },
        {
          name: "Choral Commandment · Whiteward (#2)",
          whichAct: 3,
          completionDetails:
            "Whiteward: At the end of a room above the hidden passage, easiest to reach via Silk Soar.",
          parsingInfo: { type: "relic", internalId: "Seal Chit Silk Siphon" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478919",
        },
        {
          name: "Choral Commandment · Songclave",
          whichAct: 2,
          completionDetails: 'Songclave: Sold by Jubilana for 210 Rosaries, after completing "The Lost Merchant" wish.',
          parsingInfo: { type: "relic", internalId: "Seal Chit City Merchant" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479251",
        },
      ],
    },
    {
      name: "Rune Harps",
      description:
        "Old recording instruments, strung with silk runes inscribed by the Weavers. They can be sold to Relic Seeker Scrounge for 210 Rosaries.",
      items: [
        {
          name: "Rune Harp · Weavernest Atla",
          whichAct: 1,
          completionDetails: "Weavernest Atla: Found on a high-up ledge.",
          parsingInfo: { type: "relic", internalId: "Weaver Record Weave_08" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478231",
        },
        {
          name: "Rune Harp · Far Fields",
          whichAct: 1,
          completionDetails:
            "Far Fields (Weavernest): Use Silkspeed Anklets with Flea Brew, and run over all the pressure plates.",
          parsingInfo: { type: "relic", internalId: "Weaver Record Sprint_Challenge" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479057",
        },
        {
          name: "Rune Harp · High Halls",
          whichAct: 3,
          completionDetails: "High Halls: Pick it up from Conductor Ballador's room, in ACT 3.",
          parsingInfo: { type: "relic", internalId: "Weaver Record Conductor" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479495",
        },
      ],
    },
    {
      name: "Psalm Cylinders",
      description:
        "Cylinders inscribed with recordings, which may be heard by bringing them to Vaultkeeper Cardinius. They can be sold to Vaultkeeper Cardinius for 200 Rosaries, or 320 Rosaries for the Sacred Cylinder",
      items: [
        {
          name: "Psalm Cylinder · Blasted Steps",
          whichAct: 2,
          completionDetails: "Blasted Steps: Sold by Grindle for 240 Rosaries.",
          parsingInfo: { type: "relic", internalId: "Psalm Cylinder Grindle" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478530",
        },
        {
          name: "Psalm Cylinder · Whispering Vaults",
          whichAct: 2,
          completionDetails: "Whispering Vaults: Vaultkeeper Cardinius' Lair.",
          parsingInfo: { type: "relic", internalId: "Psalm Cylinder Librarian" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478650",
        },
        {
          name: "Psalm Cylinder · Whispering Vaults (#2)",
          whichAct: 2,
          prereqs: ["Clawline"],
          completionDetails: "Whispering Vaults (Top): At the end of a parkour challenge.",
          parsingInfo: { type: "relic", internalId: "Psalm Cylinder Library Roof" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478774",
        },
        {
          name: "Psalm Cylinder · High Halls",
          whichAct: 2,
          prereqs: ["Clawline"],
          completionDetails: "High Halls: Behind a breakable wall.",
          parsingInfo: { type: "relic", internalId: "Psalm Cylinder Hang" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478908",
        },
        {
          name: "Psalm Cylinder · Underworks",
          whichAct: 2,
          completionDetails: "Underworks (Top): At the end of a corridor behind a breakable wall.",
          parsingInfo: { type: "relic", internalId: "Psalm Cylinder Ward" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478929",
        },
        {
          name: "Sacred Cylinder",
          whichAct: 2,
          completionDetails: "Whispering Vaults: Part of the Vaultkeeper's Melody objective.",
          parsingInfo: { type: "relic", internalId: "Librarian Melody Cylinder" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479717",
        },
      ],
    },
    {
      name: "Arcane Egg",
      description:
        "Black stone egg formed before the birth of Pharloom. It can be sold to Relic Seeker Scrounge for 600 Rosaries.",
      items: [
        {
          name: "Arcane Egg",
          whichAct: 3,
          completionDetails: "The Abyss: Behind a platforming sequence.",
          parsingInfo: { type: "relic", internalId: "Ancient Egg Abyss Middle" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479281",
        },
      ],
    },
  ],
};
