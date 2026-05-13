
import * as ftp from "basic-ftp";

async function finalAbsoluteDeploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.paganicustomsite",
            password: "1q2w3e4r@@@SK",
            port: 21,
            secure: false
        });

        console.log("--- DEPLOY NA RAIZ REAL DO SITE ---");

        // VAMOS PARA A RAIZ ONDE O SITE ESTÁ
        await client.cd("/");
        
        const remoteFolder = "preview";

        console.log(`Subindo arquivos para: /${remoteFolder}`);
        await client.ensureDir(remoteFolder);
        await client.clearWorkingDir();
        
        // Caminho local da sua pasta out
        await client.uploadFromDir("c:/Users/Skedar/Desktop/IA - SITES/Pagani Custom/out");

        console.log("\n✅ DEPLOY FINALIZADO NA RAIZ!");
        console.log("LINK: https://paganicustomfloripa.com.br/preview/protecao-de-farol/");
    }
    catch(err) {
        console.error("Erro:", err.message);
    }
    finally {
        client.close();
    }
}

finalAbsoluteDeploy();
