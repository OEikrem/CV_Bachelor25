// Definerer en databasemodell for transaksjonslogger (TxLog). Brukes til å lagre og hente informasjon om blockchain-transaksjoner

const mongoose = require("mongoose");

// Definerer Mongoose-skjemaet for transaksjonsloggen (TxLog)
const txLogSchema = new mongoose.Schema({
  txHash: {
    type: String,
    required: true, // Påkrevd for å lagre transaksjonslogg
  },
  approved: {
    type: Boolean,
    required: false,  // Feltene er ikke nødvendige ved første lagring
  },
  comment: {
    type: String,
    required: false,  // Kommentar er ikke påkrevd ved første lagring
  },
  signedBy: {
    type: String,
    required: false,  // Signatur er ikke påkrevd ved første lagring
  },
  signedAt: {
    type: Date, // Dato for signatur
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Refererer til bruker-modellen
    required: true, // Bruker-ID er påkrevd
  },
  jobTitle: {
    type: String,
    required: true, // Jobbtittel er påkrevd
  },
  createdAt: {
    type: Date,
    default: Date.now,  // Opprettelsesdato settes automatisk
  }
});

// Eksporterer TxLog-modellen basert på skjemaet
module.exports = mongoose.model("TxLog", txLogSchema);
