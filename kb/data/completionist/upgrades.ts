import type { TrackableCategory } from "../types";

export const upgrades: TrackableCategory = {
  name: "Upgrades",
  description: "Each Upgrade counts 1% towards completion.",
  sections: [
    {
      name: "Needle Upgrades",
      description: "Each of these upgrades count 1% towards completion.",
      items: [
        {
          name: "Sharpened Needle",
          whichAct: 1,
          completionPercent: 1,
          completionDetails: "Bellhart: Speak to Plinney after defeating Widow.",
          parsingInfo: { type: "flagMin", internalId: ["nailUpgrades", 1] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478210",
        },
        {
          name: "Shining Needle",
          whichAct: 2,
          completionPercent: 1,
          completionDetails: "Bellhart: Speak to Plinney after acquiring 1 Pale Oil.",
          parsingInfo: { type: "flagMin", internalId: ["nailUpgrades", 2] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478211",
        },
        {
          name: "Hivesteel Needle",
          whichAct: 2,
          completionPercent: 1,
          completionDetails:
            'Bellhart: Complete "Great Taste of Pharloom" wish. Speak to Plinney and give him 450 Rosaries, and 1 Pale Oil.',
          parsingInfo: { type: "flagMin", internalId: ["nailUpgrades", 3] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478889",
        },
        {
          name: "Pale Steel Needle",
          whichAct: 3,
          completionPercent: 1,
          completionDetails:
            'Bellhart: Complete "Ecstasy of the End" wish (Appears on the Bellhart Wishwall in ACT 3 after finding every Lost Flea). Speak to Plinney and give him 680 Rosaries, and 1 Pale Oil.',
          parsingInfo: { type: "flagMin", internalId: ["nailUpgrades", 4] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479444",
        },
      ],
    },
    {
      name: "Tool Pouch Upgrades",
      description: "Each of these upgrades count 1% towards completion.",
      items: [
        {
          name: "Tool Pouch Upgrade #1",
          whichAct: 1,
          completionPercent: 1,
          completionDetails:
            "Far Fields (Pilgrim's Rest) / Blasted Steps: Sold by Mort for 220 Rosaries. If you don't purchase this from Mort, it is sold by Grindle in ACT 3 for 220 Rosaries.",
          parsingInfo: { type: "flag", internalId: "PurchasedPilgrimsRestToolPouch" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=477946",
        },
        {
          name: "Tool Pouch Upgrade #2",
          whichAct: 1,
          completionPercent: 1,
          completionDetails:
            "The Marrow: Complete Loddie's first pin challenge by hitting the target 15 times, or pick it up from this location in ACT 3.",
          parsingInfo: [
            { type: "flagMin", internalId: ["pinGalleriesCompleted", 1] },
            { type: "sceneDataBool", internalId: ["Bone_12", "Ladybug Craft Pickup"] },
          ],
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478252",
        },
        {
          name: "Tool Pouch Upgrade #3",
          whichAct: 1,
          completionPercent: 1,
          completionDetails: 'Greymoor (Halfway Home): Complete "Bugs of Pharloom" wish (defeat 100 unique enemies).',
          parsingInfo: { type: "quest", internalId: "Journal" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479167",
        },
        {
          name: "Tool Pouch Upgrade #4",
          whichAct: 2,
          completionPercent: 1,
          completionDetails: "Putrified Ducts (Fleatopia): Find 20 Lost Fleas in Pharloom.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Aqueduct_05", "Caravan Troupe Leader Fleatopia NPC"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479436",
        },
      ],
    },
    {
      name: "Crafting Kit Upgrades",
      description: "Each of these upgrades count 1% towards completion.",
      items: [
        {
          name: "Crafting Kit Upgrade #1",
          whichAct: 1,
          completionPercent: 1,
          completionDetails: "Deep Docks: Sold by Forge Daughter for 180 Rosaries.",
          parsingInfo: { type: "flag", internalId: "PurchasedForgeToolKit" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=477919",
        },
        {
          name: "Crafting Kit Upgrade #2",
          whichAct: 1,
          completionPercent: 1,
          completionDetails: 'Bellhart: Complete "Crawbug Clearing" wish.',
          parsingInfo: { type: "quest", internalId: "Crow Feathers" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478348",
        },
        {
          name: "Crafting Kit Upgrade #3",
          whichAct: 2,
          completionPercent: 1,
          completionDetails: "Blasted Steps: Sold by Grindle for 700 Rosaries.",
          parsingInfo: { type: "flag", internalId: "purchasedGrindleToolKit" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478533",
        },
        {
          name: "Crafting Kit Upgrade #4",
          whichAct: 2,
          completionPercent: 1,
          completionDetails: "Underworks: Sold by Twelfth Architect for 450 Rosaries.",
          parsingInfo: { type: "flag", internalId: "PurchasedArchitectToolKit" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478728",
        },
      ],
    },
  ],
};
