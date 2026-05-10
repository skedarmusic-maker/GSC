
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const designDNA = {
    framework: "Next.js (App Router)",
    styling: "Tailwind CSS",
    colors: {
        background: "#000000",
        foreground: "#ffffff",
        primary: "#f5e720",
        primaryHover: "#d2c510"
    },
    fonts: {
        sans: "Inter",
        heading: "Montserrat"
    },
    layout: {
        navbar: "@/components/layout/Navbar",
        footer: "@/components/layout/Footer",
        whatsapp: "@/components/ui/FloatingWhatsApp",
        mainPadding: "pt-24"
    },
    styles: ["dark-mode", "premium", "luxury", "animations-fade-in"],
    schema: "LocalBusinessSchema"
};

async function sync() {
    const clientId = "9af4dec6-0d54-4096-8210-9082d5d1cf20"; // Pagani Custom Floripa
    console.log(`--- Sincronizando DNA Visual para Pagani Custom ---`);
    
    const { error } = await supabase
        .from('clients')
        .update({ design_context: designDNA })
        .eq('id', clientId);
    
    if (error) console.error('❌ Erro:', error.message);
    else console.log('✅ DNA Visual Sincronizado e Salvo!');
}
sync();
