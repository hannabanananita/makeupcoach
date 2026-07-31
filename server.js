const express = require('express');
const path    = require('path');
const { Pool } = require('pg');

const app  = express();
const PORT = process.env.PORT || 3000;

const CONN = 'postgresql://neondb_owner:npg_kSuHReOp67Ko' +
             '@ep-lively-haze-ampsdhpn-pooler.c-5.us-east-1.aws.neon.tech' +
             '/makeupcoach';

const pool = new Pool({ connectionString: CONN, ssl: { rejectUnauthorized: true } });

const ADMIN_TOKEN = 'mc-admin-2026';
const ADMIN_USER  = 'admin';
const ADMIN_PASS  = 'Hanna2026';

const SELECT_COLS = `
    id, nombre, precio,
    encode(imagen, 'base64') AS imagen,
    inventario, etiqueta, description
`;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname)));

// ── Protección admin ──────────────────────────────────────────────────────────
function adminGuard(req, res, next) {
    if (req.headers['x-admin-token'] !== ADMIN_TOKEN) {
        return res.status(401).json({ error: 'No autorizado.' });
    }
    next();
}

// ── API pública ───────────────────────────────────────────────────────────────
app.get('/api/productos', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT ${SELECT_COLS} FROM productos ORDER BY id`
        );
        res.json(rows);
    } catch (err) {
        console.error('[DB]', err.message);
        res.status(500).json({ error: 'Error consultando la base de datos.' });
    }
});

// ── Admin: login ──────────────────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
    const { usuario, password } = req.body || {};
    if (usuario === ADMIN_USER && password === ADMIN_PASS) {
        res.json({ ok: true, token: ADMIN_TOKEN });
    } else {
        res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
});

// ── Admin: listar productos ───────────────────────────────────────────────────
app.get('/api/admin/productos', adminGuard, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT ${SELECT_COLS} FROM productos ORDER BY id`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Admin: crear producto ─────────────────────────────────────────────────────
app.post('/api/admin/productos', adminGuard, async (req, res) => {
    try {
        const { nombre, precio, imagen, inventario, etiqueta, description } = req.body;
        const imgBuf = imagen ? Buffer.from(imagen, 'base64') : null;
        const { rows } = await pool.query(
            `INSERT INTO productos (nombre, precio, imagen, inventario, etiqueta, description)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [nombre, Number(precio), imgBuf, Number(inventario), etiqueta || null, description]
        );
        res.json({ ok: true, id: rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Admin: actualizar producto ────────────────────────────────────────────────
app.put('/api/admin/productos/:id', adminGuard, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nombre, precio, imagen, inventario, etiqueta, description } = req.body;

        if (imagen !== undefined) {
            const imgBuf = imagen ? Buffer.from(imagen, 'base64') : null;
            await pool.query(
                `UPDATE productos
                 SET nombre=$1, precio=$2, imagen=$3, inventario=$4, etiqueta=$5, description=$6
                 WHERE id=$7`,
                [nombre, Number(precio), imgBuf, Number(inventario), etiqueta || null, description, id]
            );
        } else {
            await pool.query(
                `UPDATE productos
                 SET nombre=$1, precio=$2, inventario=$3, etiqueta=$4, description=$5
                 WHERE id=$6`,
                [nombre, Number(precio), Number(inventario), etiqueta || null, description, id]
            );
        }
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Admin: eliminar producto ──────────────────────────────────────────────────
app.delete('/api/admin/productos/:id', adminGuard, async (req, res) => {
    try {
        await pool.query('DELETE FROM productos WHERE id = $1', [Number(req.params.id)]);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Inicio ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
    console.log(`Admin:   http://localhost:${PORT}/admin.html`);
});
