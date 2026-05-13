
import * as ftp from "basic-ftp";

async function swapImageOnly() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.paganicustomsite",
            password: "1q2w3e4r@@@SK",
            port: 21,
            secure: false
        });

        console.log("--- TROCANDO APENAS A IMAGEM NO SERVIDOR ---");

        // Vamos para a pasta de imagens do preview
        await client.cd("/preview/images");
        
        // Subimos a sua foto nova RENOMEADA para o nome que o site espera
        // Assim o site "pensa" que é a mesma foto, mas mostra a nova
        await client.uploadFrom("c:/Users/Skedar/Desktop/IA - SITES/Pagani Custom/public/images/Logo_on_wall_and_uniform_202605122312.jpeg", "protecao-farol.png");

        console.log("\n✅ IMAGEM TROCADA COM SUCESSO!");
        console.log("Pode atualizar o site agora!");
    } catch (err) {
        console.error("Erro:", err.message);
    } finally {
        client.close();
    }
}

swapImageOnly();
