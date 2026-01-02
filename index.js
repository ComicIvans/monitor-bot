require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');

// --- CONFIG ---
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = parseInt(process.env.ADMIN_ID);
const INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 60000;
const URLS = process.env.URLS.split(',').map(u => u.trim()).filter(u => u);
const DB_FILE = path.join(__dirname, 'monitor_db.json');
const VERBOSE = process.env.VERBOSE === 'true'; // Variable para activar logs

// --- CLIENTE HTTP ---
const client = axios.create({
    timeout: 10000,
    httpsAgent: new https.Agent({ keepAlive: true }),
    validateStatus: () => true, 
    headers: { 'User-Agent': 'MonitorBot/1.0' }
});

// --- PERSISTENCIA ---
const loadState = () => {
    try {
        if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch { return {}; }
    return {};
};

const saveState = (data) => {
    try { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); } catch (e) { console.error('Error DB:', e.message); }
};

// --- MIDDLEWARE ---
bot.use(async (ctx, next) => {
    if (ctx.from && ctx.from.id === ADMIN_ID) return next();
});

bot.start((ctx) => ctx.reply('🤖 Monitor Online.'));

// --- LÓGICA CORE ---
const checkUrl = async (url) => {
    try {
        const res = await client.get(url);
        return res.status >= 200 && res.status < 300;
    } catch (e) {
        return false;
    }
};

let isScanning = false;

const runChecks = async () => {
    if (isScanning) return;
    isScanning = true;
    
    // Log condicional
    if (VERBOSE) console.log('--- 🔄 Iniciando ciclo de comprobación ---');

    try {
        let currentState = loadState();
        let stateChanged = false;

        for (const url of URLS) {
            const isUp = await checkUrl(url);
            const prevStatus = currentState[url];

            // Log condicional por URL
            if (VERBOSE) console.log(` > ${url}: ${isUp ? 'ONLINE' : 'OFFLINE'} (DB: ${prevStatus})`);

            if (prevStatus !== isUp) {
                currentState[url] = isUp;
                stateChanged = true;

                // Log de CAMBIO siempre visible (es importante)
                console.log(`⚠️ CAMBIO DETECTADO: ${url} -> ${isUp ? 'ON' : 'OFF'}`);

                if (prevStatus !== undefined) {
                    const emoji = isUp ? '🟢' : '🔴';
                    const msg = `${emoji} **Cambio de Estado**\n${url}\nEstado: ${isUp ? 'ONLINE' : 'OFFLINE'}`;
                    await bot.telegram.sendMessage(ADMIN_ID, msg).catch(e => console.error('Error TG:', e.message));
                }
            }
        }

        if (stateChanged) {
            saveState(currentState);
            if (VERBOSE) console.log('💾 Cambios guardados.');
        }

    } catch (err) {
        console.error('❌ Error en ciclo:', err.message);
    } finally {
        isScanning = false;
    }
};

// --- COMANDOS ---
bot.command('status', async (ctx) => {
    const msg = await ctx.reply('⏳ Comprobando...');
    let report = '📊 **Estado Actual:**\n\n';
    let currentState = loadState();
    let needsSave = false;

    for (const url of URLS) {
        const isUp = await checkUrl(url);
        if (currentState[url] !== isUp) {
            currentState[url] = isUp;
            needsSave = true;
        }
        report += `${isUp ? '🟢' : '🔴'} ${url}\n`;
    }

    if (needsSave) saveState(currentState);
    ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, report).catch(()=>{});
});

// --- LANZAMIENTO ---
bot.launch().catch(err => console.error('⚠️ Telegram no conecta (monitor activo):', err.message));

console.log(`🚀 Monitor iniciado. Intervalo: ${INTERVAL}ms | Verbose: ${VERBOSE}`);
runChecks();
setInterval(runChecks, INTERVAL);

// Stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));