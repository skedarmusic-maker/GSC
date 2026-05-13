
import * as ftp from "basic-ftp";

async function finalCleanupAndDeploy() {
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

        console.log("--- LIMPANDO E ORGANIZANDO O SERVIDOR ---");

        // 1. Forçar ir para a raiz absoluta
        await client.cd("/");
        
        // 2. Definir o caminho correto do site
        const targetPath = "/public_html/preview";

        console.log(`Subindo arquivos para: ${targetPath}`);
        
        // Limpar se já existir algo errado e criar do zero
        await client.ensureDir(targetPath);
        await client.clearWorkingDir(); // Remove lixo que possa estar lá
        
        // Subir os arquivos da pasta 'out' do Pagani
        // Nota: Ajuste o caminho se estiver rodando da GSC
        await client.uploadFromDir("Pagani Custom/out");

        console.log("\n✅ AGORA VAI! Tudo limpo e no lugar certo.");
        console.log("LINK OFICIAL: https://paganicustom.com.br/preview/protecao-de-farol/");
    }
    catch(err) {
        console.error("Erro no processo:", err);
    }
    finally {
        client.close();
    }
}

finalCleanupAndDeploy();
