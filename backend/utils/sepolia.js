/* Hjelpefunksjoner og konfigurasjon for Sepolia testnett. Inneholder for eksempel RPC-endepunkt, nettverks-ID, kontraktadresse og instansiering av web3/ethers-klienter
Jobb med smartkontrakter på Sepolia
Funksjoner for å hente kontrakten, snakke med den, eller hente events
En ABI/contract interaction-flow på backend (f.eks. for verifisering, henting av data fra kontrakten, etc.) */

const { ethers } = require("ethers");

// Funksjon for å laste opp arbeidshistorikk til Sepolia
async function uploadToSepolia(workHistory, privateKey) {
    try {
        // Bruk brukerens private nøkkel for å lage en wallet
        const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/"); // Bruk offentlig Sepolia RPC
        const wallet = new ethers.Wallet(privateKey, provider);

        // Definer kontraktens adresse og ABI
        const contractAddress = "YOUR_CONTRACT_ADDRESS";  // Bytt ut med din kontraktsadresse
        const contractABI = [
            "function addWorkHistory(string memory jobTitle, string memory company, string memory years) public"
        ];

        // Lag kontraktinstans
        const contract = new ethers.Contract(contractAddress, contractABI, wallet);

        // Last opp arbeidshistorikk
        const tx = await contract.addWorkHistory(
            workHistory.jobTitle,
            workHistory.company,
            workHistory.years
        );
        await tx.wait();  // Vent på at transaksjonen er mined
        return tx.hash;  // Returner transaksjons-ID (txid)
    } catch (error) {
        throw new Error("Feil ved opplasting til Sepolia: " + error.message);
    }
}

module.exports = { uploadToSepolia };
