import { useState, useEffect, useContext, useMemo } from 'react';
import { getIncidents, getEquipos, getMantenimientos, getTecnicos } from '../services/api';
import { AuthContext } from '../auth/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

function Reports() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('incidencias');
  const [loading, setLoading] = useState(true);

  // Datos base
  const [incidencias, setIncidencias] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);

  // Filtros Incidencias
  const [filters, setFilters] = useState({
    fechaInicio: '',
    fechaFin: '',
    laboratorio: '',
    estado: '',
    prioridad: '',
    tecnico: '',
    equipo: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inc, eq, mants, tecs] = await Promise.all([
          getIncidents(), getEquipos(), getMantenimientos(), getTecnicos()
        ]);
        setIncidencias(inc);
        setEquipos(eq);
        setMantenimientos(mants);
        setTecnicos(tecs);
      } catch (error) {
        console.error('Error cargando datos para reportes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- HELPERS EXPORTACIÓN ---
  const addPdfHeader = (doc, title) => {
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text("UNP Soporte - Sistema de Gestión de Mantenimiento", 14, 20);
    doc.setFontSize(12);
    doc.text(title, 14, 28);
    doc.setFontSize(9);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleString();
    doc.text(`Generado por: ${user?.nombre} | Fecha: ${dateStr}`, 14, 34);
    doc.setDrawColor(200);
    doc.line(14, 37, doc.internal.pageSize.width - 14, 37);
  };

  const addPdfPagination = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount}`, 
        doc.internal.pageSize.width / 2, 
        doc.internal.pageSize.height - 10, 
        { align: 'center' }
      );
    }
  };

  const downloadExcel = (data, sheetName, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  // ==========================================
  // 1. REPORTE INCIDENCIAS
  // ==========================================
  const filteredIncidencias = useMemo(() => {
    return incidencias.filter(inc => {
      let match = true;
      if (filters.fechaInicio && new Date(inc.fecha) < new Date(filters.fechaInicio)) match = false;
      if (filters.fechaFin && new Date(inc.fecha) > new Date(filters.fechaFin)) match = false;
      if (filters.laboratorio && inc.laboratorio !== filters.laboratorio) match = false;
      if (filters.estado && inc.estado !== filters.estado) match = false;
      if (filters.prioridad && inc.prioridad !== filters.prioridad) match = false;
      if (filters.equipo && inc.codigoEquipo !== filters.equipo) match = false;
      
      if (filters.tecnico) {
        const mantsAsignados = mantenimientos.filter(m => m.incidenciaId === inc.id && m.tecnicoId === filters.tecnico);
        if (mantsAsignados.length === 0) match = false;
      }
      return match;
    });
  }, [incidencias, filters, mantenimientos]);

  const handleExportIncidenciasPDF = () => {
    const doc = new jsPDF('landscape');
    addPdfHeader(doc, "Reporte de Incidencias");
    
    const tableData = filteredIncidencias.map(inc => {
      const mant = mantenimientos.find(m => m.incidenciaId === inc.id);
      let tecNombre = 'No asignado';
      let tiempoRes = 'N/A';
      
      if (mant) {
        const t = tecnicos.find(t => t.id === mant.tecnicoId);
        if (t) tecNombre = t.nombre;
        
        if (mant.fechaInicio && mant.fechaFin) {
          const diffTime = Math.abs(new Date(mant.fechaFin) - new Date(mant.fechaInicio));
          tiempoRes = `${Math.ceil(diffTime / (1000 * 60 * 60 * 24))} días`;
        }
      }

      return [
        inc.codigoEquipo,
        inc.tipoEquipo,
        inc.laboratorio,
        inc.reportante,
        tecNombre,
        inc.prioridad,
        inc.estado,
        inc.fecha,
        mant?.fechaFin || 'N/A',
        tiempoRes
      ];
    });

    doc.autoTable({
      startY: 42,
      head: [['Código', 'Equipo', 'Lab', 'Alumno', 'Técnico', 'Prioridad', 'Estado', 'F. Registro', 'F. Cierre', 'T. Res.']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 }
    });
    addPdfPagination(doc);
    doc.save('Reporte_Incidencias.pdf');
  };

  const handleExportIncidenciasExcel = () => {
    const data = filteredIncidencias.map(inc => {
      const mant = mantenimientos.find(m => m.incidenciaId === inc.id);
      const tecNombre = mant ? (tecnicos.find(t => t.id === mant.tecnicoId)?.nombre || 'Desconocido') : 'No asignado';
      let tiempoRes = 'N/A';
      if (mant?.fechaInicio && mant?.fechaFin) {
        const diffDays = Math.ceil(Math.abs(new Date(mant.fechaFin) - new Date(mant.fechaInicio)) / (1000 * 60 * 60 * 24));
        tiempoRes = `${diffDays} días`;
      }
      return {
        Código: inc.codigoEquipo,
        Equipo: inc.tipoEquipo,
        Laboratorio: inc.laboratorio,
        Alumno: inc.reportante,
        Técnico: tecNombre,
        Prioridad: inc.prioridad,
        Estado: inc.estado,
        'Fecha Registro': inc.fecha,
        'Fecha Cierre': mant?.fechaFin || 'N/A',
        'Tiempo Resolución': tiempoRes
      };
    });
    downloadExcel(data, 'Incidencias', 'Reporte_Incidencias');
  };

  // ==========================================
  // 2. REPORTE EQUIPOS
  // ==========================================
  const equiposData = useMemo(() => {
    return equipos.map(eq => {
      const incsDelEquipo = incidencias.filter(i => i.codigoEquipo === eq.codigoPatrimonial);
      const idsIncs = incsDelEquipo.map(i => i.id);
      const mantsDelEquipo = mantenimientos.filter(m => idsIncs.includes(m.incidenciaId));
      
      const lastMant = mantsDelEquipo.sort((a,b) => new Date(b.fechaFin || 0) - new Date(a.fechaFin || 0))[0];

      return {
        Código: eq.codigoPatrimonial,
        Tipo: eq.tipo,
        Marca: eq.marca,
        Modelo: eq.modelo,
        Laboratorio: eq.laboratorio,
        Estado: eq.estado,
        'N° Incidencias': incsDelEquipo.length,
        'N° Mantenimientos': mantsDelEquipo.length,
        'Último Mantenimiento': lastMant?.fechaFin || 'Ninguno'
      };
    });
  }, [equipos, incidencias, mantenimientos]);

  const handleExportEquiposPDF = () => {
    const doc = new jsPDF('landscape');
    addPdfHeader(doc, "Reporte de Equipos");
    const body = equiposData.map(e => Object.values(e));
    doc.autoTable({
      startY: 42,
      head: [Object.keys(equiposData[0] || {})],
      body: body,
      theme: 'grid',
      styles: { fontSize: 8 }
    });
    addPdfPagination(doc);
    doc.save('Reporte_Equipos.pdf');
  };

  const handleExportEquiposExcel = () => downloadExcel(equiposData, 'Equipos', 'Reporte_Equipos');

  // ==========================================
  // 3. REPORTE TÉCNICOS
  // ==========================================
  const tecnicosData = useMemo(() => {
    return tecnicos.map(tec => {
      const asignados = mantenimientos.filter(m => m.tecnicoId === tec.id);
      const finalizados = asignados.filter(m => m.fechaFin);
      
      let tiempoPromedio = 0;
      if (finalizados.length > 0) {
        const totalDias = finalizados.reduce((acc, m) => {
          if(!m.fechaInicio) return acc;
          const diffDays = Math.ceil(Math.abs(new Date(m.fechaFin) - new Date(m.fechaInicio)) / (1000 * 60 * 60 * 24));
          return acc + diffDays;
        }, 0);
        tiempoPromedio = (totalDias / finalizados.length).toFixed(1);
      }

      const nombreCompleto = tec.nombre || `${tec.nombres || ''} ${tec.apellidos || ''}`.trim() || tec.id;
      return {
        Técnico: nombreCompleto,
        Especialidad: tec.especialidad || 'General',
        'Mants. Asignados': asignados.length,
        'Mants. Finalizados': finalizados.length,
        'T. Promedio Atención (días)': tiempoPromedio
      };
    });
  }, [tecnicos, mantenimientos]);

  const handleExportTecnicosPDF = () => {
    const doc = new jsPDF();
    addPdfHeader(doc, "Reporte de Desempeño de Técnicos");
    doc.autoTable({
      startY: 42,
      head: [Object.keys(tecnicosData[0] || {})],
      body: tecnicosData.map(t => Object.values(t)),
      theme: 'grid'
    });
    addPdfPagination(doc);
    doc.save('Reporte_Tecnicos.pdf');
  };
  const handleExportTecnicosExcel = () => downloadExcel(tecnicosData, 'Técnicos', 'Reporte_Tecnicos');

  // ==========================================
  // 4. REPORTE LABORATORIOS
  // ==========================================
  const labData = useMemo(() => {
    const labsList = [...new Set(equipos.map(e => e.laboratorio))];
    return labsList.map(lab => {
      const eqLab = equipos.filter(e => e.laboratorio === lab);
      const incLab = incidencias.filter(i => i.laboratorio === lab);
      
      const incIds = incLab.map(i => i.id);
      const mantsLab = mantenimientos.filter(m => incIds.includes(m.incidenciaId));

      return {
        Laboratorio: lab,
        'Total Equipos': eqLab.length,
        'Operativos': eqLab.filter(e => e.estado === 'Operativo').length,
        'Averiados': eqLab.filter(e => e.estado !== 'Operativo').length,
        'Incidencias Registradas': incLab.length,
        'Mantenimientos Realizados': mantsLab.length
      };
    });
  }, [equipos, incidencias, mantenimientos]);

  const handleExportLabsPDF = () => {
    const doc = new jsPDF();
    addPdfHeader(doc, "Reporte por Laboratorios");
    doc.autoTable({ startY: 42, head: [Object.keys(labData[0] || {})], body: labData.map(l => Object.values(l)), theme: 'grid' });
    addPdfPagination(doc);
    doc.save('Reporte_Laboratorios.pdf');
  };
  const handleExportLabsExcel = () => downloadExcel(labData, 'Laboratorios', 'Reporte_Laboratorios');

  // ==========================================
  // 5. REPORTE EJECUTIVO (Solo PDF)
  // ==========================================
  const handleExportEjecutivoPDF = () => {
    const doc = new jsPDF();
    addPdfHeader(doc, "Informe Ejecutivo de Mantenimiento");
    
    // Resumen General
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.setFont("helvetica", "bold");
    doc.text("1. Resumen General", 14, 45);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const resueltas = incidencias.filter(i => i.estado === 'Cerrada' || i.estado === 'Reparada');
    const tasa = incidencias.length > 0 ? ((resueltas.length / incidencias.length) * 100).toFixed(1) : 0;
    
    doc.text(`Durante el periodo analizado, el sistema registra un total de ${incidencias.length} incidencias,`, 14, 52);
    doc.text(`de las cuales el ${tasa}% han sido resueltas. El inventario consta de ${equipos.length} equipos,`, 14, 57);
    doc.text(`con ${equipos.filter(e => e.estado !== 'Operativo').length} actualmente averiados o en mantenimiento.`, 14, 62);

    // Tabla de indicadores
    doc.setFont("helvetica", "bold");
    doc.text("2. Indicadores Principales", 14, 75);
    doc.autoTable({
      startY: 80,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Equipos', equipos.length],
        ['Equipos Operativos', equipos.filter(e => e.estado === 'Operativo').length],
        ['Total de Incidencias', incidencias.length],
        ['Incidencias Pendientes / En Proceso', incidencias.length - resueltas.length],
        ['Técnicos Activos', tecnicos.length],
        ['Mantenimientos Finalizados', mantenimientos.filter(m => m.fechaFin).length]
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Conclusiones automáticas
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.text("3. Conclusiones y Diagnóstico", 14, finalY);
    
    doc.setFont("helvetica", "normal");
    const peorLab = [...labData].sort((a,b) => b.Averiados - a.Averiados)[0];
    let conclusion = `• El laboratorio que requiere mayor atención es ${peorLab ? peorLab.Laboratorio : 'N/A'}, ya que `;
    conclusion += `presenta ${peorLab ? peorLab.Averiados : 0} equipos averiados.\n`;
    if (tasa < 50) {
      conclusion += "• La tasa de resolución actual es baja, lo que indica un cuello de botella en la atención de mantenimientos.\n";
    } else {
      conclusion += "• La tasa de resolución es positiva, indicando un buen desempeño del equipo técnico.\n";
    }
    
    doc.text(doc.splitTextToSize(conclusion, 180), 14, finalY + 7);
    
    addPdfPagination(doc);
    doc.save('Informe_Ejecutivo.pdf');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 fw-bold text-primary mb-1"><i className="bi bi-file-earmark-bar-graph-fill me-2"></i> Centro de Reportes</h1>
        <p className="text-muted">Generación y exportación de información estadística y operativa.</p>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white pt-3 border-bottom">
          <ul className="nav nav-tabs card-header-tabs">
            {['incidencias', 'equipos', 'tecnicos', 'laboratorios', 'ejecutivo'].map(tab => (
              <li className="nav-item" key={tab}>
                <button 
                  className={`nav-link text-capitalize ${activeTab === tab ? 'active fw-bold' : 'text-muted'}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-body p-4">

          {/* TAB: INCIDENCIAS */}
          {activeTab === 'incidencias' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-secondary mb-0">Filtros de Búsqueda</h5>
                <div>
                  <button className="btn btn-outline-danger me-2" onClick={handleExportIncidenciasPDF}><i className="bi bi-file-pdf-fill me-1"></i> PDF</button>
                  <button className="btn btn-outline-success" onClick={handleExportIncidenciasExcel}><i className="bi bi-file-earmark-excel-fill me-1"></i> Excel</button>
                </div>
              </div>
              
              <div className="row g-3 mb-4 bg-light p-3 rounded">
                <div className="col-md-3">
                  <label className="form-label small">Desde</label>
                  <input type="date" className="form-control form-control-sm" value={filters.fechaInicio} onChange={e => setFilters({...filters, fechaInicio: e.target.value})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small">Hasta</label>
                  <input type="date" className="form-control form-control-sm" value={filters.fechaFin} onChange={e => setFilters({...filters, fechaFin: e.target.value})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small">Estado</label>
                  <select className="form-select form-select-sm" value={filters.estado} onChange={e => setFilters({...filters, estado: e.target.value})}>
                    <option value="">Todos</option>
                    <option value="Reportada">Reportada</option>
                    <option value="Revisada">Revisada</option>
                    <option value="Asignada">Asignada</option>
                    <option value="Reparada">Reparada</option>
                    <option value="Cerrada">Cerrada</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small">Prioridad</label>
                  <select className="form-select form-select-sm" value={filters.prioridad} onChange={e => setFilters({...filters, prioridad: e.target.value})}>
                    <option value="">Todas</option>
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <p className="text-muted small mb-2">Vista previa ({filteredIncidencias.length} registros encontrados)</p>
                <table className="table table-hover align-middle" style={{fontSize: '0.85rem'}}>
                  <thead className="table-light">
                    <tr>
                      <th>Código</th>
                      <th>Laboratorio</th>
                      <th>Estado</th>
                      <th>Prioridad</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidencias.slice(0,10).map(inc => (
                      <tr key={inc.id}>
                        <td><span className="fw-bold">{inc.codigoEquipo}</span></td>
                        <td>{inc.laboratorio}</td>
                        <td>{inc.estado}</td>
                        <td>{inc.prioridad}</td>
                        <td>{inc.fecha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredIncidencias.length > 10 && <p className="text-center text-muted small mt-2">Exportar para ver todos los registros...</p>}
              </div>
            </div>
          )}

          {/* TAB: EQUIPOS */}
          {activeTab === 'equipos' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-secondary mb-0">Consolidado de Inventario</h5>
                <div>
                  <button className="btn btn-outline-danger me-2" onClick={handleExportEquiposPDF}><i className="bi bi-file-pdf-fill me-1"></i> PDF</button>
                  <button className="btn btn-outline-success" onClick={handleExportEquiposExcel}><i className="bi bi-file-earmark-excel-fill me-1"></i> Excel</button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>{Object.keys(equiposData[0] || {}).map((k, i) => <th key={i}>{k}</th>)}</tr>
                  </thead>
                  <tbody>
                    {equiposData.slice(0,10).map((row, i) => (
                      <tr key={i}>{Object.values(row).map((v, idx) => <td key={idx}>{v}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TÉCNICOS */}
          {activeTab === 'tecnicos' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-secondary mb-0">Desempeño del Personal Técnico</h5>
                <div>
                  <button className="btn btn-outline-danger me-2" onClick={handleExportTecnicosPDF}><i className="bi bi-file-pdf-fill me-1"></i> PDF</button>
                  <button className="btn btn-outline-success" onClick={handleExportTecnicosExcel}><i className="bi bi-file-earmark-excel-fill me-1"></i> Excel</button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>{Object.keys(tecnicosData[0] || {}).map((k, i) => <th key={i}>{k}</th>)}</tr>
                  </thead>
                  <tbody>
                    {tecnicosData.map((row, i) => (
                      <tr key={i}>{Object.values(row).map((v, idx) => <td key={idx}>{v}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: LABORATORIOS */}
          {activeTab === 'laboratorios' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-secondary mb-0">Indicadores por Laboratorio</h5>
                <div>
                  <button className="btn btn-outline-danger me-2" onClick={handleExportLabsPDF}><i className="bi bi-file-pdf-fill me-1"></i> PDF</button>
                  <button className="btn btn-outline-success" onClick={handleExportLabsExcel}><i className="bi bi-file-earmark-excel-fill me-1"></i> Excel</button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>{Object.keys(labData[0] || {}).map((k, i) => <th key={i}>{k}</th>)}</tr>
                  </thead>
                  <tbody>
                    {labData.map((row, i) => (
                      <tr key={i}>{Object.values(row).map((v, idx) => <td key={idx}>{v}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: EJECUTIVO */}
          {activeTab === 'ejecutivo' && (
            <div className="text-center py-5">
              <i className="bi bi-file-earmark-richtext text-primary mb-3 d-block" style={{fontSize: '4rem'}}></i>
              <h4 className="fw-bold">Informe Ejecutivo Automático</h4>
              <p className="text-muted w-75 mx-auto">
                Este reporte genera un documento en PDF formateado profesionalmente que resume la situación general del mantenimiento, 
                indicadores clave, y genera conclusiones automáticas basadas en la cantidad de averías e incidencias resueltas.
              </p>
              <button className="btn btn-primary btn-lg mt-3" onClick={handleExportEjecutivoPDF}>
                <i className="bi bi-cloud-arrow-down-fill me-2"></i> Generar y Descargar PDF
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Reports;
