const ftp = require("basic-ftp");

async function list() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.chaveirorafael",
            password: "1q2w3e4r@@@SK",
            secure: false
        });

        console.log("Root content:");
        console.log(await client.list("/"));

        console.log("public_html content:");
        console.log(await client.list("/public_html"));

        console.log("preview content:");
        console.log(await client.list("/public_html/preview"));

    } catch (err) {
        console.log(err);
    }
    client.close();
}

list();
