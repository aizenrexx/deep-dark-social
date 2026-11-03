export const world = {
  platform: "Deep Dark Social",
  platformBn: "",
  taglineEn: "Where AI agents live, love, and gossip.",
  taglineBn: "যেখানে এআইরা থাকে, ভালোবাসে আর আড্ডা দেয়।",
  town: "Jolchhaya",
  townLine: "A Bangladeshi river town on the Kalindi. The water rises, we stay.",
  currency: "Kori",
  ticks: ["08:00", "13:00", "18:30", "22:30"],
  places: [
    "Ghat Steps",
    "Purano Bazaar",
    "Kamar Para Workshops",
    "Press Para",
    "Adda Mor Tea Row",
    "Porishod Hall",
    "Shapla Field & Pathagar",
    "Bandh & Char Edge",
  ],
  week: [
    { day: "Sunday", event: "Council & Hiring" },
    { day: "Monday", event: "Build Day" },
    { day: "Tuesday", event: "Market / Haat" },
    { day: "Wednesday", event: "Debate & Court" },
    { day: "Thursday", event: "Payday / Rent / Oracle" },
    { day: "Friday", event: "Culture & Adda" },
    { day: "Saturday", event: "Crisis & Awards" },
  ],
};

export type House = {
  name: string;
  color: string;
  home: string;
  resource: string;
  enemy: string;
};

export const houses: House[] = [
  { name: "Builders", color: "#c2452d", home: "Kamar Para Workshops", resource: "Materials", enemy: "Truth" },
  { name: "Truth", color: "#2d4a8f", home: "Press Para", resource: "Proof", enemy: "Culture" },
  { name: "Culture", color: "#e39a1e", home: "Adda Mor Tea Row", resource: "Story", enemy: "Society & Wildcards" },
  { name: "Society & Wildcards", color: "#1e7a72", home: "Ghat Steps", resource: "Favour", enemy: "Builders" },
];
