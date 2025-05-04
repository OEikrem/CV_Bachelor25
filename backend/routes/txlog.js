//Ruter for transaksjonslogg (txlog). Inneholder endepunkter for å lagre og hente transaksjonsdata relatert til blockchain-operasjoner

const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const TxLog = require("../models/TxLog");

//POST: Lagre en ny transaksjonslogg
router.post("/", authenticateToken, async (req, res) => {
    try {
      const { jobTitle, txHash } = req.body;
  
      if (!jobTitle || !txHash) {
        return res.status(400).json({ error: "Mangler jobTitle eller txHash." });
      }
  
      const newLog = new TxLog({
        user: req.user.id, 
        jobTitle,
        txHash
      });
  
      await newLog.save();
      res.status(201).json(newLog);
    } catch (error) {
      console.error("❌ Feil ved lagring av transaksjonslogg:", error);
      res.status(500).json({ error: "Serverfeil ved lagring av transaksjonslogg." });
    }
  });  

//GET: Hent transaksjonslogger for innlogget bruker
router.get("/", authenticateToken, async (req, res) => {
    try {
        const logs = await TxLog.find({ user: req.user.id });

        if (!logs.length) {
            return res.status(404).json({ message: "Ingen transaksjonslogger funnet." });
        }

        res.json(logs);
    } catch (error) {
        console.error("❌ Feil ved henting av transaksjonslogger:", error);
        res.status(500).json({ error: "Serverfeil ved henting av transaksjonslogg." });
    }
});

//GET /api/txlog/:txid – hent én transaksjonslogg basert på TXID (uten krav om innlogging)
router.get("/:txHash", async (req, res) => {
    try {
      const { txHash } = req.params;
      console.log("🔍 Forespurt txHash:", txHash); // Debug
  
      const log = await TxLog.findOne({ txHash });
  
      if (!log) {
        console.log("❌ Ingen treff i DB på:", txHash); // Debug
        return res.status(404).json({ error: "Transaksjon ikke funnet" });
      }
  
      res.json({
        user: log.user,
        jobTitle: log.jobTitle,
        txHash: log.txHash
      });
    } catch (error) {
      console.error("Serverfeil:", error);
      res.status(500).json({ error: "Serverfeil ved oppslag av transaksjon" });
    }
  });  
  
  //POST: Arbeidsgiver godkjenner eller avslår arbeidshistorikk
  router.post("/approve", authenticateToken, async (req, res) => {
    try {
      const { txid, approved, comment, signedBy } = req.body;
  
      if (!txid || typeof approved === "undefined" || !signedBy) {
        return res.status(400).json({ message: "Mangler txid, signatur eller godkjenningsvalg." });
      }
  
      const WorkHistory = require("../models/WorkHistory");
  
      const work = await WorkHistory.findOne({ txHash: txid });
  
      if (!work) {
        return res.status(404).json({ message: "Fant ikke arbeidshistorikk med denne txHash." });
      }
  
      const signedAt = new Date();
  
      // Oppdater arbeidshistorikk
      work.approved = approved;
      work.comment = comment || "";
      work.signedBy = signedBy;
      work.signedAt = signedAt;
      await work.save();
  
      // Oppdater også txLog
      const log = await TxLog.findOne({ txHash: txid });
      if (log) {
        log.approved = approved;
        log.comment = comment || "";
        log.signedBy = signedBy;
        log.signedAt = signedAt;
        await log.save();
      }
  
      res.status(200).json({
        message: "Arbeidshistorikk og transaksjonslogg oppdatert.",
        signedAtFormatted: new Intl.DateTimeFormat('nb-NO').format(signedAt)
      });
    } catch (error) {
      console.error("❌ Feil ved oppdatering:", error);
      res.status(500).json({ message: "Intern serverfeil ved godkjenning." });
    }
  });  

module.exports = router;

