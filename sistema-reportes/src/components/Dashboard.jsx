function Dashboard({ reportes }) {
  const total     = reportes.length;
  const pendientes = reportes.filter(r => r.estado === "Pendiente").length;
  const enProceso  = reportes.filter(r => r.estado === "En proceso").length;
  const resueltos  = reportes.filter(r => r.estado === "Resuelto").length;

  const tarjetas = [
    { label: "Total",      valor: total,      color: "#3b82f6" },
    { label: "Pendientes", valor: pendientes,  color: "#ef4444" },
    { label: "En proceso", valor: enProceso,   color: "#f59e0b" },
    { label: "Resueltos",  valor: resueltos,   color: "#22c55e" },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: "20px", color: "#1e293b" }}>Dashboard</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {tarjetas.map((t) => (
          <div key={t.label} style={{
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            borderTop: `4px solid ${t.color}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
          }}>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>{t.label}</p>
            <p style={{ fontSize: "32px", fontWeight: "600", color: t.color }}>{t.valor}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;