/* login.js tilhører login.html */

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorMessage = document.getElementById("error-message");

    // Håndter innsending av skjema for pålogging
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !username || !password) {
            errorMessage.textContent = "Vennligst fyll ut alle feltene.";
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();
            if (response.ok) {
                // Lagre token i localStorage
                localStorage.setItem("token", result.token);
                alert("Du er logget inn!");
                window.location.replace("usersite.html");  // Redirect til usersite etter login
            } else {
                errorMessage.textContent = result.message || "Feil under pålogging.";
            }

        } catch (error) {
            console.error("Error during login:", error);
            errorMessage.textContent = "Det oppstod en feil under pålogging.";
        }
    });
});
