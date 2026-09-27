import type { TrackableCategory } from "../types";

export const craftmetals: TrackableCategory = {
  name: "Craftmetals",
  description:
    "Rare element found naturally within the rock and bone of Pharloom. Used by skilled craftsbugs in the construction of tools and trinkets.",
  sections: [
    {
      items: [
        {
          name: "Craftmetal #1",
          whichAct: 1,
          completionDetails:
            "Bone Bottom / Blasted Steps: Sold by Pebb for 60 Rosaries. If you don't purchase this from Pebb, it is sold by Grindle in ACT 3 for 120 Rosaries.",
          parsingInfo: { type: "flag", internalId: "PurchasedBonebottomToolMetal" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=477838",
        },
        {
          name: "Craftmetal #2",
          whichAct: 1,
          completionDetails: "The Marrow: At the end of a booby-trapped tunnel in a secret room.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Bone_07", "Collectable Item Pickup - Tool Metal"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=477894",
        },
        {
          name: "Craftmetal #3",
          whichAct: 1,
          completionDetails:
            "Deep Docks: Inside a chest behind the blockade. Whack it, or get one of the nearby enemies' explosive projectiles to clear it.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Dock_03", "Collectable Item Pickup"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=477937",
        },
        {
          name: "Craftmetal #4",
          whichAct: 1,
          completionDetails: "Blasted Steps: At the end of a passage filled with worms and falling rocks.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Coral_32", "Collectable Item Pickup - Tool Metal"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478541",
        },
        {
          name: "Craftmetal #5",
          whichAct: 2,
          completionDetails:
            "Underworks: At the end of a lava-filled tunnel. Taking it will trigger an Undercrank ambush.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Under_19b", "Collectable Item Pickup - Tool Metal"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=478711",
        },
        {
          name: "Craftmetal #6",
          whichAct: 2,
          prereqs: ["Faydown Cloak"],
          completionDetails: "Putrified Ducts: Far-right of Pale Lake, in a crevice above the water.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Aqueduct_05", "Collectable Item Pickup - Tool Metal"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479139",
        },
        {
          name: "Craftmetal #7",
          whichAct: 2,
          completionDetails:
            "Wisp Thicket: At the end of a hidden path, found in the top-left part of the area filled with (fire) Wisp spawners.",
          parsingInfo: { type: "sceneDataBool", internalId: ["Wisp_05", "Collectable Item Pickup - Tool Metal"] },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479157",
        },
        {
          name: "Craftmetal #8",
          whichAct: 2,
          completionDetails: 'Songclave: Sold by Jubilana for 180 Rosaries, after completing "The Lost Merchant" wish.',
          parsingInfo: { type: "flag", internalId: "MerchantEnclaveToolMetal" },
          mapLink: "https://mapgenie.io/hollow-knight-silksong/maps/pharloom?locationIds=479250",
        },
      ],
    },
  ],
};
