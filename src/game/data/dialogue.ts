import { asset } from "@/lib/asset";

export interface Line {
  speaker: string;
  portrait?: string;
  text: string;
  replies?: { label: string; next?: string; discover?: string }[];
}

export const DIALOGUE: Record<string, Line[]> = {
  crate: [
    {
      speaker: "Brokk Coalhand",
      portrait: asset("/portraits/laborer.jpg"),
      text: "The dwarf on the crate looks up, then doesn't. A shrug. That is the entire briefing.",
      replies: [{ label: "You work here?", discover: "lazyDwarf" }],
    },
    {
      speaker: "Brokk Coalhand",
      portrait: asset("/portraits/laborer.jpg"),
      text: "\"Work.\" He tastes the word. \"We wait. Someone used to shout. Then they left. Then the next one left. Crate's dry enough.\"",
      replies: [{ label: "Leave him to it." }],
    },
  ],
  owner: [
    {
      speaker: "Durgan Ashpick",
      portrait: asset("/portraits/laborer.jpg"),
      text: "He squints as if the coat is a trick of the light. \"Owner?\"",
      replies: [{ label: "I bought the operation.", discover: "ownerQuestion" }],
    },
    {
      speaker: "Durgan Ashpick",
      portrait: asset("/portraits/laborer.jpg"),
      text: "A long breath through the beard. He points, vaguely, at the mountain. Not at a building. At the dark in the rock.",
      replies: [{ label: "That's the company?" }],
    },
    {
      speaker: "Durgan Ashpick",
      portrait: asset("/portraits/laborer.jpg"),
      text: "\"That's it. Hole, carts, us. Fine print's usually in Shaft Four. Nobody reads Shaft Four.\"",
      replies: [{ label: "I'll look around." }],
    },
  ],
  nobody: [
    {
      speaker: "Nessa Flint",
      portrait: asset("/portraits/helga.jpg"),
      text: "\"Nobody told us there was a new owner.\" She says it like weather. \"If you're collecting debts, the kettle's empty. If you're collecting workers, we're already here.\"",
      replies: [{ label: "I'm not collecting. I'm staying.", discover: "ownerQuestion" }],
    },
  ],
  pip: [
    {
      speaker: "Pip Eageraxe",
      portrait: asset("/portraits/pip.jpg"),
      text: "\"Are we mining today? I brought a pick. Well. I found a pick. The head's a bit... conversational with the handle.\"",
      replies: [{ label: "Don't swing anything until you're told." }],
    },
  ],
  helga: [
    {
      speaker: "Helga Ironvein",
      portrait: asset("/portraits/helga.jpg"),
      text: "She's been watching the adit, not you. \"Iron's in the shallow face if you don't mind bad air and worse timber. I can cut it. I won't cut it blind.\"",
      replies: [{ label: "I'll find whoever still keeps the maps." }],
    },
  ],
  road: [
    {
      speaker: "Fenn Mossbeard",
      portrait: asset("/portraits/laborer.jpg"),
      text: "He came in on the same road you did, years ago. \"Traders used to. Then they didn't. Forest's honest. Camp isn't.\"",
      replies: [{ label: "How far to the mountain?", discover: "road" }],
    },
    {
      speaker: "Fenn Mossbeard",
      portrait: asset("/portraits/laborer.jpg"),
      text: "He nods toward the smoke. \"That's your mining company. Sorry.\"",
      replies: [{ label: "Walk on." }],
    },
  ],
  dorm: [
    {
      speaker: "Mora Sleepwell",
      portrait: asset("/portraits/helga.jpg"),
      text: "From the ruined bunk: \"Roof doesn't leak if you lie in the dry corner. There are two dry corners. There are sixteen of us.\"",
      replies: [{ label: "I'll see to the roof.", discover: "dorm" }],
    },
  ],
  food: [
    {
      speaker: "Kori Salt",
      portrait: asset("/portraits/helga.jpg"),
      text: "The kettle ticks. \"Turnips. If you pay, there might be bread. If you don't pay, there are still turnips. Civilization is a seasoning.\"",
      replies: [{ label: "Keep the fire." }],
    },
  ],
  forge: [
    {
      speaker: "Ulla Redkettle",
      portrait: asset("/portraits/helga.jpg"),
      text: "She kicks the cold hearth. \"Previous owner bought a bellows. Never hired a smith who could read it. Modernization, they called it.\"",
      replies: [{ label: "We'll light it when we can feed it.", discover: "forge" }],
    },
  ],
  storage: [
    {
      speaker: "Grit Barrel",
      portrait: asset("/portraits/laborer.jpg"),
      text: "\"Piles. Some of it's stone. Some of it's rust. Some of it's a previous owner's optimism. I wouldn't sign for any of it.\"",
      replies: [{ label: "We'll count it.", discover: "storage" }],
    },
  ],
  cart: [
    {
      speaker: "Hob Nailfinger",
      portrait: asset("/portraits/laborer.jpg"),
      text: "He spins a wheel with his boot. It is not attached to a cart. \"Haul's a theory until this is a vehicle.\"",
      replies: [{ label: "Put it on the board." }],
    },
  ],
  mine: [
    {
      speaker: "Yara Quietpick",
      portrait: asset("/portraits/helga.jpg"),
      text: "She speaks softly, as if the rock is listening. \"Shallow limestone. A little iron if you're greedy. Don't blast the east wall. Something silver-looking in the galena. We can't reach it and we shouldn't guess.\"",
      replies: [{ label: "Show me the adit.", discover: "mountainPoint" }],
    },
  ],
  generic: [
    {
      speaker: "A dwarf",
      portrait: asset("/portraits/laborer.jpg"),
      text: "A look. A wait. The philosophy of the colony, in one posture: sit until somebody explains what the hell is happening.",
      replies: [{ label: "Carry on." }],
    },
  ],
  borrin: [
    {
      speaker: "Borrin Stoneledger",
      portrait: asset("/portraits/borrin.jpg"),
      text: "The old dwarf in the battered chair does not stand. He studies the coat, the clasp, the fact of you.",
      replies: [{ label: "I'm the new owner." }],
    },
    {
      speaker: "Borrin Stoneledger",
      portrait: asset("/portraits/borrin.jpg"),
      text: "\"You bought it?\"",
      replies: [{ label: "All of it." }],
    },
    {
      speaker: "Borrin Stoneledger",
      portrait: asset("/portraits/borrin.jpg"),
      text: "A longer pause. The chair creaks like a ledger closing. \"All of it.\"",
      replies: [{ label: "That's the contract." }],
    },
    {
      speaker: "Borrin Stoneledger",
      portrait: asset("/portraits/borrin.jpg"),
      text: "\"Did they show you Shaft Four?\"",
      replies: [{ label: "They showed me a signature line.", discover: "borrin" }],
    },
    {
      speaker: "Borrin Stoneledger",
      portrait: asset("/portraits/borrin.jpg"),
      text: "He almost smiles. It is not kind. \"Slave pit. Then a buyout. Then three modernizers, two bankruptcies, and a man who tried to pay us in company scrip printed on the back of meal chits. I have been pit steward, quartermaster, shift clerk, assistant foreman, interim foreman, stores keeper, and whatever else nobody was doing. The dwarves will not move until someone tells them the day has a shape. That someone is now you.\"",
      replies: [{ label: "Then tell me what I actually own." }],
    },
    {
      speaker: "Borrin Stoneledger",
      portrait: asset("/portraits/borrin.jpg"),
      text: "\"Sixteen pairs of hands that remember being property. Four picks worth using. A roof that lies. A forge that doesn't. A flooded hole we call Shaft Two because Shaft Four has a reputation. Limestone you can see. Iron you can guess. Silver in the galena we cannot reach. And an old note about yellow metal below Shaft Seven that nobody currently employed can read correctly.\" He taps the chair. \"Revenue is not wealth. Don't celebrate a haul until wages, food, tools, and the roof have eaten. I'll keep the board. You decide who works.\"",
      replies: [{ label: "Open the pit board.", discover: "workforce" }],
    },
  ],
  inspect_dorm: [
    {
      speaker: "Inspection",
      text: "The dormitory is a suggestion of a building. Rain has a dedicated aisle. Sixteen names could sleep here. Tonight they will not rest well.",
      replies: [{ label: "Note it.", discover: "dorm" }],
    },
  ],
  inspect_forge: [
    {
      speaker: "Inspection",
      text: "An unused forge. The anvil is sound. The bellows are not. Coal dust on the floor like a rumor of industry.",
      replies: [{ label: "Note it.", discover: "forge" }],
    },
  ],
  inspect_storage: [
    {
      speaker: "Inspection",
      text: "Collapsed storage. Half-filled ore piles, no tags, no weights. If this is the inventory, the inventory is a shrug.",
      replies: [{ label: "Note it.", discover: "storage" }],
    },
  ],
  inspect_office: [
    {
      speaker: "Inspection",
      text: "The lock yields to a key Borrin does not admit he kept. Inside: dust, a cracked lamp, and ledgers last dated in a year you do not recognize.",
      replies: [{ label: "Open the ledgers.", next: "inspect_ledgers", discover: "office" }],
    },
  ],
  inspect_ledgers: [
    {
      speaker: "Old ledger",
      text: "Columns of numbers that do not add. A margin note, in a better hand: \"yellow metal encountered below Shaft VII — assay pending.\" The next page is water-stained. Someone has drawn a vein and labeled it, incorrectly, as iron.",
      replies: [{ label: "Literacy is now a mining tool.", discover: "ledgers" }],
    },
  ],
  inspect_shaft: [
    {
      speaker: "Inspection",
      text: "A boarded hole. Water talks underneath. The smell is old timber and something mineral and wrong. This is not Shaft Four. Borrin would like you to remember that.",
      replies: [{ label: "Step back.", discover: "floodedShaft" }],
    },
  ],
  inspect_cart: [
    {
      speaker: "Inspection",
      text: "Mine carts as modern art: wheels in one pile, bodies in another, a mule harness for an animal that is no longer in the county.",
      replies: [{ label: "Note it." }],
    },
  ],
  inspect_kitchen: [
    {
      speaker: "Inspection",
      text: "A cookfire. Civilization, in its first draft.",
      replies: [{ label: "Note it." }],
    },
  ],
};

export function portraitFor(speakerId: string, dwarves: { id: string; portrait: string }[]) {
  if (speakerId === "player") return asset("/portraits/lord.jpg");
  const d = dwarves.find((x) => x.id === speakerId);
  return d?.portrait ?? asset("/portraits/laborer.jpg");
}
