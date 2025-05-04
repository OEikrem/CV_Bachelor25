/* login_give.js tilhører login_give.html */

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("errorMessage");

  // Håndter innsending av skjema for pålogging
  loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = emailInput.value.trim();
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      // Basic validation: Ensure email, username, and password are provided
      if (!email || !username || !password) {
          errorMessage.textContent = "Vennligst fyll ut e-post, brukernavn og passord.";
          return;
      }

      try {
        const response = await fetch("http://localhost:3000/api/auth/employer/login", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, username, password })  // Inkluderer e-post og brukernavn i request
      });

      // Sjekk om response ikke er ok
      if (!response.ok) {
          const resultText = await response.text(); // Les som tekst først for å inspisere feilsider
          console.error("Error response from server:", resultText);
          errorMessage.textContent = "Feil under innlogging. Vennligst prøv igjen.";
          return;
      }

      // Parse response som JSON hvis ok
      const result = await response.json();
      
      if (result.token) {
          localStorage.setItem("employerToken", result.token); // Lagre JWT token
          window.location.replace("dashboard_give.html"); // Redirect to dashboard_give
      } else {
          errorMessage.textContent = result.message || "Feil under innlogging.";
      }

      } catch (error) {
          console.error("Error during employer login:", error);
          errorMessage.textContent = "Det oppstod en feil under innlogging.";
      }
  });
});
