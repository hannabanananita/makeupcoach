const TOKEN_KEY = 'mc_admin_token';
const API = {
    login:     '/api/admin/login',
    productos: '/api/admin/productos'
};

let productosCache = [];
let deleteTargetId = null;
let editingId      = null;
let pendingBase64  = null; // null = no hay imagen nueva seleccionada

function token()    { return localStorage.getItem(TOKEN_KEY); }
function setTok(t)  { localStorage.setItem(TOKEN_KEY, t); }
function clearTok() { localStorage.removeItem(TOKEN_KEY); }

function authH() {
    return {
        'Content-Type':  'application/json',
        'x-admin-token': token()
    };
}

document.addEventListener('DOMContentLoaded', () => {
    if (token()) {
        mostrarPanel();
    } else {
        mostrarLogin();
    }

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('producto-form').addEventListener('submit', guardarProducto);
    document.getElementById('file-imagen').addEventListener('change', previewImagen);
    document.getElementById('buscador').addEventListener('input', filtrarTabla);

    document.getElementById('producto-modal').addEventListener('click', e => {
        if (e.target === e.currentTarget) cerrarModal();
    });
    document.getElementById('delete-modal').addEventListener('click', e => {
        if (e.target === e.currentTarget) cerrarDeleteModal();
    });
});

async function handleLogin(e) {
    e.preventDefault();
    const errEl = document.getElementById('login-error');
    errEl.textContent = '';

    const usuario  = document.getElementById('l-usuario').value.trim();
    const password = document.getElementById('l-password').value;

    try {
        const res  = await fetch(API.login, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ usuario, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error de autenticación.');
        setTok(data.token);
        mostrarPanel();
    } catch (err) {
        errEl.textContent = err.message;
    }
}

function mostrarLogin() {
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('admin-panel').style.display   = 'none';
}

function mostrarPanel() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('admin-panel').style.display   = 'block';
    cargarProductos();
}

function cerrarSesion() {
    clearTok();
    mostrarLogin();
}

async function cargarProductos() {
    try {
        const res = await fetch(API.productos, { headers: authH() });

        if (res.status === 401) { clearTok(); mostrarLogin(); return; }
        if (!res.ok) throw new Error('Error cargando productos.');

        productosCache = await res.json();
        actualizarStats(productosCache);
        renderTabla(productosCache);
    } catch (err) {
        toast(err.message, 'error');
    }
}

function actualizarStats(lista) {
    const total   = lista.length;
    const enStock = lista.filter(p => Number(p.inventario) > 0).length;

    document.getElementById('stat-total').textContent   = total;
    document.getElementById('stat-stock').textContent   = enStock;
    document.getElementById('stat-agotado').textContent = total - enStock;
}

function renderTabla(lista) {
    const tbody = document.getElementById('tabla-body');

    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="table-msg">No se encontraron productos.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(p => {
        const inv  = Number(p.inventario);
        const iCls = inv === 0 ? 'inv-zero' : inv <= 15 ? 'inv-low' : 'inv-ok';
        const thumb = p.imagen
            ? `<img class="admin-thumbnail" src="data:image/jpeg;base64,${p.imagen.replace(/\s/g, '')}" alt="${p.nombre}" onerror="this.style.display='none'">`
            : `<div class="admin-thumb-placeholder"><i class='bx bx-image'></i></div>`;

        return `<tr>
            <td><span class="clay-badge purple badge-sm">${p.id}</span></td>
            <td>${thumb}</td>
            <td class="product-name-cell">${p.nombre}</td>
            <td class="price-cell">$${Number(p.precio).toLocaleString('es-CO')}</td>
            <td><span class="inv-badge ${iCls}">${p.inventario}</span></td>
            <td>${p.etiqueta ? `<span class="clay-badge pink badge-sm">${p.etiqueta}</span>` : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td class="desc-cell" title="${p.description}">${p.description}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon edit" onclick="abrirEditar(${p.id})" title="Editar">
                        <i class='bx bx-edit-alt'></i>
                    </button>
                    <button class="btn-icon danger" onclick="abrirDelete(${p.id})" title="Eliminar">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function filtrarTabla() {
    const q = document.getElementById('buscador').value.toLowerCase();
    const filtrados = productosCache.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        (p.etiqueta || '').toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
    renderTabla(filtrados);
}

function abrirModalCrear() {
    editingId = null; pendingBase64 = null;

    document.getElementById('modal-titulo').textContent = 'Agregar Producto';
    document.getElementById('btn-guardar').innerHTML    = "<i class='bx bx-plus'></i> Crear Producto";
    document.getElementById('producto-form').reset();
    resetPreview();

    document.getElementById('producto-modal').style.display = 'flex';
}

function abrirEditar(id) {
    const p = productosCache.find(x => x.id === id);
    if (!p) return;

    editingId = p.id; pendingBase64 = null;

    document.getElementById('modal-titulo').textContent = 'Editar Producto';
    document.getElementById('btn-guardar').innerHTML    = "<i class='bx bx-save'></i> Guardar Cambios";
    document.getElementById('f-nombre').value           = p.nombre;
    document.getElementById('f-precio').value           = p.precio;
    document.getElementById('f-inventario').value       = p.inventario;
    document.getElementById('f-etiqueta').value         = p.etiqueta || '';
    document.getElementById('f-description').value      = p.description;

    if (p.imagen) {
        document.getElementById('preview-imagen').src              = `data:image/jpeg;base64,${p.imagen.replace(/\s/g, '')}`;
        document.getElementById('preview-imagen').style.display    = 'block';
        document.getElementById('upload-placeholder').style.display = 'none';
    } else {
        resetPreview();
    }

    document.getElementById('producto-modal').style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('producto-modal').style.display = 'none';
    document.getElementById('producto-form').reset();
    resetPreview();
    editingId = null; pendingBase64 = null;
}

async function guardarProducto(e) {
    e.preventDefault();

    const btn = document.getElementById('btn-guardar');
    btn.disabled = true;
    btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Guardando...";

    const body = {
        nombre:      document.getElementById('f-nombre').value.trim(),
        precio:      Number(document.getElementById('f-precio').value),
        inventario:  Number(document.getElementById('f-inventario').value),
        etiqueta:    document.getElementById('f-etiqueta').value.trim() || null,
        description: document.getElementById('f-description').value.trim()
    };

    if (pendingBase64 !== null) {
        body.imagen = pendingBase64;
    } else if (!editingId) {
        body.imagen = null;
    }

    try {
        const url    = editingId ? `${API.productos}/${editingId}` : API.productos;
        const method = editingId ? 'PUT' : 'POST';

        const res  = await fetch(url, { method, headers: authH(), body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar.');

        toast(editingId ? '✅ Producto actualizado' : '✅ Producto creado', 'success');
        cerrarModal();
        cargarProductos();
    } catch (err) {
        toast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = editingId
            ? "<i class='bx bx-save'></i> Guardar Cambios"
            : "<i class='bx bx-plus'></i> Crear Producto";
    }
}

function previewImagen(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        pendingBase64 = ev.target.result.split(',')[1];

        document.getElementById('preview-imagen').src              = ev.target.result;
        document.getElementById('preview-imagen').style.display    = 'block';
        document.getElementById('upload-placeholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function resetPreview() {
    document.getElementById('preview-imagen').src              = '';
    document.getElementById('preview-imagen').style.display    = 'none';
    document.getElementById('upload-placeholder').style.display = 'flex';
    document.getElementById('file-imagen').value = '';
}

function abrirDelete(id) {
    deleteTargetId = id;
    const p = productosCache.find(x => x.id === id);
    document.getElementById('delete-nombre').textContent = p
        ? `"${p.nombre}" se eliminará permanentemente.`
        : 'Este producto se eliminará permanentemente.';
    document.getElementById('delete-modal').style.display = 'flex';
}

function cerrarDeleteModal() {
    deleteTargetId = null;
    document.getElementById('delete-modal').style.display = 'none';
}

async function confirmarDelete() {
    if (!deleteTargetId) return;

    try {
        const res = await fetch(`${API.productos}/${deleteTargetId}`, {
            method:  'DELETE',
            headers: authH()
        });
        if (!res.ok) throw new Error('Error al eliminar el producto.');

        toast('🗑 Producto eliminado', 'success');
        cerrarDeleteModal();
        cargarProductos();
    } catch (err) {
        toast(err.message, 'error');
    }
}

function toast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className   = `admin-toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}
