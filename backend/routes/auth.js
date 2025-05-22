// Ruter for autentisering (auth). Inneholder endepunkter for innlogging, registrering og token-håndtering. 
// Kode inspirert fra https://dvmhn07.medium.com/jwt-authentication-in-node-js-a-practical-guide-c8ab1b432a49

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Registrering av ny bruker
router.post("/register", async (req, res) => {
    const { email, username, password, role } = req.body;
    
    try {
        // Sjekk om brukeren finnes
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: "Bruker finnes allerede" });
        }

        // Lag ny bruker
        const user = new User({ email, username, password, role });
        await user.save();

        res.status(201).json({ message: "Bruker registrert" });
    } catch (error) {
        // Hvis det er en valideringsfeil (f.eks. passordstyrke), send spesifikk feil
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: "Valideringsfeil" });
        }
        console.error(error);
        res.status(500).json({ message: "Feil under registrering" });
    }
});

// Innlogging arbeidssøker
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "Bruker ikke funnet" });
        }

        const isMatch = await user.comparePassword(password); // Sammenlign gitt passord med hashet passord
        if (!isMatch) {
            return res.status(400).json({ message: "Feil passord" });
        }

        // Generer JWT-token
        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },  // Inkluderer rolle i payload
            process.env.JWT_SECRET,
            { expiresIn: '1h' }  // Angir utløpstid for token
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Feil under innlogging" });
    }
});

// Innlogging arbeidsgiver
router.post("/employer/login", async (req, res) => {
    const { email, username, password } = req.body;

    try {
        const employer = await User.findOne({ email, username });
        if (!employer) {
            return res.status(400).json({ error: "E-post eller brukernavn er feil" });
        }

        if (employer.role !== "arbeidsgiver") {
            return res.status(403).json({ error: "Denne innloggingen er kun for arbeidsgivere." });
        }

        const isMatch = await bcrypt.compare(password, employer.password); // Sammenlign gitt passord med hashet passord
        if (!isMatch) {
            return res.status(400).json({ error: "Feil passord" });
        }

        const token = jwt.sign({ id: employer._id, email: employer.email, username: employer.username }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token }); // Returner token til frontend 
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Noe gikk galt ved innlogging" });
    }
});


module.exports = router;
