import type { TrackableCategory } from "../types";

export const mossberries: TrackableCategory = {
  name: "Mossberries",
  description:
    "Sweet berries with poisonous seeds, that grow in moist environments. Initially gathered as a part of a wish, later used to trade for Rosaries (and a Tool upgrade).",
  sections: [
    {
      items: [
        {
          name: "Mossberry #1",
          whichAct: 1,
          completionDetails: "Moss Grotto",
          parsingInfo: { type: "sceneDataBool", internalId: ["Tut_02", "moss_berry_fruit"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=476900",
        },
        {
          name: "Mossberry #2",
          whichAct: 1,
          completionDetails: "Moss Grotto: Pogo off of a nearby Mossmir to reach it.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Tut_01b", "moss_berry_fruit"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=476909",
        },
        {
          name: "Mossberry #3",
          whichAct: 1,
          completionDetails:
            "Moss Grotto (Bone Bottom): Held by a flying enemy high above the settlement. Moves into a room east of here in ACT 3.",
          parsingInfo: { type: "flag", internalId: "bonetownAspidBerryCollected" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478141",
        },
        {
          name: "Mossberry #4",
          whichAct: 1,
          completionDetails: "Moss Grotto (Mosshome): Held by a flying enemy.",
          parsingInfo: { type: "flag", internalId: "mosstownAspidBerryCollected" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=477877",
        },
        {
          name: "Mossberry #5",
          whichAct: 1,
          completionDetails: "Moss Grotto (Bonegrave): Held by an enemy flying high above this area.",
          parsingInfo: { type: "flag", internalId: "bonegraveAspidBerryCollected" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478237",
        },
        {
          name: "Mossberry #6",
          whichAct: 1,
          completionDetails: "Weavenest Atla: Found growing from a ceiling.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Weave_03", "moss_berry_fruit"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479069",
        },
        {
          name: "Mossberry #7",
          whichAct: 2,
          completionDetails: "Memorium",
          parsingInfo: { type: "sceneDataBool", internalId: ["Arborium_04", "moss_berry_fruit"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479108",
        },
      ],
    },
  ],
};
