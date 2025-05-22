// Ruter for arbeidshistorikk (workhistory). Inneholder endepunkter for å opprette, hente, oppdatere og slette jobberfaringer for brukere – eventuelt med støtte for verifisering

const express = require("express");
const WorkHistory = require("../models/WorkHistory");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

//GET: Hent arbeidshistorikk basert på txHash (offentlig)
router.get("/tx/:txHash", async (req, res) => {
  try {
    const { txHash } = req.params;
    const workHistory = await WorkHistory.findOne({ txHash });

    if (!workHistory) {
      return res.status(404).json({ message: "Ingen arbeidshistorikk funnet for gitt txHash." });
    }

    res.json(workHistory);
  } catch (error) {
    console.error("Feil ved henting av arbeidshistorikk via txHash:", error);
    res.status(500).json({ error: "Serverfeil ved henting av arbeidshistorikk." });
  }
});

//GET: Hent spesifikk arbeidshistorikk etter ID (beskyttet)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;

    const workHistory = await WorkHistory.findOne({ _id: id, user: userId });

    if (!workHistory) {
      return res.status(404).json({ error: "Arbeidshistorikk ikke funnet" });
    }

    res.json(workHistory);
  } catch (error) {
    console.error("Feil ved henting av arbeidshistorikk etter ID:", error);
    res.status(500).json({ error: "Serverfeil ved henting av arbeidshistorikk" });
  }
});

//POST: Lagre ny arbeidshistorikk (beskyttet)
router.post("/", authMiddleware, async (req, res) => {
  const { jobTitle, roleDescription, company, years } = req.body;
  const userId = req.user.id;

  try {
    const newWorkHistory = new WorkHistory({
      jobTitle,
      roleDescription,
      company,
      years,
      user: userId,
    });

    await newWorkHistory.save();
    res.status(201).json({ message: "Arbeidshistorikk lagret!" });
  } catch (error) {
    console.error("Feil ved lagring:", error);
    res.status(500).json({ message: "Feil ved lagring av arbeidshistorikk", error });
  }
});

//GET: Hent ALLE arbeidshistorikkposter for gitt brukerID (beskyttet)
router.get("/user/:userId", authMiddleware, async (req, res) => {
  const { userId } = req.params;

  // Sjekk at bruker kun får hente sin egen historikk
  if (req.user.id !== userId) {
    return res.status(403).json({ message: "Ingen tilgang til denne brukerens historikk." });
  }

  try {
    const history = await WorkHistory.find({ user: userId });

    if (!history || history.length === 0) {
      return res.status(404).json({ message: "Ingen arbeidshistorikk funnet." });
    }

    res.status(200).json(history);
  } catch (err) {
    console.error("Feil ved henting av arbeidshistorikk:", err);
    res.status(500).json({ message: "Kunne ikke hente arbeidshistorikk." });
  }
});

router.patch("/:id/txhash", authMiddleware, async (req, res) => {
  const { txHash } = req.body;
  const workHistoryId = req.params.id;
  const userId = req.user.id;

  if (!txHash) return res.status(400).json({ error: "txHash mangler" });

  try {
    const updated = await WorkHistory.findOneAndUpdate(
      { _id: workHistoryId, user: userId },
      { $set: { txHash } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Arbeidshistorikk ikke funnet eller du mangler tilgang" });
    }

    res.json({ message: "txHash lagret", data: updated });
  } catch (error) {
    console.error("Feil ved oppdatering av txHash:", error);
    res.status(500).json({ error: "Serverfeil" });
  }
});

module.exports = router;
