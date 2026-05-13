
import * as ftp from "basic-ftp";

async function forceImageSwap() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.paganicustomsite",
            password: "1q2w3e4r@@@SK",
            port: 21,
            secure: false
        });

        console.log("--- FORÇANDO TROCA DE IMAGEM (PAGANI LOGO) ---");

        // Pasta de imagens do preview
        await client.cd("/preview/images");
        
        // 1. Deletamos a imagem antiga se ela existir para não ter conflito
        try {
            await client.remove("protecao-farol.png");
            console.log("Imagem antiga removida do servidor.");
        } catch (e) {
            console.log("Imagem antiga não encontrada para remover, prosseguindo...");
        }

        // 2. Subimos a SUA foto (Logo_on_wall_and_uniform) com o nome que o site pede
        console.log("Subindo a sua foto nova Pagani...");
        await client.uploadFrom("c:/Users/Skedar/Desktop/IA - SITES/Pagani Custom/public/images/Logo_on_wall_and_uniform_202605122312.jpeg", "protecao-farol.png");

        console.log("\n✅ IMAGEM PAGANI ATUALIZADA NO SERVIDOR!");
    } catch (err) {
        console.error("Erro fatal:", err.message);
    } finally {
        client.close();
    }
}

forceImageSwap();
