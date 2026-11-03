// Fictional seed data. One team, a roster with confusable numbers (1/11, 4/14, 12/21),
// and one game's clips as the tagging model returned them.
window.SEED = {
  club: { name: "Ridgeline Youth Soccer Club" },
  team: { name: "U10 Falcons", coach: "Coach Rivera", recapCutoff: "Sunday 6:00 PM" },
  threshold: 0.9,
  players: [
    { id: "p1", name: "Sam O.", number: 1 },
    { id: "p11", name: "Eli R.", number: 11 },
    { id: "p4", name: "Mia D.", number: 4 },
    { id: "p14", name: "Ava M.", number: 14 },
    { id: "p7", name: "Noah T.", number: 7 },
    { id: "p12", name: "Zoe K.", number: 12 },
    { id: "p21", name: "Liam P.", number: 21 }
  ],
  // match = player the model picked; confidence = how sure it was.
  clips: [
    { id: "c1", at: "03:12", kind: "Goal", match: "p14", confidence: 0.72 },
    { id: "c2", at: "08:40", kind: "Save", match: "p1", confidence: 0.81 },
    { id: "c3", at: "15:05", kind: "Assist", match: "p14", confidence: 0.96 },
    { id: "c4", at: "21:30", kind: "Breakaway", match: "p7", confidence: 0.64 },
    { id: "c5", at: "27:18", kind: "Tackle", match: "p21", confidence: 0.77 },
    { id: "c6", at: "33:50", kind: "Goal", match: "p4", confidence: 0.93 },
    { id: "c7", at: "41:02", kind: "Shot", match: "p11", confidence: 0.88 },
    { id: "c8", at: "46:20", kind: "Goal", match: "p12", confidence: 0.97 }
  ]
};
