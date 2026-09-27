import type { TrackableCategory } from "../types";

export const ventricaStations: TrackableCategory = {
  name: "Ventrica Stations",
  description: "Underground pneumatic transport system that connects major locations within The Citadel.",
  sections: [
    {
      name: "Main",
      description: "",
      items: [
        {
          name: "Terminus",
          whichAct: 2,
          completionDetails: "Unlocks after opening any one of the Ventrica Stations.",
          parsingInfo: {
            type: "flagAnyOf",
            internalId: [
              "UnlockedArboriumTube",
              "UnlockedHangTube",
              "UnlockedSongTube",
              "UnlockedCityBellwayTube",
              "UnlockedUnderTube",
              "UnlockedEnclaveTube",
            ],
          },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478426",
        },
        {
          name: "Memorium",
          whichAct: 2,
          completionDetails: "Unlocks after paying a toll of 80 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedArboriumTube" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478425",
        },
        {
          name: "High Halls",
          whichAct: 2,
          completionDetails: "Unlocks after paying a toll of 80 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedHangTube" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478445",
        },
        {
          name: "First Shrine",
          whichAct: 2,
          completionDetails: "Unlocks after paying a toll of 80 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedEnclaveTube" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478427",
        },
        {
          name: "Choral Chambers",
          whichAct: 2,
          completionDetails: "Unlocks after paying a toll of 80 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedSongTube" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478424",
        },
        {
          name: "Grand Bellway",
          whichAct: 2,
          completionDetails: "Unlocks after paying a toll of 80 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedCityBellwayTube" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478376",
        },
        {
          name: "Underworks",
          whichAct: 2,
          completionDetails: "Unlocks after paying a toll of 80 Rosaries.",
          parsingInfo: { type: "flag", internalId: "UnlockedUnderTube" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478422",
        },
      ],
    },
  ],
};
