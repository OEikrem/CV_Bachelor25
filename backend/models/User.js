// Databasemodell for brukere. Inneholder informasjon som e-post, passord og roller. 
// Brukes for autentisering, autorisering og brukerhåndtering
// Kode inspirert fra: https://dvmhn07.medium.com/jwt-authentication-in-node-js-a-practical-guide-c8ab1b432a49 

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: { 
        type: String, 
        required: true, 
        enum: ['arbeidssøker', 'arbeidsgiver']
    }
});

// Hash passord før bruker blir lagret
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);

    // Kun logg i utviklingsmiljø
    if (process.env.NODE_ENV === "development") {
        console.log("Generert salt:", salt);
        console.log("Generert hash:", hash);
    }

    this.password = hash;
    next();
});

// Sammenlign gitt passord med hashet passord
userSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
