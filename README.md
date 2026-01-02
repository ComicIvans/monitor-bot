# Telegram Web Monitor Bot

Bot de Telegram en Node.js diseñado para monitorizar el estado (Uptime) de una lista de sitios web y notificar cambios de estado (Online/Offline) en tiempo real a un administrador específico.

## 🚀 Características

* **Monitorización periódica:** Intervalo configurable.
* **Notificaciones Push:** Avisa solo cuando hay cambios de estado.
* **Persistencia:** Mantiene el estado en JSON local (`monitor_db.json`) para sobrevivir a reinicios sin falsos positivos.
* **Resiliencia:** Maneja errores de red (`ECONNREFUSED`, `TIMEOUT`) y finge ser un navegador (User-Agent) para evitar bloqueos 403.
* **Modo Silencioso/Verbose:** Logs configurables mediante variables de entorno.
* **Seguridad:** Solo responde al ID de administrador configurado.

## 📋 Requisitos

* Node.js (v16+)
* pnpm (o npm)
* PM2 (para despliegue en producción)

## 🛠️ Instalación

1.  **Clonar y dependencias:**
    ```bash
    git clone <repo_url>
    cd monitor-bot
    pnpm install
    ```

2.  **Configuración:**
    Crea un archivo `.env` basado en el siguiente esquema:

    ```ini
    # Token obtenido de @BotFather
    BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
    
    # Tu ID de usuario (obtenlo con @userinfobot)
    ADMIN_ID=123456789
    
    # URLs separadas por comas (sin espacios)
    URLS=https://miservidor1.com,https://api.miweb.com/health
    
    # Intervalo en milisegundos (Ej: 60000 = 1 minuto)
    CHECK_INTERVAL=60000
    
    # false para producción, true para ver logs detallados por consola
    VERBOSE=false
    ```

## ⚙️ Despliegue con PM2

El proyecto incluye un `ecosystem.config.js` optimizado.

1.  **Iniciar servicio:**
    ```bash
    pm2 start ecosystem.config.js
    ```

2.  **Hacer persistente al reinicio del servidor:**
    ```bash
    pm2 save
    pm2 startup
    ```

## 🕹️ Comandos del Bot

* `/start` - Verifica que el bot está escuchando.
* `/status` - Fuerza una comprobación manual de todos los servicios y sincroniza la base de datos si hay discrepancias.

## 📂 Estructura

* `index.js`: Lógica principal.
* `monitor_db.json`: Estado persistente (autogenerado, **no borrar** manualmenente).
* `ecosystem.config.js`: Configuración de PM2 (sin configuración de directorio de trabajo).