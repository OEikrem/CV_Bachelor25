const fs = require('fs');
const https = require('https');

const url = "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js";
const filePath = "./public/ethers.umd.min.js";

https.get(url, (response) => {
    if (response.statusCode !== 200) {
        console.error(`❌ Feil ved nedlasting: Status ${response.statusCode}`);
        return;
    }

    const file = fs.createWriteStream(filePath);
    response.pipe(file);

    file.on("finish", () => {
        file.close();
        console.log("✅ ethers.umd.min.js lastet ned til /public!");
    });
}).on("error", (err) => {
    console.error(`❌ Feil: ${err.message}`);
});
