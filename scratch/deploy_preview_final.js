const ftp = require("basic-ftp");
const path = require("path");

async function deploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.chaveirorafael",
            password: "1q2w3e4r@@@SK",
            secure: false
        });

        const localFile = path.join(__dirname, "stitch_final.html");
        const localHtaccess = path.join(__dirname, ".htaccess");

        // 1. Upload para o preview
        console.log("Uploading to /preview/...");
        await client.ensureDir("/preview");
        await client.uploadFrom(localFile, "chaveiro-rafael-v4-dark.html");

        // 2. Upload direto para a raiz
        console.log("Uploading to root as chaveiro-perto-de-mim.html...");
        await client.cd("/");
        await client.uploadFrom(localFile, "chaveiro-perto-de-mim.html");
        
        // 3. Upload do .htaccess para a raiz
        console.log("Uploading .htaccess to root...");
        await client.uploadFrom(localHtaccess, ".htaccess");
        
        console.log("SUCCESS: Everything updated with clean URLs!");

    } catch (err) {
        console.log(err);
    }
    client.close();
}

deploy();
