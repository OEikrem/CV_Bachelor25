/* script.js tilhører usersite.html */

let downloadedWorkHistory = []; // lagre det som hentes

document.addEventListener("DOMContentLoaded", () => {
    console.log("script.js loaded");

    setupWorkHistoryForm();
    setupFetchWorkHistoryButton();
    setupBlockchainUploadButton();
    setupDeleteUserButton();
});

// Form: Legg til arbeidshistorikk
function setupWorkHistoryForm() {
    const form = document.getElementById("historyForm");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Hent verdiene fra skjemaet
        const jobTitle = document.getElementById("jobTitle").value.trim();
        const roleDescription = document.getElementById("roleDescription").value.trim(); // Hent rollebeskrivelsen
        const company = document.getElementById("company").value.trim();
        const years = document.getElementById("years").value.trim();
        const token = localStorage.getItem("token");

        if (!jobTitle || !roleDescription || !company || !years || !token) {  // Sjekk om alle nødvendige felt er fylt ut
            alert("Fyll ut alle felter og vær logget inn.");
            return;
        }

        try {
            // Send POST-forespørselen til serveren for å lagre arbeidshistorikk
            const response = await fetch("http://localhost:3000/api/workhistories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` // Send tokenet som Authorization header
                },
                body: JSON.stringify({ jobTitle, roleDescription, company, years }) // Passer på at dette er et gyldig JSON-objekt
            });

            // Hvis serveren svarer OK, vis en bekreftelse
            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            alert("✅ Arbeidshistorikk lagret!");
            form.reset(); // Tøm skjemaet etter lagring
            fetchWorkHistory(); // Hent og vis arbeidshistorikk på nytt
        } catch (err) {
            console.error("Feil:", err);
            alert("Kunne ikke lagre arbeidshistorikk.");
        }
    });
}

// Hent arbeidshistorikk
function setupFetchWorkHistoryButton() {
    const btn = document.getElementById("fetchHistoryBtn");
    if (btn) {
        btn.addEventListener("click", fetchWorkHistory);
    }
}

async function fetchWorkHistory() {
    const token = localStorage.getItem("token"); // Hent token fra localStorage
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    try {
        const response = await fetch("http://localhost:3000/api/workhistories", {
            headers: { 
                Authorization: `Bearer ${token}` // Send tokenet som Authorization header
            }
        });

        const data = await response.json();

        console.log("Hentet arbeidshistorikk:", data);

        if (!response.ok) {
            throw new Error(data.message || "Feil ved henting");
        }

        downloadedWorkHistory = data;
        data.forEach(entry => {
            const li = document.createElement("li");

            li.innerHTML = `
            <strong>${entry.jobTitle}</strong> – ${entry.company} (${entry.years})
            <br>Rollebeskrivelse: ${entry.roleDescription}

            ${entry.txHash ? `<br>🔗 <a href="https://sepolia.etherscan.io/tx/${entry.txHash}" target="_blank">${entry.txHash.slice(0, 12)}...</a>` : ""}

            ${entry.approved !== undefined ? `<br>Godkjent: ${entry.approved ? "✅ Ja" : "❌ Nei"}` : ""}

            ${entry.comment ? `<br><em>Kommentar fra arbeidsgiver:</em> "${entry.comment}"` : ""}

            ${entry.signedBy ? `<br>Signert av: ${entry.signedBy}` : ""}

            ${entry.signedAt ? `<br><small>Signert: ${new Date(entry.signedAt).toLocaleDateString("nb-NO")}</small>` : ""}
            `;

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "🗑️ Slett";
            deleteBtn.addEventListener("click", () => deleteWorkEntry(entry._id));
            li.appendChild(deleteBtn);

            list.appendChild(li);
        });
    } catch (err) {
        console.error("Feil:", err);
        list.innerHTML = "<li>Kunne ikke hente arbeidshistorikk.</li>";
    }
}

// Slett arbeidshistorikk
async function deleteWorkEntry(id) {
    const token = localStorage.getItem("token");
    if (!confirm("Er du sikker på at du vil slette denne posten?")) return;

    try {
        const res = await fetch(`http://localhost:3000/api/workhistories/${id}`, {
            method: "DELETE",
            headers: { 
                Authorization: `Bearer ${token}` // Send tokenet som Authorization header
            }
        });

        if (!res.ok) throw new Error("Sletting feilet");
        alert("✅ Slettet!");
        fetchWorkHistory();
    } catch (err) {
        console.error("Slettefeil:", err);
        alert("Kunne ikke slette.");
    }
}

// Blockchain-opplasting
function setupBlockchainUploadButton() {
    const btn = document.getElementById("uploadBlockchainBtn");
    if (btn) {
        btn.addEventListener("click", () => {
            const selected = getSelectedWorkHistory();
            localStorage.setItem("selectedWorkHistories", JSON.stringify(selected));
            window.location.href = "blockchain.html";
        });
    }
}

// Hent valgte arbeidshistorikk-IDer
function getSelectedWorkHistory() {
    const checkboxes = document.querySelectorAll(".workHistoryCheckbox:checked");
    return Array.from(checkboxes).map(cb => cb.getAttribute("data-id"));
}

// Slett hele brukeren
function setupDeleteUserButton() {
    const btn = document.getElementById("deleteUserBtn");
    if (!btn) return;

    btn.addEventListener("click", async () => {
        if (!confirm("Slette hele brukeren og data? Dette kan ikke angres.")) return;

        const token = localStorage.getItem("token");
        try {
            const res = await fetch("http://localhost:3000/api/user", {
                method: "DELETE",
                headers: { 
                    Authorization: `Bearer ${token}` // Send tokenet som Authorization header
                }
            });

            if (!res.ok) throw new Error("Feil ved sletting");

            alert("Bruker slettet.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
        } catch (err) {
            console.error("Sletting av bruker feilet:", err);
            alert("Kunne ikke slette bruker.");
        }
    });
}

document.getElementById("downloadCSVBtn").addEventListener("click", () => {
    if (!downloadedWorkHistory.length) {
        alert("Ingen arbeidshistorikk tilgjengelig for eksport.");
        return;
    }

    const csvRows = [
        ["Jobbtittel", "Firma", "År", "Rollebeskrivelse", "Godkjent", "Kommentar", "Signert av", "Signert dato", "TX Hash"]
    ];

    downloadedWorkHistory.forEach(entry => {
        csvRows.push([
            entry.jobTitle || "",
            entry.company || "",
            entry.years || "",
            entry.roleDescription || "",
            entry.approved !== undefined ? (entry.approved ? "Ja" : "Nei") : "",
            entry.comment || "",
            entry.signedBy || "", 
            entry.signedAt ? new Date(entry.signedAt).toLocaleDateString("nb-NO") : "",
            entry.txHash || ""
        ]);
    });

    const csvContent = csvRows.map(row => row.map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "arbeidshistorikk.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

