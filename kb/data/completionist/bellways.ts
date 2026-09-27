import type { TrackableCategory } from "../types";

export const bellways: TrackableCategory = {
  name: "Bellways",
  description:
    "Fast travel stations throughout Pharloom that allow quick movement between discovered (and unlocked) Bellway stations.",
  sections: [
    {
      items: [
        {
          name: "Bone Bottom",
          whichAct: 1,
          completionDetails: "Unlocks after defeating the Bell Beast.",
          parsingInfo: { type: "flag", internalId: "UnlockedFastTravel" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=477883",
        },
        {
          name: "The Marrow",
          whichAct: 1,
          completionDetails: "Unlocks after defeating the Bell Beast.",
          parsingInfo: { type: "flag", internalId: "UnlockedFastTravel" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=477882",
        },
        {
          name: "Deep Docks",
          whichAct: 1,
          completionDetails: "Unlocks after paying a toll of 40 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedDocksStation" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=477905",
        },
        {
          name: "Far Fields",
          whichAct: 1,
          completionDetails: "Unlocks after paying a toll of 50 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedBoneforestEastStation" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=477933",
        },
        {
          name: "Greymoor",
          whichAct: 1,
          completionDetails: "Unlocks after paying a toll of 60 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedGreymoorStation" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478037",
        },
        {
          name: "Bellhart",
          whichAct: 1,
          completionDetails: "Unlocks after paying a toll of 60 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedBelltownStation" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478029",
        },
        {
          name: "Shellwood",
          whichAct: 1,
          completionDetails: "Unlocks after paying a toll of 40 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedShellwoodStation" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478178",
        },
        {
          name: "Blasted Steps",
          whichAct: 1,
          completionDetails: "Unlocks after paying a toll of 60 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedCoralTowerStation" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478308",
        },
        {
          name: "The Slab",
          whichAct: 1,
          completionDetails: "Unlocks after paying a toll of 40 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedPeakStation" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478390",
        },
        {
          name: "Bilewater",
          whichAct: 1,
          completionDetails: "Unlocks after paying a toll of 80 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedShadowStation" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478447",
        },
        {
          name: "Grand Bellway",
          whichAct: 2,
          completionDetails: "Unlocks after paying a toll of 80 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedCityStation" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478374",
        },
        {
          name: "Putrified Ducts",
          whichAct: 2,
          completionDetails: "Unlocks after paying a toll of 80 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedAqueductStation" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478411",
        },
      ],
    },
  ],
};
