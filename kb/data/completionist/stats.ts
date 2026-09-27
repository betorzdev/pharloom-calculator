import type { TrackableCategory } from "../types";

export const stats: TrackableCategory = {
  name: "Stats",
  description: "How long you've been exploring, your treasure hoard, and the kind of soul you carry!",
  sections: [
    {
      items: [
        {
          name: "Playtime",
          whichAct: 0,
          completionDetails: "",
          parsingInfo: { type: "flagReturn", internalId: "playTime" },
          mapLink: "",
        },
        {
          name: "Game Mode",
          whichAct: 0,
          completionDetails: "",
          parsingInfo: { type: "flagReturn", internalId: "permadeathMode" },
          mapLink: "",
        },
        {
          name: "Rosaries",
          whichAct: 0,
          completionDetails: "",
          parsingInfo: { type: "flagReturn", internalId: "geo" },
          mapLink: "",
        },
        {
          name: "Shell Shards",
          whichAct: 0,
          completionDetails: "",
          parsingInfo: { type: "flagReturn", internalId: "ShellShards" },
          mapLink: "",
        },
      ],
    },
  ],
};
