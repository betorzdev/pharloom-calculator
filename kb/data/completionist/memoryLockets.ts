import type { TrackableCategory } from "../types";

export const memoryLockets: TrackableCategory = {
  name: "Memory Lockets",
  description: "Memory Lockets are used to add new Tool slots to your Crests.",
  sections: [
    {
      items: [
        {
          name: "Memory Locket · Far Fields",
          whichAct: 1,
          completionDetails:
            "Far Fields (Pilgrim's Rest) / Blasted Steps: Sold by Mort for 150 Rosaries. If you don't purchase this from Mort, it is sold by Grindle in ACT 3 for 250 Rosaries.",
          parsingInfo: { type: "flag", internalId: "PurchasedPilgrimsRestMemoryLocket" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=477953",
        },
        {
          name: "Memory Locket · Hunter's March",
          whichAct: 1,
          completionDetails:
            "Hunter's March (Far-right): In a cage at the end of the spiky corridor. Break the cage to pick it up.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Ant_20", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478017",
        },
        {
          name: "Memory Locket · Greymoor",
          whichAct: 1,
          completionDetails: "Greymoor: On a ledge above a Mitemother.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Greymoor_16", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478035",
        },
        {
          name: "Memory Locket · Greymoor (#2)",
          whichAct: 2,
          prereqs: ["Faydown Cloak"],
          completionDetails: "Greymoor: Inside Halfway Home.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Halfway_01", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478039",
        },
        {
          name: "Memory Locket · Bellhart",
          whichAct: 1,
          completionDetails: "Bellhart: Sold by Frey for 330 Rosaries.",
          parsingInfo: { type: "flag", internalId: "PurchasedBelltownMemoryLocket" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478204",
        },
        {
          name: "Memory Locket · Bellhart (#2)",
          whichAct: 3,
          prereqs: ["Silk Soar"],
          completionDetails: "Bellhart: Silk Soar into the roof.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Belltown", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478212",
        },
        {
          name: "Memory Locket · Bone Bottom",
          whichAct: 1,
          completionDetails: 'Bone Bottom: Complete "Volatile Flintbeetles" wish.',
          parsingInfo: { type: "quest", internalId: "Rock Rollers" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478222",
        },
        {
          name: "Memory Locket · The Marrow",
          whichAct: 1,
          prereqs: ["Cling Grip"],
          completionDetails: "The Marrow (Top)",
          parsingInfo: { type: "sceneDataBool", internalId: ["Bone_18", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478246",
        },
        {
          name: "Memory Locket · Choral Chambers",
          whichAct: 2,
          completionDetails:
            'Choral Chambers (Grand Bellway): Behind a breakable wall above the Bellway, accessible through the "Exhaust Organ - Underworks" path.',
          parsingInfo: { type: "sceneDataBool", internalId: ["Bellway_City", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478372",
        },
        {
          name: "Memory Locket · Wormways",
          whichAct: 1,
          completionDetails: "Wormways (Bottom-right): Held by a corpse.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Crawl_09", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478493",
        },
        {
          name: "Memory Locket · Blasted Steps",
          whichAct: 1,
          completionDetails: "Blasted Steps: On a narrow platform above the sands.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Coral_02", "Collectable Item Pickup (1)"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478502",
        },
        {
          name: "Memory Locket · Underworks",
          whichAct: 2,
          completionDetails: "Underworks: In a hidden area towards the left of the confession booth.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Under_08", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478571",
        },
        {
          name: "Memory Locket · Whispering Vaults",
          whichAct: 2,
          completionDetails: "Whispering Vaults: At the top of a tunnel.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Library_08", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478676",
        },
        {
          name: "Memory Locket · Bilewater",
          whichAct: 1,
          completionDetails:
            "Bilewater: At the far-left edge of a secret room. Bounce over the infested waters and wall-jump up the vertical space to reach it.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Shadow_20", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478787",
        },
        {
          name: "Memory Locket · Deep Docks",
          whichAct: 2,
          completionDetails:
            "Deep Docks: Held by a corpse at the bottom of a magma-filled area found behind a breakable wall.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Dock_13", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478836",
        },
        {
          name: "Memory Locket · Bilewater (#2)",
          whichAct: 2,
          completionDetails: "Bilewater: Held by a corpse in a breakable cocoon dangling from the ceiling.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Shadow_27", "Sack Corpse Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478851",
        },
        {
          name: "Memory Locket · The Slab",
          whichAct: 2,
          completionDetails:
            "The Slab: Inside the shortcut cave. Look out for a breakable wall as you climb a vertical space.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Slab_Cell_Quiet", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479017",
        },
        {
          name: "Memory Locket · Memorium",
          whichAct: 2,
          completionDetails: "Memorium: After a platforming section.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Arborium_05", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479110",
        },
        {
          name: "Memory Locket · Far Fields (#2)",
          whichAct: 3,
          completionDetails:
            "Far Fields: In a secret area towards the right of the Karmelita cave. Guarded by a void-powered Skarrgard.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Bone_East_25", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479196",
        },
        {
          name: "Memory Locket · Sands of Karak",
          whichAct: 2,
          completionDetails: "Sands of Karak: Held by a corpse at the top of the area.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Coral_23", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479204",
        },
      ],
    },
  ],
};
