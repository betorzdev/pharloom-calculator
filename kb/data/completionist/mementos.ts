import type { TrackableCategory } from "../types";

export const mementos: TrackableCategory = {
  name: "Mementos",
  description:
    "Personal keepsakes and tokens of remembrance from various characters and places throughout Pharloom. These are only tracked once they're placed in your Bellhome.",
  sections: [
    {
      items: [
        {
          name: "Grey Memento",
          whichAct: 3,
          completionDetails: "Sands of Karak: Defeat Watcher at the Edge.",
          parsingInfo: { type: "mementoDeposit", internalId: "Grey Memento" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479630",
        },
        {
          name: "Hero's Memento",
          whichAct: 3,
          completionDetails: "Blasted Steps: Defeat Lost Garmond.",
          parsingInfo: { type: "mementoDeposit", internalId: "Memento Garmond" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479632",
        },
        {
          name: "Surface Memento",
          whichAct: 3,
          completionDetails:
            "The Surface (atop The Cradle): Play the Needolin in the house on the far right side of the Nameless Town to make it drop from the ceiling.",
          parsingInfo: { type: "mementoDeposit", internalId: "Memento Surface" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479542",
        },
        {
          name: "Hunter's Memento",
          whichAct: 3,
          completionDetails:
            "Greymoor (Halfway Home): Complete the Hunter's Journal. The journal entries for Shakra, Garmond & Zaza, Palestag, Lost Garmond, Lost Lace, and Summoned Saviour are not required.",
          parsingInfo: { type: "mementoDeposit", internalId: "Hunter Memento" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479635",
        },
        {
          name: "Craw Memento",
          whichAct: 3,
          completionDetails:
            'Far Fields: Greymoor (Craw Lake): Defeat Crawfather. Unlocked at the same time as a "Crawbell" (also used to decorate the Bellhome), which generates Rosaries and Shell Shards over time.',
          parsingInfo: { type: "mementoDeposit", internalId: "Crowman Memento" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479580",
        },
        {
          name: "Sprintmaster Memento",
          whichAct: 3,
          completionDetails:
            "Complete a race with Sprintmaster Swift after you deliver three hearts to the Snail Shamans in ACT 3.",
          parsingInfo: { type: "mementoDeposit", internalId: "Sprintmaster Memento" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479634",
        },
        {
          name: "Guardian's Memento",
          whichAct: 3,
          completionDetails:
            "Putrified Ducts (Fleatopia): Talk to Seth after beating all of his scores in all the Flea Games.",
          parsingInfo: { type: "mementoDeposit", internalId: "Memento Seth" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479638",
        },
        {
          name: "Heart Memento",
          whichAct: 3,
          completionDetails:
            'Of the four available hearts (Encrusted Heart, Pollen Heart, Hunter\'s Heart, Conjoined Heart), the heart that is not used as a part of the "The Old Hearts" wish (which requires 3 Hearts), can be showcased as a memento in your Bellhome.',
          parsingInfo: [
            { type: "mementoDeposit", internalId: "Flower Heart" },
            { type: "mementoDeposit", internalId: "Hunter Heart" },
            { type: "mementoDeposit", internalId: "Coral Heart" },
            { type: "mementoDeposit", internalId: "Clover Heart" },
          ],
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479631",
        },
      ],
    },
  ],
};
