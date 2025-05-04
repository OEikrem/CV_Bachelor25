/*Blockchain.js tilhører blockchain.html*/

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  console.log("Token received:", token);

  if (!token) {
    alert("Du må være logget inn for å laste opp arbeidshistorikk.");
    window.location.href = "login.html";  // Redirect til login om token ikke eksisterer
    return;
  }

  console.log("User is authenticated");
  console.log("blockchain.js loaded");
  displayWorkHistory(); // Vi liste over arbeidshistorikken
  loadTransactionLogs(); // Vis tidligere transaksjoner
});

// Viser arbeidshistorikk for innlogget bruker fra backend
async function displayWorkHistory() {
  const token = localStorage.getItem("token");
  const workHistoryList = document.getElementById("workHistoryList");
  workHistoryList.innerHTML = "";

  if (!token) {
    alert("Du må være logget inn for å hente arbeidshistorikk.");
    window.location.href = "login.html";  // Omdiriger til pålogging hvis token ikke er funnet
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/workhistories", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("Feil ved henting av arbeidshistorikk");
    const workHistories = await response.json();

    if (!Array.isArray(workHistories) || workHistories.length === 0) {
      workHistoryList.innerHTML = "<li>Ingen arbeidshistorikk funnet.</li>";
      return;
    }

    workHistories.forEach(entry => {
      console.log("entry fra backend:", entry);
      if (!entry.jobTitle || !entry.company || !entry.years) {
        console.warn("Ugyldig arbeidshistorikk:", entry);
        return; // Hopp over ugyldige føringer
      }

      const item = document.createElement("li");
      item.innerHTML = `
        <input type="checkbox" class="workHistoryCheckbox" data-id="${entry._id}" checked>
        ${entry.jobTitle} - ${entry.company} (${entry.years}) - ${entry.roleDescription || 'Ingen beskrivelse'}
      `;
      workHistoryList.appendChild(item);
    });

  } catch (error) {
    console.error("❌ Feil ved lagring av transaksjonslogg:", error.message);
    workHistoryList.innerHTML = "<li>Kunne ikke hente arbeidshistorikk. Prøv igjen senere.</li>";
  }
}

async function getWorkHistoryById(id) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Du må være logget inn for å hente arbeidshistorikk.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/workhistories/${id}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Server responded with:", text);
      throw new Error(`Feil ved henting av arbeidshistorikk. Status: ${response.status}`);
    }

    const contentType = response.headers.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Response is not JSON:", text);
      throw new Error("Serveren svarte ikke med JSON");
    }

    const entry = await response.json();

    // Sjekk om oppføringen er gyldig og inneholder alle obligatoriske felt
    if (!entry.jobTitle || !entry.company || !entry.years) {
      console.warn("Ugyldig arbeidshistorikk:", entry);
      return;  // Hopp over denne oppføringen hvis den er ugyldig
    }

    return entry;
  } catch (error) {
    console.error("Error fetching work history by ID:", error);
  }
}

// Hent kontraktsadresse fra backend
async function getContractAddress() {
  try {
    const response = await fetch("http://localhost:3000/api/contract-address"); // Juster API URL etter behov
    if (!response.ok) throw new Error("Kunne ikke hente kontraktsadresse.");
    const { address } = await response.json(); // Forutsetter at svaret er et JSON-objekt med 'adresse'-feltet
    console.log("✅ Hentet kontraktsadresse:", address);
    return address;
  } catch (error) {
    console.error("Error fetching contract address:", error);
    alert("Feil ved henting av kontraktsadresse.");
    return null;
  }
}

// Hent ABI fra backend
async function getContractABI() {
  try {
    const response = await fetch("http://localhost:3000/backend/bin/WorkHistoryContract.abi");
    if (!response.ok) throw new Error("Kunne ikke hente ABI-filen.");
    const abiText = await response.text();
    return JSON.parse(abiText);
  } catch (error) {
    console.error("Error fetching ABI:", error);
    alert("Feil ved henting av ABI-fil.");
  }
}

async function loadTransactionLogs() {
  const token = localStorage.getItem("token");
  const txLogList = document.getElementById("txLogList");

  if (!token) {
    console.warn("Ingen token funnet – laster ikke transaksjonslogger.");
    txLogList.innerHTML = "<li>Du må være logget inn for å se transaksjoner.</li>";
    return;
  }

  if (!txLogList) return;

  try {
    const response = await fetch("http://localhost:3000/api/txlog", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("Kunne ikke hente transaksjonslogger");

    const logs = await response.json();

    if (!logs.length) {
      txLogList.innerHTML = "<li>Ingen transaksjoner funnet.</li>";
      return;
    }

    txLogList.innerHTML = "";
    // Fyller listeelementet med jobbtittel og en klikkbar lenke til transaksjonen på Etherscan (forkorter txHash til 12 tegn for visuell klarhet)
    logs.forEach(log => {
      const item = document.createElement("li");
      item.innerHTML = `
        <strong>${log.jobTitle}</strong>: 
        <a href="https://sepolia.etherscan.io/tx/${log.txHash}" target="_blank">${log.txHash.slice(0, 12)}...</a> 
      `;
      txLogList.appendChild(item);
    });

  } catch (error) {
    console.error("Feil ved henting av transaksjonslogger:", error);
    txLogList.innerHTML = "<li>Kunne ikke laste transaksjoner.</li>";
  }
}

// Last opp arbeidshistorikk til Sepolia
document.getElementById("uploadBtn").addEventListener("click", async () => {
  const selected = document.querySelectorAll(".workHistoryCheckbox:checked");
  const txList = document.getElementById("txList");
  txList.innerHTML = "";

  if (selected.length === 0) {
    alert("Vennligst velg arbeidshistorikk å laste opp.");
    return;
  }

  const contractAddress = await getContractAddress();
  if (!contractAddress) {
    alert("Kontraktsadresse er ikke tilgjengelig. Kan ikke laste opp til blockchain.");
    return;
  }

  try {
    const contractABI = await getContractABI();

    if (!window.ethereum) {
      alert("Du må installere MetaMask eller andre Ethereum-kompatible browser extension.");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    for (const checkbox of selected) {
      const workHistoryId = checkbox.getAttribute("data-id");
      const entry = await getWorkHistoryById(workHistoryId);

      console.log("Oppføring av arbeidshistorikk:", entry);

      if (!entry || !entry.jobTitle || !entry.company || !entry.years) {
        console.warn("Ugyldig arbeidshistorikk:", entry);
        continue;
      }

      try {
        const tx = await contract.addWorkHistory(
          entry.jobTitle,
          entry.company,
          entry.years,
          entry.roleDescription || '',
          { gasLimit: 300000 }
        );

        const receipt = await tx.wait();
        const hash = receipt.transactionHash;
        await saveTxHashToWorkHistory(entry._id, hash);

        // Motta bekreftelse på vellykket opplasting
        confirm(`✅ Arbeidshistorikk for "${entry.jobTitle}" ble lastet opp.\nTX Hash: ${hash.slice(0, 12)}...`);

        console.log("✅ Din TX Hash:", hash);
        await logTransaction(hash, entry.jobTitle);

        txList.innerHTML += `<li>TX-hash: <a href="https://sepolia.etherscan.io/tx/${hash}" target="_blank">${hash}</a></li>`;
      } catch (txError) {
        console.error("❌ Transaksjon mislyktes:", txError);
        txList.innerHTML += "<li>❌ Noe gikk galt med transaksjonen.</li>";
      }
    }

    if (txList.innerHTML === "") {
      txList.innerHTML = "<li>Ingen gyldige arbeidshistorikker ble lastet opp.</li>";
    }

  } catch (error) {
    console.error("Feil ved opplasting til blockchain:", error);
    txList.innerHTML = "<li>❌ Noe gikk galt. Prøv igjen.</li>";
  }
});

//Loggfør transaksjonen i databasen for fremtidig innsyn og kontroll
async function logTransaction(txHash, jobTitle) {
  const token = localStorage.getItem("token");

  try {
    console.log("Logger transaksjon:", txHash, jobTitle);
    const response = await fetch("http://localhost:3000/api/txlog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ txHash, jobTitle })
    });

    if (!response.ok) throw new Error("Kunne ikke logge transaksjon");

    const result = await response.json();
    console.log("✅ Transaksjon loggført:", result);
  } catch (error) {
    console.error("Error logging transaksjon:", error);
  }
}

async function saveTxHashToWorkHistory(id, txHash) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`http://localhost:3000/api/workhistories/${id}/txhash`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ txHash })
    });

    const data = await res.json();
    console.log("🔗 txHash lagret til arbeidshistorikk:", data);
  } catch (err) {
    console.error("Kunne ikke lagre txHash:", err);
  }
}

