/**
 * ============================================================
 * MÓDULO DE CLIENTES
 * ------------------------------------------------------------
 * Lista con búsqueda/filtros + formulario de registro y edición.
 * Disponible para ambos roles (RF-01).
 * ============================================================
 */
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { EncabezadoPagina, Aviso } from '../components/ui';

const TIPOS = ['Personal', 'Business', 'Express', 'Global'];

const FORMULARIO_VACIO = {
  nombre: '', apellido: '', identidad: '', telefono: '',
  email: '', direccion: '', ciudad: 'Tegucigalpa', tipo_cliente: 'Personal',
};

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [modal, setModal] = useState(null); // null | { modo: 'crear' } | { modo: 'editar', cliente }
  const [error, setError] = useState('');

  async function cargar() {
    setCargando(true);
    try {
      const parametros = new URLSearchParams();
      if (buscar) parametros.set('buscar', buscar);
      if (filtroTipo) parametros.set('tipo', filtroTipo);
      const r = await api.get(`/clientes?${parametros}`);
      setClientes(r.datos);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, [filtroTipo]); // eslint-disable-line

  return (
    <div>
      <EncabezadoPagina
        titulo="Clientes"
        subtitulo="Registro y segmentación de clientes"
        accion={
          <button className="btn btn-oro" onClick={() => setModal({ modo: 'crear' })}>
            + Nuevo cliente
          </button>
        }
      />

      {/* Filtros en una sola fila */}
      <div style={estilos.filtros}>
        <input
          style={estilos.buscador}
          placeholder="Buscar por nombre, identidad o teléfono…"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && cargar()}
        />
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={estilos.selector}>
          <option value="">Todos los segmentos</option>
          {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn btn-fantasma" onClick={cargar}>Buscar</button>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
        {cargando ? (
          <Aviso>Cargando clientes…</Aviso>
        ) : clientes.length === 0 ? (
          <Aviso>No se encontraron clientes.</Aviso>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Identidad</th>
                <th>Teléfono</th>
                <th>Ciudad</th>
                <th>Segmento</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id_cliente}>
                  <td>
                    <strong>{c.nombre} {c.apellido}</strong>
                    {c.email && <div className="texto-atenuado">{c.email}</div>}
                  </td>
                  <td>{c.identidad}</td>
                  <td>{c.telefono}</td>
                  <td>{c.ciudad}</td>
                  <td><span className="chip chip-neutro">{c.tipo_cliente}</span></td>
                  <td>
                    <span className={`chip ${c.estado === 'Activo' ? 'chip-activo' : 'chip-inactivo'}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-fantasma" style={{ padding: '6px 12px', fontSize: 13 }}
                      onClick={() => setModal({ modo: 'editar', cliente: c })}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <FormularioCliente
          modo={modal.modo}
          cliente={modal.cliente}
          alCerrar={() => setModal(null)}
          alGuardar={() => { setModal(null); cargar(); }}
        />
      )}
    </div>
  );
}

/* ---------- Formulario modal de alta / edición ---------- */

function FormularioCliente({ modo, cliente, alCerrar, alGuardar }) {
  const editando = modo === 'editar';
  const [formulario, setFormulario] = useState(
    editando
      ? { ...cliente }
      : { ...FORMULARIO_VACIO }
  );
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function campo(nombre, props = {}) {
    return (
      <div className="campo">
        <label>{props.etiqueta || nombre.toUpperCase()}</label>
        <input
          value={formulario[nombre] ?? ''}
          onChange={(e) => setFormulario({ ...formulario, [nombre]: e.target.value })}
          disabled={props.deshabilitado}
          placeholder={props.placeholder}
        />
      </div>
    );
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      if (editando) {
        await api.put(`/clientes/${cliente.id_cliente}`, formulario);
      } else {
        await api.post('/clientes', formulario);
      }
      alGuardar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={estilos.fondoModal} onClick={alCerrar}>
      <div className="tarjeta" style={estilos.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 4 }}>{editando ? 'Editar cliente' : 'Nuevo cliente'}</h3>
        <div className="linea-dorada" style={{ marginBottom: 18 }} />

        <form onSubmit={guardar} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {campo('nombre', { deshabilitado: editando })}
          {campo('apellido', { deshabilitado: editando })}
          {campo('identidad', { deshabilitado: editando, placeholder: '0801-1990-12345' })}
          {campo('telefono', { placeholder: '9988-7766' })}
          {campo('email', { etiqueta: 'CORREO' })}
          {campo('ciudad')}
          <div className="campo" style={{ gridColumn: '1 / -1' }}>
            <label>DIRECCIÓN</label>
            <input
              value={formulario.direccion ?? ''}
              onChange={(e) => setFormulario({ ...formulario, direccion: e.target.value })}
            />
          </div>
          <div className="campo">
            <label>SEGMENTO</label>
            <select
              value={formulario.tipo_cliente}
              onChange={(e) => setFormulario({ ...formulario, tipo_cliente: e.target.value })}
            >
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {editando && (
            <div className="campo">
              <label>ESTADO</label>
              <select
                value={formulario.estado}
                onChange={(e) => setFormulario({ ...formulario, estado: e.target.value })}
              >
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
            </div>
          )}

          {error && <div className="error-banner" style={{ gridColumn: '1 / -1' }}>{error}</div>}

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="button" className="btn btn-fantasma" onClick={alCerrar}>Cancelar</button>
            <button type="submit" className="btn btn-oro" disabled={guardando}>
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const estilos = {
  filtros: { display: 'flex', gap: 10, marginBottom: 18 },
  buscador: {
    flex: 1, background: 'var(--superficie-2)', border: '1px solid var(--borde)',
    borderRadius: 'var(--radio-sm)', color: 'var(--tinta-1)', padding: '10px 14px',
    fontFamily: 'var(--fuente-texto)', fontSize: 14, outline: 'none',
  },
  selector: {
    background: 'var(--superficie-2)', border: '1px solid var(--borde)',
    borderRadius: 'var(--radio-sm)', color: 'var(--tinta-1)', padding: '10px 12px',
    fontFamily: 'var(--fuente-texto)', fontSize: 14, outline: 'none',
  },
  fondoModal: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20,
  },
  modal: { width: '100%', maxWidth: 560, boxShadow: 'var(--sombra)' },
};
