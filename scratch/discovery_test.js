
import * as ftp from "basic-ftp";
import { Readable } from "stream";

async function discoveryTest() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.paganicustomsite",
            password: "1q2w3e4r@@@SK",
            port: 21,
            secure: false
        });

        const content = "<h1>Teste de Conexao Antigravity</h1><p>Se voce esta vendo isso, esta pasta eh a correta.</p>";
        
        console.log("--- TESTE DE DESCOBERTA DE CAMINHO ---");

        // Teste 1: Na raiz da public_html que vimos
        console.log("Subindo teste 1 para /public_html/...");
        await client.uploadFrom(Readable.from(content), "/public_html/teste-antigravity.html");

        // Teste 2: Tentar achar uma pasta domains
        const list = await client.list("/");
        if (list.some(i => i.name === 'domains')) {
            console.log("Pasta 'domains' encontrada! Subindo teste 2 para /domains/paganicustom.com.br/public_html/...");
            await client.ensureDir("/domains/paganicustom.com.br/public_html");
            await client.uploadFrom(Readable.from(content), "/domains/paganicustom.com.br/public_html/teste-antigravity.html");
        }

        console.log("\n--- TESTE CONCLUIDO ---");
        console.log("Tente abrir estes links:");
        console.log("1. https://paganicustom.com.br/teste-antigravity.html");
    }
    catch(err) {
        console.error("Erro no teste:", err.message);
    }
    finally {
        client.close();
    }
}

discoveryTest();
