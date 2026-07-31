// seed.js — Inserta los productos en Neon con imágenes como BYTEA
// Uso: node seed.js

const { Client } = require('pg');
const fs   = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, 'assets');

const client = new Client({
    connectionString:
        'postgresql://neondb_owner:npg_kSuHReOp67Ko' +
        '@ep-lively-haze-ampsdhpn-pooler.c-5.us-east-1.aws.neon.tech' +
        '/makeupcoach',
    ssl: { rejectUnauthorized: true }
});

// Lee la imagen como Buffer (BYTEA); retorna null si no existe
function img(nombre) {
    const ruta = path.join(ASSETS, nombre);
    if (!fs.existsSync(ruta)) {
        console.warn(`  ⚠ Imagen no encontrada: ${nombre}`);
        return null;
    }
    return fs.readFileSync(ruta);
}

const productos = [
    {
        nombre: 'Base Líquida',
        precio: 30000,
        imagen: img('basedemaquillaje.jpg'),
        inventario: 50,
        etiqueta: 'Acabado Mate',
        description: 'Cobertura sedosa de larga duración con textura ligera.'
    },
    {
        nombre: 'Labiales en barra Mates',
        precio: 70000,
        imagen: img('paquetelabiales.jpg'),
        inventario: 30,
        etiqueta: 'Efecto Velvet',
        description: 'Pigmentación intensa e hidratación continua, set de 5 unidades.'
    },
    {
        nombre: 'Paleta Sombras',
        precio: 35000,
        imagen: img('sombras.jpg'),
        inventario: 40,
        etiqueta: 'Sombras 12 tonos',
        description: 'Altamente pigmentadas para cualquier tipo de mirada.'
    },
    {
        nombre: 'Rubor en polvo',
        precio: 20000,
        imagen: img('ruborpolvo.jpg'),
        inventario: 60,
        etiqueta: 'Glow Natural',
        description: 'Toque de color natural para resaltar tus mejillas.'
    },
    {
        nombre: 'Corrector de ojeras',
        precio: 25000,
        imagen: img('corrector.webp'),
        inventario: 45,
        etiqueta: 'Efecto hidratante',
        description: 'Alta cobertura, tono beige medio.'
    },
    {
        nombre: 'Labial liquido',
        precio: 12000,
        imagen: img('labial liquido.jpg'),
        inventario: 55,
        etiqueta: 'Acabado mate indeleble',
        description: 'Tono nude rose.'
    },
    {
        nombre: 'Lip gloss',
        precio: 10000,
        imagen: img('lipgloss.webp'),
        inventario: 70,
        etiqueta: 'Con ácido hialurónico',
        description: 'Tono traslúcido rosa.'
    },
    {
        nombre: 'Sombras en barra',
        precio: 10000,
        imagen: img('sombraenbarra.jpg'),
        inventario: 40,
        etiqueta: 'Fácil difuminado',
        description: 'Tono bronce satinado.'
    },
    {
        nombre: 'Sombra Liquida',
        precio: 12000,
        imagen: img('Sombraliquida.jpeg'),
        inventario: 35,
        etiqueta: 'Acabado escarchado',
        description: 'Tono champagne deslumbrante.'
    },
    {
        nombre: 'Polvo suelto',
        precio: 25000,
        imagen: img('polvosuelto.webp'),
        inventario: 50,
        etiqueta: 'Control de brillo',
        description: 'Textura translúcida.'
    },
    {
        nombre: 'Polvo compacto',
        precio: 20000,
        imagen: img('polvocompacto.jpg'),
        inventario: 45,
        etiqueta: 'Con filtro solar',
        description: 'Cobertura uniforme, tono arena.'
    },
    {
        nombre: 'Rubor liquido',
        precio: 20000,
        imagen: img('ruborliquido.webp'),
        inventario: 60,
        etiqueta: 'Glow Natural',
        description: 'Efecto hidratante, tono durazno.'
    },
    {
        nombre: 'Rubor en barra',
        precio: 25000,
        imagen: img('ruborenbarra.jpg'),
        inventario: 40,
        etiqueta: 'Acabado cremoso',
        description: 'Cobertura construible, tono coral.'
    },
    {
        nombre: 'Iluminador en polvo',
        precio: 23000,
        imagen: img('iluminadorenpolvo.webp'),
        inventario: 50,
        etiqueta: 'Efecto radiante',
        description: 'Destellos dorados.'
    },
    {
        nombre: 'Iluminador liquido',
        precio: 15000,
        imagen: img('iluminadorliquido.jpg'),
        inventario: 55,
        etiqueta: 'Acabado perlado',
        description: 'Acabado perlado, tono rosa dorado.'
    },
    {
        nombre: 'Fijador de cejas',
        precio: 10000,
        imagen: img('fijadordecejas.webp'),
        inventario: 65,
        etiqueta: 'Larga duración',
        description: 'Gel transparente de larga duración.'
    },
    {
        nombre: 'Fijador de maquillaje',
        precio: 35000,
        imagen: img('fijadordemaquillaje.jpg'),
        inventario: 40,
        etiqueta: 'Bruma hidratante',
        description: 'Acabado mate prolongado.'
    },
    {
        nombre: 'Lápiz de ojos',
        precio: 7000,
        imagen: img('lapizdeojos.webp'),
        inventario: 80,
        etiqueta: 'Waterproof',
        description: 'Fórmula cremosa, tono negro intenso.'
    },
    {
        nombre: 'Lápiz de labios',
        precio: 7000,
        imagen: img('lapizdelabios.webp'),
        inventario: 75,
        etiqueta: 'Trazo suave',
        description: 'Tono terracota.'
    },
    {
        nombre: 'Pestañina',
        precio: 32000,
        imagen: img('pestañina.jpeg'),
        inventario: 50,
        etiqueta: 'Waterproof',
        description: 'Efecto volumen y alargamiento, tono negro.'
    },
    {
        nombre: 'Delineador de ojos',
        precio: 10000,
        imagen: img('delineadordeojos.jpg'),
        inventario: 65,
        etiqueta: 'Ultra fina',
        description: 'Punta plumón, tono negro mate.'
    },
    {
        nombre: 'Lápiz de cejas',
        precio: 8000,
        imagen: img('lapizdecejas.jpg'),
        inventario: 70,
        etiqueta: 'Punta retráctil',
        description: 'Tono castaño oscuro.'
    },
    {
        nombre: 'Contorno en polvo',
        precio: 12000,
        imagen: img('contronoenpolvo.webp'),
        inventario: 55,
        etiqueta: 'Acabado mate',
        description: 'Tono café frío.'
    },
    {
        nombre: 'Contorno en barra',
        precio: 12000,
        imagen: img('contronoenbarra.webp'),
        inventario: 50,
        etiqueta: 'Fácil difuminado',
        description: 'Textura cremosa, tono avellana.'
    },
    {
        nombre: 'Contorno liquido',
        precio: 13000,
        imagen: img('contronoliquido.webp'),
        inventario: 45,
        etiqueta: 'Alta pigmentación',
        description: 'Fórmula ligera, tono chocolate suave.'
    }
];

const SQL = `
    INSERT INTO productos (nombre, precio, imagen, inventario, etiqueta, description)
    VALUES ($1, $2, $3, $4, $5, $6)
`;

async function seed() {
    await client.connect();
    console.log('Conectado a Neon.\n');

    let ok = 0, fail = 0;

    for (const p of productos) {
        try {
            await client.query(SQL, [
                p.nombre,
                p.precio,
                p.imagen,       // Buffer → BYTEA (pg lo convierte automáticamente)
                p.inventario,
                p.etiqueta,
                p.description
            ]);
            console.log(`✅  ${p.nombre}`);
            ok++;
        } catch (err) {
            console.error(`❌  ${p.nombre}: ${err.message}`);
            fail++;
        }
    }

    console.log(`\n${ok} insertados, ${fail} errores.`);
    await client.end();
}

seed().catch(err => {
    console.error('Error fatal:', err.message);
    process.exit(1);
});
