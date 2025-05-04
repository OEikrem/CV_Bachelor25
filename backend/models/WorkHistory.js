/* Databasemodell for arbeidshistorikk (WorkHistory). Inneholder informasjon om brukerens tidligere jobber, som arbeidsgiver, stilling, periode og beskrivelse. 
Kan kobles til bruker eller smartkontrakt for validering */

const mongoose = require("mongoose");

const workHistorySchema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  roleDescription: { type: String, required: true },
  company: { type: String, required: true },
  years: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Arbeidsgiverdata – legges til senere
  approved: { type: Boolean, default: false },
  comment: { type: String, default: "" },
  signedBy: { type : String, default: ""},
  signedAt: {type: Date},
  txHash: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("WorkHistory", workHistorySchema);
