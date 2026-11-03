// Fictional seed data shaped on the brief's description of SidelineReel:
// clubs and teams, coaches upload games, the app finds each kid's highlights,
// cuts a personal reel, and sends a weekly recap to every family on the roster.
// Replace or extend once the case materials are in front of you.
window.SEED = {
  club: { id: "c1", name: "Northside Youth Soccer" },
  teams: [{ id: "t1", name: "U10 Falcons", coach: "Coach Rivera" }],
  players: [
    { id: "p1", teamId: "t1", name: "Ava M.", number: 7, family: "ava.family@example.com" },
    { id: "p2", teamId: "t1", name: "Leo K.", number: 3, family: "leo.family@example.com" },
    { id: "p3", teamId: "t1", name: "Maya S.", number: 11, family: "maya.family@example.com" },
    { id: "p4", teamId: "t1", name: "Noah T.", number: 5, family: null }
  ],
  games: [
    { id: "g1", teamId: "t1", opponent: "Riverside", date: "2026-11-01", status: "processed", minutes: 52 },
    { id: "g2", teamId: "t1", opponent: "Eastfield", date: "2026-11-08", status: "uploading", minutes: 0 }
  ],
  // confidence = how sure the detector is that the clip shows this player.
  clips: [
    { id: "k1", gameId: "g1", playerId: "p1", at: "12:04", kind: "goal", confidence: 0.94, state: "pending" },
    { id: "k2", gameId: "g1", playerId: "p1", at: "31:40", kind: "assist", confidence: 0.71, state: "pending" },
    { id: "k3", gameId: "g1", playerId: "p2", at: "18:22", kind: "save", confidence: 0.88, state: "pending" },
    { id: "k4", gameId: "g1", playerId: "p3", at: "40:15", kind: "tackle", confidence: 0.52, state: "pending" },
    { id: "k5", gameId: "g1", playerId: null, at: "44:02", kind: "shot", confidence: 0.38, state: "pending" }
  ]
};
