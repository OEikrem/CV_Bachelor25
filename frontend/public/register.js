/* register.js tilhører register.html */

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("registerForm").addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        
        // Hent valgt brukerrolle (arbeidssøker eller arbeidsgiver)
        const userType = document.querySelector('input[name="userType"]:checked')?.value;

        if (!userType) {
            document.getElementById("error-message").textContent = "Vennligst velg brukertype (arbeidssøker eller arbeidsgiver).";
            return;
        }

        const emailPattern = /^[^@]+@[^@]+\.[^@]+$/;
        if (!emailPattern.test(email)) {
            document.getElementById("error-message").textContent = "Vennligst skriv inn en gyldig e-postadresse.";
            return;
        }

        if (password.length < 6) { // Denne bør endres til 12.
            document.getElementById("error-message").textContent = "Passordet må være minst 6 tegn langt.";
            return;
        }

        // Send data inkludert valgt rolle (arbeidssøker/arbeidsgiver)
        const data = { email, password, role: userType, username };

        try {
            // Send POST-forespørsel til backend for registrering
            const response = await fetch("http://localhost:3000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (response.ok) {
                alert("Bruker registrert! Logg inn nå.");
                if (userType === "employer") {
                    window.location.href = "login_give.html";
                } else {
                    window.location.href = "login.html";
                }
            } else {
                document.getElementById("error-message").textContent = "Feil: " + (result.message || "Ukjent feil");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Feil under registrering.");
        }
    });
 
});
