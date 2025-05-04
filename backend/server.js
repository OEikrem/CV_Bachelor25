// server.js er entry point for backend-serveren. Setter opp Express-app, middleware, ruter og kobler til databasen og starter HTTP-serveren for å håndtere API-forespørsler

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const authRoutes = require("./routes/auth");
const workHistoryRoutes = require("./routes/workhistory");
const txLogRoutes = require("./routes/txlog");
const authMiddleware = require("./middleware/authMiddleware");
const User = require("./models/User");
const TxLog = require("./models/TxLog");
const WorkHistory = require("./models/WorkHistory");

const app = express();

//Middleware
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"], // Tillat kun ressurser (JS, CSS, bilder) fra samme domene som appen kjører på
    scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdn.ethers.io"], // Tillat JS-filer + fra CDN-er: jsdelivr og ethers.io
    styleSrc: ["'self'"], // Tillat kun CSS fra samme domene som appen kjører på
    fontSrc: ["'self'"], // Tillat fontfiler + fra fonts.gstatic.com
    imgSrc: ["'self'"], // Bilder tillates kun fra eget domene
    connectSrc: ["'self'", "http://localhost:3000"], //	Tillat fetch() og XHR til egen backend og http://localhost:3000
  }
}));

//Koble til MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

//API-ruter
app.use("/api/auth", authRoutes);
app.use("/api/txlog", txLogRoutes);
app.use("/api/workhistories", authMiddleware, workHistoryRoutes);

//Ekstra API-endepunkter (utenfor routes-mappene)

//Hent arbeidshistorikk til innlogget bruker
app.get("/api/workhistories", authMiddleware, async (req, res) => {
  try {
    const workHistories = await WorkHistory.find({ user: req.user.id });
    res.status(200).json(workHistories);
  } catch (error) {
    console.error("Feil ved henting av arbeidshistorikk:", error);
    res.status(500).json({ error: "Feil ved henting av arbeidshistorikk" });
  }
});

//Slett arbeidshistorikk
app.delete("/api/workhistories/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await WorkHistory.findOneAndDelete({ _id: id, user: userId });

    if (!deleted) return res.status(404).json({ message: "Arbeidshistorikk ikke funnet" });

    res.status(200).json({ message: "Arbeidshistorikk slettet!" });
  } catch (error) {
    console.error("Feil ved sletting:", error);
    res.status(500).json({ message: "Feil ved sletting av arbeidshistorikk" });
  }
});

// Slett innlogget bruker
app.delete("/api/user", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId; // støtte begge navn
    if (!userId) return res.status(400).json({ message: "Bruker-ID mangler i token." });

    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "Bruker slettet" });
  } catch (err) {
    console.error("❌ Feil ved sletting av bruker:", err);
    res.status(500).json({ message: "Serverfeil ved sletting av bruker" });
  }
});

//Hent arbeidshistorikk (arbeidsgiver)
app.get("/api/public-workhistory/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await WorkHistory.find({ user: userId });

    if (!history.length) return res.status(404).json({ message: "Ingen arbeidshistorikk funnet." });

    res.status(200).json(history);
  } catch (error) {
    console.error("Feil ved henting av historikk:", error);
    res.status(500).json({ error: "Serverfeil." });
  }
});

// Hent arbeidshistorikk basert på txHash
app.get("/api/workhistory/tx/:txHash", async (req, res) => {
  try {
    const { txHash } = req.params;
    const workHistory = await WorkHistory.findOne({ txHash });

    if (!workHistory) return res.status(404).json({ message: "Ingen arbeidshistorikk funnet for gitt txHash." });

    res.json(workHistory);
  } catch (error) {
    console.error("Feil ved txHash-henting:", error);
    res.status(500).json({ error: "Serverfeil." });
  }
});

// Lagre ny txLog
app.post("/api/txlog", async (req, res) => {
  const { txHash, userId, jobTitle } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Ugyldig bruker-ID." });
  }

  if (!txHash || !userId) {
    return res.status(400).json({ error: "TXID og bruker-ID er påkrevd." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Bruker ikke funnet." });

    const newTxLog = new TxLog({ txHash, user: userId, jobTitle });
    await newTxLog.save();

    res.status(201).json({ message: "Transaksjonslogg lagret", log: newTxLog });
  } catch (error) {
    console.error("Feil ved lagring av txLog:", error);
    res.status(500).json({ error: "Feil ved lagring." });
  }
});

// Godkjenning/avvisning av CV
app.post("/api/txlog/approve", async (req, res) => {
  const { txid, approved, comment, signedBy, userId, jobTitle } = req.body;

  if (!txid || approved === undefined || !comment || !signedBy || !userId || !jobTitle) {
    return res.status(400).json({ error: "Mangler nødvendige data." });
  }

  try {
    // Oppdater txlog
    const txLog = await TxLog.findOne({ txHash: txid });
    if (!txLog) return res.status(404).json({ error: "Transaksjonslogg ikke funnet." });

    const signedAt = new Date();

    txLog.approved = approved;
    txLog.comment = comment;
    txLog.signedBy = signedBy;
    txLog.signedAt = signedAt;
    await txLog.save();

    // Oppdater WorkHistory via txHash
    let updatedWorkHistory = await WorkHistory.findOneAndUpdate(
      { user: userId, txHash: txid },
      {
        $set: {
          approved,
          comment,
          txHash: txid,
          signedBy,
          signedAt
        }
      },
      { new: true }
    );

    // Hvis ikke funnet via txHash, prøv via jobTitle
    if (!updatedWorkHistory) {
      updatedWorkHistory = await WorkHistory.findOneAndUpdate(
        { user: userId, jobTitle },
        {
          $set: {
            approved,
            comment,
            txHash: txid,
            signedBy,
            signedAt
          }
        },
        { new: true }
      );
    }

    if (!updatedWorkHistory) {
      console.warn("Ingen arbeidshistorikk ble oppdatert.");
    }

    res.json({
      message: "Transaksjonslogg og arbeidshistorikk oppdatert",
      txLog,
      updatedWorkHistory
    });
  } catch (error) {
    console.error("Feil ved oppdatering:", error);
    res.status(500).json({ error: "Serverfeil." });
  }
});

// Rute for å hente smartkontraktens adresse
app.get("/api/contract-address", (req, res) => {
    const contractAddress = process.env.CONTRACT_ADDRESS;
  
    if (!contractAddress) {
      return res.status(500).json({ error: "Kontraktsadresse ikke definert i .env" });
    }
  
    res.json({ address: contractAddress });
  });

//Serve ABI-filen
app.use('/backend/bin', express.static(path.join(__dirname, 'bin')));

//Serve frontend-filer
app.use(express.static(path.join(__dirname, "../frontend/public")));

//Fallback for SPA – *alltid til slutt*
//Fanger alle GET-forespørsler som ikke allerede er matchet av tidligere definert routes (API-er eller statiske filer)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public", "index.html"));
});

//Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


/* npm = Node Package Manager

Det er verktøyet som brukes til å installere og håndtere avhengigheter (biblioteker/pakker) i Node.js-prosjekter.

Hvorfor har jeg det?
Fordi prosjektet er bygget med Node.js (backend-serveren kjører med express, mongoose, etc.), prosjektet bruker tredjeparts-pakker som installeres via npm install og
prosjektet trenger et system for å holde orden på hvilke versjoner av disse pakkene som er i bruk.

Prosjektet har installert pakker som:

express (webserver)

mongoose (kobling til MongoDB)

cors, helmet (sikkerhet)

dotenv (miljøvariabler)

Her er de avhengighetene som jeg har hentet til prosjektet (ikke alle er brukt)
+-- axios@1.8.4
+-- bcrypt@5.1.1
+-- cors@2.8.5
+-- dotenv@16.4.7
+-- ethers@6.13.5
+-- express-list-routes@1.2.4
+-- express@4.21.2
+-- http-proxy-middleware@3.0.3
+-- jsonwebtoken@9.0.2
+-- mongodb@6.15.0
`-- mongoose@8.13.1

npm start / eller node server.js for å få kontakt med server i MongoDB */