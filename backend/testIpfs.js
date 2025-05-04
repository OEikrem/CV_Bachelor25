// Testfunksjon for å laste opp en eksempel-CV til IPFS. Bruker ipfs-http-client og en offentlig node (https://ipfs.io). 
// Denne er ment som demo eller utviklingsverktøy. Gikk bort fra dette

async function testUpload() {
    const { create } = await import("ipfs-http-client"); // Bruk dynamic import

    const ipfs = create({ url: "https://ipfs.io" }); // Bruk en offentlig IPFS-node
    const sampleData = { jobTitle: "CTO", company: "Esso", years: "2002-2020" };

    try {
        const { path } = await ipfs.add(JSON.stringify(sampleData));
        console.log("✅ Test: CV lastet opp til IPFS med hash:", path);
    } catch (error) {
        console.error("❌ Feil ved IPFS-opplasting:", error);
    }
}

testUpload();