const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const http = require('http'); // <-- IMPORTANTE: Nueva librería para el puerto

// ==========================================
// BÚNKER DE SEGURIDAD (Variables de Entorno)
// ==========================================
const MI_NUMERO_PERSONAL = process.env.MI_NUMERO_PERSONAL; 
const URL_RENDER = process.env.URL_RENDER; 
const PORT = process.env.PORT || 3000; // <-- Lee el puerto de Render o usa 3000

// Sistema de seguridad: Si olvidas poner las variables en la nube, el bot te avisa
if (!MI_NUMERO_PERSONAL || !URL_RENDER) {
    console.error("❌ ERROR DE BÚNKER: Faltan las variables MI_NUMERO_PERSONAL o URL_RENDER.");
    process.exit(1);
}

// ==========================================
// SERVIDOR DE MANTENIMIENTO (Evita que Render mate el bot)
// ==========================================
http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write('Axtelix Bridge is Alive! 🚀');
    res.end();
}).listen(PORT, () => {
    console.log(`📡 Servidor dummy running en el puerto ${PORT}`);
});

// ==========================================
// INICIALIZACIÓN DEL CLIENTE (Optimizado para la Nube)
// ==========================================
const client = new Client({
    authStrategy: new LocalAuth(),
    authTimeoutMs: 180000, // <-- Te sugiero 180s (3 min) porque Docker tarda en abrir Chromium
    puppeteer: {
        headless: true,
        // CAMBIA ESTA LÍNEA AQUÍ ABAJO:
        executablePath: '/usr/bin/chromium', 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-extensions'
        ],
    }
});

client.on('qr', (qr) => {
    console.log('✨ ESCANEA ESTE QR:');
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('🚀 Axtelix Bridge está EN LÍNEA desde la nube y conectado al Cerebro...');
});

client.on('message', async (msg) => {
    // Solo respondemos a chats individuales (ignoramos grupos)
    const chat = await msg.getChat();
    if (chat.isGroup) return;

    console.log(`📩 Mensaje de ${msg.from}: ${msg.body}`);

    try {
        // 1. Enviar el mensaje de WhatsApp a tu servidor de Render (Cerebro IA)
        const response = await axios.post(`${URL_RENDER}/webhook-whatsapp`, {
            mensaje: msg.body,
            numero: msg.from
        });

        const { respuesta, notificar_luis } = response.data;

        // 2. Si la IA mandó una respuesta para el cliente, se la enviamos
        if (respuesta) {
            await msg.reply(respuesta);
        }

        // 3. Si la IA detectó una venta o faltante, te manda un WhatsApp a ti
        if (notificar_luis) {
            console.log('📡 Alerta detectada. Notificando al jefe...');
            await client.sendMessage(MI_NUMERO_PERSONAL, notificar_luis);
        }

    } catch (error) {
        console.error('❌ Error de conexión con Render:', error.message);
    }
});

client.initialize();