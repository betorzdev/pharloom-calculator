import type { TrackableCategory } from "../types";

export const paleOil: TrackableCategory = {
  name: "Pale Oil",
  description:
    "Bile gland of a rare sylphean slug. Pale Oil can be brought to Pinmaster Plinney to upgrade Hornet's Needle.",
  sections: [
    {
      items: [
        {
          name: "Pale Oil #1",
          whichAct: 2,
          completionDetails:
            "Choral Chambers: Complete a box puzzle in Whispering Vaults, to reach a room to the east containing the Pale Oil.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Library_03", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478668",
        },
        {
          name: "Pale Oil #2",
          whichAct: 2,
          completionDetails: 'Choral Chambers: Reward for completing the "Great Taste of Pharloom" wish.',
          parsingInfo: { type: "quest", internalId: "Great Gourmand" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479233",
        },
        {
          name: "Pale Oil #3",
          whichAct: 3,
          completionDetails: 'Bellhart: Reward for completing "Ecstasy of the End" wish.',
          parsingInfo: { type: "quest", internalId: "Flea Games" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479582",
        },
      ],
    },
  ],
};
