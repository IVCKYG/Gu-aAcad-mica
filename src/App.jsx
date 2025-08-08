import React, { useState } from 'react';
import Papa from 'papaparse';

const bloques = [
  { nombre: 'A' }, { nombre: 'B' }, { nombre: 'C' },
  { nombre: 'D' }, { nombre: 'E' }, { nombre: 'F' }, { nombre: 'G' },
];
const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function App() {
  const inputFileRef = React.useRef();
  const [clases, setClases] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [tituloSeleccionado, setTituloSeleccionado] = useState('');
  const diasKeys = dias;

  // Cargar archivos CSV
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setSeleccionadas([]);
    setTituloSeleccionado('');
    setArchivos(files);
    let todasClases = [];
    let filesParsed = 0;
    files.forEach(file => {
      Papa.parse(file, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
        complete: (results) => {
          const filtradas = results.data.filter(clase =>
            diasKeys.some(dia => clase[dia] && String(clase[dia]).trim() !== '')
          );
          todasClases = todasClases.concat(filtradas.map(c => ({ ...c, __archivo: file.name })));
          filesParsed++;
          if (filesParsed === files.length) {
            setClases(todasClases);
            if (inputFileRef.current) inputFileRef.current.value = '';
          }
        },
      });
    });
  };

  // Quitar archivo y sus clases
  const quitarArchivo = (nombreArchivo) => {
    setArchivos(archivos.filter(f => f.name !== nombreArchivo));
    setClases(clases.filter(c => c.__archivo !== nombreArchivo));
    setSeleccionadas(seleccionadas.filter(c => c.__archivo !== nombreArchivo));
    setTituloSeleccionado('');
    if (inputFileRef.current) inputFileRef.current.value = '';
  };

  // Nombre del profesor
  const nombreProfesor = (clase) => {
    const nombre = clase['NOMBRE_PROFESOR'] ? clase['NOMBRE_PROFESOR'].split(' ')[0] : '';
    const apellido = clase['AP_PATERNO_PROFESOR'] || '';
    return `${nombre} ${apellido}`.trim();
  };

  // Agrupar seleccionadas por NRC y Sección
  const agrupadas = [];
  seleccionadas.forEach(clase => {
    const key = `${clase['NRC']}|${clase['Seccion']}`;
    let grupo = agrupadas.find(g => g.key === key);
    if (!grupo) {
      grupo = {
        key,
        Titulo: clase['Titulo'],
        Seccion: clase['Seccion'],
        NRC: clase['NRC'],
        NOMBRE_PROFESOR: clase['NOMBRE_PROFESOR'],
        AP_PATERNO_PROFESOR: clase['AP_PATERNO_PROFESOR'],
        horarios: [],
      };
      agrupadas.push(grupo);
    }
    grupo.horarios.push(clase);
  });

  // Mostrar clases en celda (seleccionadas y filtradas, agrupadas)
  const getClasesEnCelda = (bloque, dia) => {
    const seleccionadasCelda = seleccionadas.filter(c =>
      c.Bloque === bloque.nombre &&
      c[dia] && String(c[dia]).trim() !== ''
    );
    const filtradasCelda = tituloSeleccionado
      ? clases.filter(c =>
          c.Titulo === tituloSeleccionado &&
          c.Bloque === bloque.nombre &&
          c[dia] && String(c[dia]).trim() !== '' &&
          !seleccionadas.some(sel => sel.NRC === c.NRC && sel.Titulo === c.Titulo && sel.Bloque === c.Bloque)
        )
      : [];
    const todas = [...seleccionadasCelda, ...filtradasCelda];
    const grupos = [];
    todas.forEach(c => {
      const key = `${c.NRC}|${c.Titulo}|${c.Bloque}`;
      if (!grupos.some(g => g.key === key)) {
        grupos.push({ key, clase: c });
      }
    });
    if (grupos.length === 0) return null;
    return grupos.map(({ key, clase }) => (
      <div key={key + '|' + (clase.__archivo || '')} style={{ marginBottom: 8, background: '#f3f3f3', padding: 4, borderRadius: 4 }}>
        <strong>{clase.Titulo} {clase.Seccion}</strong><br />
        <span>NRC: {clase.NRC}</span><br />
        <span>{nombreProfesor(clase)}</span>
      </div>
    ));
  };

  // Cambiar materia del filtro
  const handleTituloSeleccionado = (value) => {
    setTituloSeleccionado(value);
  };

  // Títulos únicos
  const titulosUnicos = Array.from(new Set(clases.map(c => c['Titulo']))).filter(Boolean);
  const horariosMateria = clases.filter(c => c['Titulo'] === tituloSeleccionado);

  // Seleccionar/deseleccionar clase (todas con mismo NRC)
  const toggleSeleccion = (clase) => {
    const mismoNRC = clases.filter(c => c.NRC === clase.NRC);
    const yaSeleccionado = mismoNRC.every(c => seleccionadas.some(sel => sel.NRC === c.NRC));
    if (yaSeleccionado) {
      setSeleccionadas(seleccionadas.filter(sel => sel.NRC !== clase.NRC));
    } else {
      const nuevas = mismoNRC.filter(c => !seleccionadas.some(sel => sel.NRC === c.NRC && sel.Seccion === c.Seccion));
      setSeleccionadas([...seleccionadas, ...nuevas]);
    }
  };

  // Guardar/cargar horario
  const guardarHorario = () => {
    localStorage.setItem('horarioGuardado', JSON.stringify(seleccionadas));
    alert('Horario guardado correctamente.');
  };
  const cargarHorario = () => {
    if (clases.length === 0) {
      alert('Carga el CSV primero');
      return;
    }
    const guardado = localStorage.getItem('horarioGuardado');
    if (guardado) {
      setSeleccionadas(JSON.parse(guardado));
      alert('Horario cargado.');
    }
  };
  const existeHorarioGuardado = !!localStorage.getItem('horarioGuardado');

  return (
    <div style={{ position: 'relative', padding: 20, fontFamily: 'system-ui, Arial, Helvetica, sans-serif' }}>
      {/* Gif en esquina superior derecha */}
      <img src="/horario.gif" alt="Decorativo" style={{ position: 'absolute', top: 10, right: 10, maxWidth: 140, zIndex: 10 }} />
      {/* Derechos reservados centrado */}
      <div style={{ textAlign: 'center', fontWeight: 400, marginBottom: 5, fontSize: 12 }}>
        Todos los derechos reservados para Victor Lazcano Huenche 2025.
      </div>
      <h1>Calendario Semanal de Clases</h1>
      <button
        type="button"
        style={{ padding: '6px 12px', fontSize: 16, cursor: 'pointer', marginBottom: 8 }}
        onClick={() => inputFileRef.current && inputFileRef.current.click()}
      >Elegir archivos</button>
      <input
        ref={inputFileRef}
        type="file"
        accept=".csv"
        multiple
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      {archivos.length > 0 && (
        <div style={{ margin: '16px 0' }}>
          <strong>Archivos subidos:</strong>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {archivos.map((file, idx) => (
              <li key={file.name + idx} style={{ marginBottom: 4, display: 'flex', alignItems: 'center' }}>
                <span>{file.name}</span>
                <button
                  style={{ marginLeft: 8, background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: 18 }}
                  title={`Quitar ${file.name}`}
                  onClick={() => quitarArchivo(file.name)}
                >🗑️</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {clases.length === 0 && (
        <div style={{ color: '#d32f2f', marginBottom: 20 }}>
          No hay clases cargadas. Sube un archivo CSV válido.
        </div>
      )}
      <div style={{ marginBottom: 30, display: 'flex', gap: 32 }}>
        <div style={{ flex: 1, minWidth: 320, maxWidth: '45%' }}>
          <h2>Filtrar clases</h2>
          <select
            value={tituloSeleccionado}
            onChange={e => handleTituloSeleccionado(e.target.value)}
            style={{ marginBottom: 10, padding: 4, width: '90%' }}
          >
            <option value="">Selecciona una materia...</option>
            {titulosUnicos.map((titulo, idx) => (
              <option key={titulo + idx} value={titulo}>{titulo}</option>
            ))}
          </select>
          {tituloSeleccionado && (
            <div style={{ maxHeight: 350, overflowY: 'auto', border: '1px solid #ccc', padding: 8, borderRadius: 4 }}>
              {horariosMateria.length === 0 && <div style={{ color: '#888' }}>No hay horarios para esta materia.</div>}
              {Array.from(new Set(horariosMateria.map(h => h.NRC + '|' + h.Seccion))).map((key, idx) => {
                const clase = horariosMateria.find(h => (h.NRC + '|' + h.Seccion) === key);
                const seleccionada = seleccionadas.some(sel => sel.NRC === clase.NRC && sel.Seccion === clase.Seccion);
                return (
                  <div
                    key={key + idx}
                    onClick={() => toggleSeleccion(clase)}
                    style={{
                      cursor: 'pointer',
                      background: seleccionada ? '#d0f5d8' : '#fff',
                      border: seleccionada ? '2px solid #4caf50' : '1px solid #ccc',
                      marginBottom: 6,
                      padding: 6,
                      borderRadius: 4
                    }}
                  >
                    <strong>{clase['Titulo']} {clase['Seccion']}</strong> <span style={{ color: '#888' }}>NRC: {clase['NRC']}</span>
                    <br />
                    <span>{nombreProfesor(clase)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 320, maxWidth: '45%' }}>
          <h2>Clases seleccionadas</h2>
          {agrupadas.length === 0 && <div style={{ color: '#888' }}>No has seleccionado clases.</div>}
          <div style={{ maxHeight: 350, overflowY: 'auto', border: '1px solid #ccc', padding: 8, borderRadius: 4 }}>
            {agrupadas.map((grupo, idx) => (
              <div key={grupo.key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#f3f3f3', border: '1px solid #bbb', borderRadius: 4, padding: 6, marginBottom: 6
              }}>
                <div>
                  <strong>{grupo.Titulo} {grupo.Seccion}</strong> <span style={{ color: '#888' }}>NRC: {grupo.NRC}</span>
                  <br />
                  <span>{nombreProfesor(grupo)}</span>
                </div>
                <button
                  onClick={() => setSeleccionadas(seleccionadas.filter(sel => !(sel.NRC === grupo.NRC && sel.Seccion === grupo.Seccion)))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}
                  title="Quitar clase"
                >
                  <span role="img" aria-label="Eliminar" style={{ fontSize: 20, color: '#d32f2f' }}>🗑️</span>
                </button>
              </div>
            ))}
          </div>
          {agrupadas.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                onClick={() => setSeleccionadas([])}
                style={{ padding: '6px 16px', background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                Limpiar selección
              </button>
              {/* Botón de guardado eliminado */}
            </div>
          )}
        </div>
      </div>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Bloque</th>
            {dias.map(dia => (
              <th key={dia}>{dia}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bloques.map(bloque => (
            <tr key={bloque.nombre}>
              <td>{bloque.nombre}</td>
              {dias.map(dia => (
                <td key={dia} style={{ minWidth: 120, verticalAlign: 'top' }}>
                  {getClasesEnCelda(bloque, dia)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <br />
    </div>
  );
}

export default App;
