const GEMINI_API_KEY  = '';
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

const _BG_CYCLE    = ['bg-pink', 'bg-lavender', 'bg-mint', 'bg-yellow', 'bg-pink-dark'];
const _BADGE_CYCLE = ['pink', 'purple', 'mint', 'yellow'];

function getImgBg(id)      { return _BG_CYCLE[id % _BG_CYCLE.length]; }
function getBadgeColor(id) { return _BADGE_CYCLE[id % _BADGE_CYCLE.length]; }

function imagenSrc(base64) {
    if (!base64) return null;
    return `data:image/jpeg;base64,${base64.replace(/\s/g, '')}`;
}

function precioFormateado(precio) {
    return Number(precio).toLocaleString('es-CO');
}

function renderProductosDB(productos) {
    const grid = document.querySelector('.products-grid');
    if (!grid || !productos?.length) return;

    const sinStock = (inv) => Number(inv) === 0;

    grid.innerHTML = productos.map(p => {
        const src        = imagenSrc(p.imagen);
        const imgBg      = getImgBg(p.id);
        const badgeColor = getBadgeColor(p.id);
        const agotado    = sinStock(p.inventario);
        const imgTag     = src
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

    grid.querySelectorAll('.clay-btn:not([disabled])').forEach(el => {
        el.addEventListener('click', playSquishSound);
    });
}

async function inicializarProductos() {
    const productos = await fetchProductosDB();
    if (productos) {
        renderProductosDB(productos);
        console.info(`[DB] ${productos.length} productos cargados.`);
    }
}

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

    window.open(`https://wa.me/573106612135?text=${encodeURIComponent(msg)}`, '_blank');

    mostrarModal('¡Redirigiendo a WhatsApp!', 'Te estamos redirigiendo a WhatsApp para completar el envío de tu pedido.');
    carrito = [];
    actualizarCarritoUI();
}

// Variable global para controlar la transmisión de la cámara
let streamCamara = null;

async function toggleCamara() {
    if (streamCamara) {
        apagarCamara();
    } else {
        await encenderCamara();
    }
}

async function encenderCamara() {
    const video = document.getElementById('webcam');
    const badge = document.getElementById('statusBadge');
    const btnCamara = document.getElementById('btnToggleCamara');

    if (!video || !navigator.mediaDevices?.getUserMedia) {
        mostrarModal('Error', 'Tu navegador no soporta el uso de la cámara.');
        return;
    }

    try {
        streamCamara = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = streamCamara;

        // Actualizar UI cuando esté activa
        if (badge) {
            badge.innerText = 'Cámara Activa';
            badge.className = 'clay-badge pink';
        }
        if (btnCamara) {
            btnCamara.innerHTML = "<i class='bx bx-stop-circle'></i> Apagar Cámara";
            btnCamara.className = 'clay-btn clay-btn-yellow btn-full-mb';
        }
    } catch (e) {
        console.warn('Cámara no activa o sin permisos:', e);
        mostrarModal('Sin Permisos', 'Por favor otorga permisos para acceder a la cámara.');
    }
}

function apagarCamara() {
    const video = document.getElementById('webcam');
    const badge = document.getElementById('statusBadge');
    const btnCamara = document.getElementById('btnToggleCamara');

    if (streamCamara) {
        // Detener cada pista/track de la transmisión
        streamCamara.getTracks().forEach(track => track.stop());
        streamCamara = null;
    }

    if (video) {
        video.srcObject = null;
    }

    // Actualizar UI cuando esté apagada
    if (badge) {
        badge.innerText = 'Cámara Apagada';
        badge.className = 'clay-badge purple';
    }
    if (btnCamara) {
        btnCamara.innerHTML = "<i class='bx bx-webcam'></i> Encender Cámara";
        btnCamara.className = 'clay-btn clay-btn-mint btn-full-mb';
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

    const x  = Math.floor(canvas.width  * 0.45);
    const y  = Math.floor(canvas.height * 0.50);
    const px = ctx.getImageData(x, y, 5, 5).data;

    let r = 0, g = 0, b = 0;
    for (let i = 0; i < px.length; i += 4) { r += px[i]; g += px[i + 1]; b += px[i + 2]; }
    const n = px.length / 4;
    r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

async function analizarTonoYPiel() {
    if (!streamCamara) {
        mostrarModal('Cámara Apagada', 'Por favor enciende la cámara antes de realizar el análisis.');
        return;
    }
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
        console.warn('[Gemini] Fallback:', err.message);
        analizarAleatorio();
    }
}

function _renderResultadoIA(pick) {
    document.getElementById('muestra-color').style.backgroundColor = pick.hex;
    document.getElementById('resultado-color').style.display        = 'flex';
    document.getElementById('skinTone').innerText                   = pick.name;
    document.getElementById('foundationRec').innerText              = pick.foundation;
    document.getElementById('lipstickRec').innerText                = pick.lipstick;
    document.getElementById('blushRec').innerText                   = pick.blush;
    document.getElementById('eyeshadowRec').innerText               = pick.shadow;
    document.getElementById('readout-default').style.display        = 'none';
    document.getElementById('results').style.display                = 'block';

    const status     = document.getElementById('statusBadge');
    status.innerText = 'Análisis Completo';
    status.className = 'clay-badge mint';
}

function crearBotonSubir() {
    const btn = document.createElement('button');
    btn.innerHTML = '⬆';
    btn.id = 'btn-subir';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 300));
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('.clay-btn, nav a').forEach(el => {
        el.addEventListener('click', playSquishSound);
    });

    await inicializarProductos();
    crearBotonSubir();
});
const baseConocimiento = {
  "Métodos de Pago": {
    "¿Qué métodos de pago aceptan?": "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express), transferencias bancarias, plataformas digitales (como Nequi o Daviplata, según disponibilidad) y pago contra entrega en ciudades seleccionadas.",
    "¿Es seguro ingresar los datos de mi tarjeta en la página?": "Totalmente seguro. Nuestra tienda cuenta con certificado de seguridad SSL y pasarelas de pago cifradas de extremo a extremo, lo que garantiza que tus datos financieros no quedan almacenados ni son visibles para terceros.",
    "¿Puedo pagar cuando reciba el producto en mi casa (pago contra entrega)?": "¡Sí! Contamos con la opción de pago contra entrega para la mayoría de las ciudades principales. Puedes cancelar en efectivo o con transferencia al momento de recibir tu paquete.",
    "¿Ofrecen opción de pago a cuotas o financiamiento sin tarjeta de crédito?": "Sí, trabajamos con aliados financieros de crédito directo (como Addi o Sistecrédito). Puedes seleccionar esta opción al finalizar tu compra y completar una verificación rápida en minutos."
  },
  "Envíos y Tiempos de Entrega": {
    "¿Cuánto cuesta el envío y a partir de qué monto es gratis?": "El costo del envío estándar varía según tu ubicación (usualmente entre $8.000 y $15.000 COP). Sin embargo, ¡el envío es totalmente GRATIS en compras superiores a $120.000 COP!",
    "¿Cuánto tiempo tarda en llegar mi pedido a mi ciudad/dirección?": "Los envíos a ciudades principales toman entre 2 y 4 días hábiles. Para zonas trayecto especial o municipios lejanos, el tiempo estimado es de 5 a 7 días hábiles.",
    "¿Con qué empresa de mensajería envían los paquetes y cómo puedo rastrear mi pedido?": "Trabajamos con transportadoras aliadas como Coordinadora, Servientrega e Inter rapidísimo. Tan pronto despachemos tu paquete, te enviaremos un correo/WhatsApp con el número de guía y el enlace directo de rastreo.",
    "¿Hacen envíos internacionales o solo a nivel nacional?": "Por el momento realizamos envíos únicamente a nivel nacional. Estamos trabajando para habilitar envíos internacionales muy pronto."
  },
  "Productos y Calidad": {
    "¿Cómo sé cuál es mi tono ideal de base o corrector?": "Para esto está la asesoría de IA para que tengas tu tono perfecto.",
    "¿Sus productos son 100% originales, libres de crueldad animal (cruelty-free) o veganos?": "Garantizamos un catálogo 100% original con registro sanitario al día. Además, la mayoría de nuestras marcas son certificadas Cruelty-Free y contamos con una línea exclusiva de productos 100% veganos claramente señalizados.",
    "¿Qué fecha de vencimiento tienen los productos o cómo sé si están frescos?": "Todos nuestros lotes son de alta rotación y tienen fechas de expiración amplias (mínimo 12 a 24 meses). Además, cada empaque incluye la fecha de caducidad y el ícono PAO (tiempo útil una vez abierto).",
    "¿Tienen muestras gratis o regalos por compras superiores a cierto valor?": "¡Nos encanta consentirte! En todas las compras incluimos una muestra de regalo, y por compras superiores a cierto monto (p. ej. $150.000 COP) añadimos un obsequio especial en tu paquete."
  },
  "Cambios, Devoluciones y Atención": {
    "¿Cuál es la política de cambios o devoluciones si el producto me llega roto o dañado?": "Si tu producto llega en mal estado, cuentas con 48 horas tras recibirlo para notificarnos con fotos/video del empaque. Te enviaremos un reemplazo totalmente gratis sin asumir ningún costo adicional.",
    "¿Puedo cambiar un producto si me equivoqué de tono al hacer la compra?": "Aceptamos cambios de tono siempre y cuando el producto esté completamente nuevo, sellado en su empaque original y sin usar por motivos de higiene. Los costos de transporte para el cambio corren por cuenta del cliente.",
    "¿Tienen alguna tienda física o punto de retiro donde pueda ir a recoger mi pedido directamente?": "Somos una tienda 100% digital para ofrecerte los mejores precios, pero si estás en nuestra ciudad sede, puedes seleccionar la opción 'Recoger en bodega' durante el proceso de compra sin costo de envío."
  }
};

const saludos = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'que tal', 'hey'];
const despedidas = ['adios', 'hasta luego', 'nos vemos', 'cha', 'bye', 'salir', 'terminar'];

// Elementos del DOM
const toggleBtn = document.getElementById('chat-toggle-btn');
const closeBtn = document.getElementById('close-chat-btn');
const chatWindow = document.getElementById('chat-window');
const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');

// Abrir / Cerrar Chat
toggleBtn.addEventListener('click', () => chatWindow.classList.toggle('chat-hidden'));
closeBtn.addEventListener('click', () => chatWindow.classList.add('chat-hidden'));

// Normalizar texto para búsqueda
function limpiarTexto(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, '');
}

// Búsqueda de coincidencia basada en palabras clave
function obtenerRespuesta(pregunta) {
  const preguntaLimpia = limpiarTexto(pregunta);

  if (saludos.some(s => preguntaLimpia.includes(s))) {
    return "¡Hola! 😊 Soy tu asistente de maquillaje. ¿En qué te puedo ayudar hoy?";
  }
  if (despedidas.some(d => preguntaLimpia.includes(d))) {
    return "¡Hasta pronto! 👋 Que tengas un excelente día.";
  }

  let mejorRespuesta = "";
  let maxCoincidencias = 0;
  let categoriaEncontrada = "";

  const palabrasUsuario = preguntaLimpia.split(' ').filter(w => w.length > 2);

  for (const [categoria, preguntas] of Object.entries(baseConocimiento)) {
    for (const [preguntaBase, respuesta] of Object.entries(preguntas)) {
      const preguntaBaseLimpia = limpiarTexto(preguntaBase);
      let coincidencias = 0;

      palabrasUsuario.forEach(palabra => {
        if (preguntaBaseLimpia.includes(palabra)) {
          coincidencias++;
        }
      });

      if (coincidencias > maxCoincidencias) {
        maxCoincidencias = coincidencias;
        mejorRespuesta = respuesta;
        categoriaEncontrada = categoria;
      }
    }
  }

  if (maxCoincidencias > 0) {
    return `📚 <b>[${categoriaEncontrada}]</b> ${mejorRespuesta}`;
  } else {
    return "🤔 No estoy segura de la respuesta. Intenta preguntarme sobre métodos de pago, envíos, productos o devoluciones.";
  }
}

// Agregar Mensajes al DOM
function agregarMensaje(texto, esUsuario) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message');
  msgDiv.classList.add(esUsuario ? 'user-message' : 'bot-message');
  msgDiv.innerHTML = texto;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Procesar envío de mensaje
function enviarMensaje() {
  const texto = userInput.value.trim();
  if (!texto) return;

  agregarMensaje(texto, true);
  userInput.value = '';

  // Respuesta simulada con un breve retraso
  setTimeout(() => {
    const respuesta = obtenerRespuesta(texto);
    agregarMensaje(respuesta, false);
  }, 400);
}

// Eventos de entrada
sendBtn.addEventListener('click', enviarMensaje);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') enviarMensaje();
});