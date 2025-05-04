/* dashboard_give.js tilhører dashboard_give.html */

document.addEventListener("DOMContentLoaded", () => {
    const fetchBtn = document.getElementById("fetchBtn");
    const txHashInput = document.getElementById("txid"); // input-id for enkelhet
    const errorMessage = document.getElementById("errorMessage");
    const approveBtn = document.getElementById("approveBtn");
    const rejectBtn = document.getElementById("rejectBtn");
    const commentInput = document.getElementById("comment");
    const signedByInput = document.getElementById("signedBy");
    const historyContainer = document.getElementById("workHistoryContainer");

    let jobTitle = "";
    let userId = "";
    let currentTxHash = ""; // brukes ved godkjenning/avslag

    // Hent transaksjonsdata og arbeidshistorikk
    fetchBtn.addEventListener("click", async () => {
        const txHash = txHashInput.value.trim();
        if (!txHash) {
            errorMessage.textContent = "Vennligst oppgi en gyldig transaksjonshash (txHash).";
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/txlog/${txHash}`);
            if (!response.ok) throw new Error("Fant ikke transaksjonen.");
            const txData = await response.json();

            userId = txData.user;
            jobTitle = txData.jobTitle;
            currentTxHash = txHash;
            errorMessage.textContent = "";
            txHashInput.value = "";

            alert(`Funnet arbeidssøkerens CV med jobbtittel: ${jobTitle}`);

            await fetchWorkHistoryByTxHash(txHash);
        } catch (error) {
            console.error("Feil ved henting av TxID:", error);
            errorMessage.textContent = "Feil ved henting av TxID";
        }
    });

    async function fetchWorkHistoryByTxHash(txHash) {
        try {
          const response = await fetch(`http://localhost:3000/api/workhistory/tx/${txHash}`);
          if (!response.ok) throw new Error("Kunne ikke hente arbeidshistorikken.");
          const entry = await response.json();
      
          displaySingleWorkHistory(entry);
        } catch (error) {
          console.error("Feil ved henting av arbeidshistorikk:", error);
          historyContainer.innerHTML = "<p>Kunne ikke hente arbeidshistorikk.</p>";
        }
      }
      
      function displaySingleWorkHistory(entry) {
        historyContainer.innerHTML = "";
      
        const item = document.createElement("div");
        item.classList.add("history-entry");
        item.innerHTML = `
          <strong>${entry.jobTitle}</strong> hos ${entry.company}<br/>
          Fra: ${entry.startDate || "ukjent"} – Til: ${entry.endDate || "ukjent"}<br/>
          Beskrivelse: ${entry.roleDescription || "ikke oppgitt"}<br/>
          Godkjent: ${entry.approved ? "✅ Ja" : "❌ Nei"}<br/>
          Kommentar: ${entry.comment || "Ingen kommentar"}<br/>
          Signatur: ${entry.signedBy || ""}<br/>
          🔗 <a href="https://sepolia.etherscan.io/tx/${entry.txHash}" target="_blank">${entry.txHash.slice(0, 10)}...</a>
        `;
        historyContainer.appendChild(item);
      }      

    /* Vis arbeidshistorikk i grensesnittet - denne koden er ikke i bruk - ment kun for testing men beholdes for evt senere implementering
    function displayWorkHistory(history) {
        historyContainer.innerHTML = "";

        if (history.length === 0) {
            historyContainer.innerHTML = "<p>Ingen arbeidshistorikk funnet.</p>";
            return;
        }

        history.forEach(entry => {
            const item = document.createElement("div");
            item.classList.add("history-entry");
            item.innerHTML = `
                <strong>${entry.jobTitle}</strong> hos ${entry.company}<br/>
                Fra: ${entry.startDate} – Til: ${entry.endDate}<br/>
                Beskrivelse: ${entry.description}
                <hr/>
            `;
            historyContainer.appendChild(item);
        });
    }
*/
    // Håndter godkjenning/avslag
    async function handleTransactionApproval(approved) {
        const comment = commentInput.value.trim();
        const signedBy = signedByInput.value.trim();

        if (!signedBy || !comment || !currentTxHash) {
            alert("Vennligst fyll ut kommentar, signatur og hent TX først.");
            return;
        }

        try {
            const response = await fetch("/api/txlog/approve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("employerToken")}`
                  },
                body: JSON.stringify({
                    txid: currentTxHash, // send txHash som "txid" for kompatibilitet
                    approved,
                    comment,
                    signedBy,
                    userId,
                    jobTitle
                })
            });

            const result = await response.json();
            if (response.ok) {
                alert(`CV er ${approved ? "godkjent" : "ikke godkjent"} og lagret!`);
            } else {
                alert("Feil ved lagring: " + result.message);
            }
        } catch (error) {
            console.error("Feil ved lagring:", error);
            alert("Det oppstod en feil ved lagring.");
        }
    }

    approveBtn.addEventListener("click", () => handleTransactionApproval(true));
    rejectBtn.addEventListener("click", () => handleTransactionApproval(false));
});
