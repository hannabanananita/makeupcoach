// ==========================================
// CONFIGURACIÓN GENERAL
// ==========================================

// Reemplaza con tu API key de Gemini cuando esté disponible
const GEMINI_API_KEY = '';

// ==========================================
// BASE DE DATOS - NEON POSTGRESQL
// ==========================================
//
// La conexión a Neon ocurre en server.js (Node.js + @neondatabase/serverless).
// El browser solo consume el endpoint REST local, evitando problemas de CORS
// y manteniendo las credenciales fuera del frontend.
//
// Esquema de la tabla:
//   CREATE TABLE IF NOT EXISTS productos (
//       id          INTEGER      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
//       nombre      VARCHAR(100) NOT NULL,
//       precio      INTEGER      NOT NULL,
//       imagen      BYTEA,
//       inventario  INTEGER      NOT NULL DEFAULT 0,
//       etiqueta    VARCHAR(50),
//       description VARCHAR(500) NOT NULL
//   );

const DB_API_ENDPOINT = '/api/productos';

async function fetchProductosDB() {
    try {
        const res = await fetch(DB_API_ENDPOINT);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('[DB] No se pudieron cargar los productos:', err.message);
        return null;
    }
}

// ── Helpers de presentación ──────────────────────────────────────────────────

const _BG_CYCLE     = ['bg-pink', 'bg-lavender', 'bg-mint', 'bg-yellow', 'bg-pink-dark'];
const _BADGE_CYCLE  = ['pink', 'purple', 'mint', 'yellow'];

function getImgBg(id)     { return _BG_CYCLE[id % _BG_CYCLE.length]; }
function getBadgeColor(id){ return _BADGE_CYCLE[id % _BADGE_CYCLE.length]; }

function imagenSrc(base64) {
    if (!base64) return null;
    // Neon devuelve BYTEA como string base64 puro
    return `data:image/jpeg;base64,${base64.replace(/\s/g, '')}`;
}

function precioFormateado(precio) {
    return Number(precio).toLocaleString('es-CO');
}

// ── Renderizado ──────────────────────────────────────────────────────────────

function renderProductosDB(productos) {
    const grid = document.querySelector('.products-grid');
    if (!grid || !productos?.length) return;

    const sinStock = (inv) => Number(inv) === 0;

    grid.innerHTML = productos.map(p => {
        const src         = imagenSrc(p.imagen);
        const imgBg       = getImgBg(p.id);
        const badgeColor  = getBadgeColor(p.id);
        const agotado     = sinStock(p.inventario);
        const imgTag      = src
            ? `<img src="${src}" alt="${p.nombre}" onerror="this.style.display='none'">`
            : '';

        return `
        <div class="product-card${agotado ? ' sin-stock' : ''}">
            <div>
                <div class="product-img-box ${imgBg}">${imgTag}</div>
                ${p.etiqueta
                    ? `<span class="clay-badge ${badgeColor} badge-sm">${p.etiqueta}</span>`
                    : ''}
                ${agotado
                    ? `<span class="clay-badge badge-sm badge-agotado">Sin stock</span>`
                    : ''}
                <h3 class="product-title">${p.nombre}</h3>
                <p class="product-desc">${p.description}</p>
            </div>
            <div class="product-footer">
                <span class="product-price">$${precioFormateado(p.precio)}</span>
                <button class="clay-btn"
                    ${agotado ? 'disabled title="Producto agotado"' : ''}
                    onclick="agregarAlCarrito('${p.nombre.replace(/'/g, "\\'")}', ${p.precio})">
                    <i class='bx bx-plus'></i> Añadir
                </button>
            </div>
        </div>`;
    }).join('');

    // Re-registrar sonido squish en botones nuevos
    grid.querySelectorAll('.clay-btn:not([disabled])').forEach(el => {
        el.addEventListener('click', playSquishSound);
    });
}

async function inicializarProductos() {
    const productos = await fetchProductosDB();
    if (productos) {
        renderProductosDB(productos);
        console.info(`[DB] ${productos.length} productos cargados desde Neon.`);
    } else {
        console.info('[DB] Usando productos estáticos del HTML como respaldo.');
    }
}

// ==========================================
// AUDIO - EFECTO SQUISH
// ==========================================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSquishSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
}

// ==========================================
// CARRITO
// ==========================================

let carrito = [];

function agregarAlCarrito(nombre, precio) {
    carrito.push({ nombre, precio });
    actualizarCarritoUI();
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    const lista   = document.getElementById('listaCarrito');
    const totalEl = document.getElementById('totalCarrito');
    const badge   = document.getElementById('cartCountBadge');

    badge.innerText = `${carrito.length} Productos`;

    if (carrito.length === 0) {
        lista.innerHTML   = '<p class="cart-empty-msg">Tu carrito está vacío.</p>';
        totalEl.innerText = '00.000';
        return;
    }

    let total = 0;
    let html  = '';
    carrito.forEach((item, idx) => {
        total += item.precio;
        html  += `
        <div class="cart-row">
            <span>${item.nombre}</span>
            <div class="cart-item-actions">
                <span class="cart-item-price">$${item.precio.toFixed(2)}</span>
                <button class="cart-remove-btn" onclick="eliminarDelCarrito(${idx})">✕</button>
            </div>
        </div>`;
    });

    lista.innerHTML   = html;
    totalEl.innerText = total.toFixed(2);
}

// ==========================================
// MODAL
// ==========================================

function mostrarModal(titulo, mensaje) {
    const overlay = document.createElement('div');
    overlay.className = 'clay-modal-overlay';
    overlay.innerHTML = `
        <div class="clay-modal">
            <span class="clay-badge pink mb-12">Notificación</span>
            <h2 class="modal-title">${titulo}</h2>
            <p class="modal-text">${mensaje}</p>
            <button class="clay-btn clay-btn-purple btn-full"
                onclick="this.closest('.clay-modal-overlay').remove()">
                ¡Entendido! ✨
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
}

// ==========================================
// PEDIDO - WHATSAPP
// ==========================================

function enviarPedido() {
    if (carrito.length === 0) {
        mostrarModal('¡Carrito Vacío!', 'Agrega al menos un producto antes de enviar tu pedido.');
        return;
    }

    const inputs    = document.querySelectorAll('#pedido input, #pedido textarea');
    const nombre    = inputs[0].value.trim();
    const email     = inputs[1].value.trim();
    const telefono  = inputs[2].value.trim();
    const direccion = inputs[3].value.trim();

    if (!nombre || !email || !telefono || !direccion) {
        mostrarModal('¡Datos Incompletos!', 'Por favor llena todos los campos de envío para procesar tu pedido.');
        return;
    }

    let msg = `*¡Hola! Quiero realizar el siguiente pedido:* 🛒✨\n\n`;
    msg += `*DATOS DEL CLIENTE:*\n`;
    msg += `👤 *Nombre:* ${nombre}\n`;
    msg += `📧 *Correo:* ${email}\n`;
    msg += `📞 *Teléfono:* ${telefono}\n`;
    msg += `📍 *Dirección:* ${direccion}\n\n`;
    msg += `*DETALLE DE PRODUCTOS:*\n`;

    let total = 0;
    carrito.forEach((item, i) => {
        total += item.precio;
        msg   += `${i + 1}. ${item.nombre} - $${item.precio.toLocaleString('es-CO')}\n`;
    });

    msg += `\n💰 *TOTAL A PAGAR:* $${total.toLocaleString('es-CO')}\n\n`;
    msg += `¡Quedo a la espera de la confirmación para el pago y envío!`;

    const url = `https://wa.me/573106612135?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    mostrarModal('¡Redirigiendo a WhatsApp!', 'Te estamos redirigiendo a WhatsApp para completar el envío de tu pedido.');
    carrito = [];
    actualizarCarritoUI();
}

// ==========================================
// CÁMARA
// ==========================================

async function initCamera() {
    const video = document.getElementById('webcam');
    if (!video || !navigator.mediaDevices?.getUserMedia) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (e) {
        console.log('Cámara no activa o sin permisos.');
    }
}

function obtenerColorMejilla() {
    const video  = document.getElementById('webcam');
    const canvas = document.getElementById('canvas-captura');
    if (!video || !canvas) return '#e2a384';

    const ctx = canvas.getContext('2d');
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const x = Math.floor(canvas.width  * 0.45);
    const y = Math.floor(canvas.height * 0.50);
    const px = ctx.getImageData(x, y, 5, 5).data;

    let r = 0, g = 0, b = 0;
    for (let i = 0; i < px.length; i += 4) { r += px[i]; g += px[i+1]; b += px[i+2]; }
    const n = px.length / 4;
    r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// ==========================================
// ANÁLISIS DE PIEL
// ==========================================

async function analizarTonoYPiel() {
    playSquishSound();
    GEMINI_API_KEY ? await analizarConGemini() : analizarAleatorio();
}

function analizarAleatorio() {
    const tonos = [
        { hex: '#f2cdab', name: 'Cálido Dorado',  foundation: 'N2 Gold Glow',     lipstick: 'Rojo Coral',       blush: 'Durazno Vivo',    shadow: 'Bronce Cobre'  },
        { hex: '#e8b894', name: 'Neutro Claro',    foundation: 'N1 Natural Beige', lipstick: 'Rosa Malva',       blush: 'Coral Suave',     shadow: 'Nude Rosado'   },
        { hex: '#c68d5f', name: 'Trigueño',        foundation: 'T3 Caramel',       lipstick: 'Terracota Velvet', blush: 'Bronce Satinado', shadow: 'Dorado Cálido' },
        { hex: '#8d5524', name: 'Oscuro Profundo', foundation: 'D5 Amber',         lipstick: 'Vino Intenso',     blush: 'Ciruela Glow',    shadow: 'Oro & Cobalto' }
    ];
    _renderResultadoIA(tonos[Math.floor(Math.random() * tonos.length)]);
}

async function analizarConGemini() {
    const hex = obtenerColorMejilla();
    document.getElementById('readout-default').innerText = 'Consultando estilista IA...';

    try {
        const url    = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const prompt = `Actúa como maquillador profesional. Color de piel detectado: ${hex}.
Responde SOLO con JSON válido, sin bloques de código:
{"hex":"${hex}","name":"tono","foundation":"base","lipstick":"labial","blush":"rubor","shadow":"sombras"}`;

        const res  = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        const pick = JSON.parse(data.candidates[0].content.parts[0].text.trim());
        _renderResultadoIA(pick);
    } catch (err) {
        console.warn('[Gemini] Fallback a análisis aleatorio:', err.message);
        analizarAleatorio();
    }
}

function _renderResultadoIA(pick) {
    document.getElementById('muestra-color').style.backgroundColor = pick.hex;
    document.getElementById('resultado-color').style.display = 'flex';
    document.getElementById('skinTone').innerText      = pick.name;
    document.getElementById('foundationRec').innerText = pick.foundation;
    document.getElementById('lipstickRec').innerText   = pick.lipstick;
    document.getElementById('blushRec').innerText      = pick.blush;
    document.getElementById('eyeshadowRec').innerText  = pick.shadow;
    document.getElementById('readout-default').style.display = 'none';
    document.getElementById('results').style.display   = 'block';

    const status     = document.getElementById('statusBadge');
    status.innerText = 'Análisis Completo';
    status.className = 'clay-badge mint';
}

// ==========================================
// BOTÓN VOLVER ARRIBA
// ==========================================

function crearBotonSubir() {
    const btn = document.createElement('button');
    btn.innerHTML = '⬆';
    btn.id = 'btn-subir';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 300));
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('.clay-btn, nav a').forEach(el => {
        el.addEventListener('click', playSquishSound);
    });

    await initCamera();
    await inicializarProductos();
    crearBotonSubir();
});
