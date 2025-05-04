// Middleware for autentisering. Sjekker om brukeren er logget inn og har gyldig token før de får tilgang til beskyttede ruter
   
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    // Hent token fra Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({ message: "Ingen autentiseringstoken" });
    }

    try {
        // Logg token-verdien for debugging
        console.log("Token received:", token); // DEBUG: denne koden er kun for testing, bør settes inaktiv ved lanesering for det fyller terminalvinduet med gjengitt token for hvert api

        // Verifiser token ved hjelp av JWT secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Logg den dekodede tokenen for debugging
        console.log("Decoded token:", decoded); // DEBUG: denne koden er kun for testing, bør settes inaktiv ved lanesering for det fyller terminalvinduet med gjengitt token for hvert api

        // Fest de dekodede brukerdataene til forespørselsobjektet
        req.user = decoded;

        // Fortsett til neste middleware eller rutebehandler
        next();
    } catch (error) {
        // Håndter hvis tokenet er ugyldig
        return res.status(401).json({ message: "Ugyldig token" });
    }
}

module.exports = authMiddleware;
