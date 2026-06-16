/**
 * IncidentCard — Tarjeta de estadísticas reutilizable
 * Muestra un valor numérico con icono, etiqueta y color
 * @param {string} label - Texto descriptivo
 * @param {number} valor - Valor numérico a mostrar
 * @param {string} icon - Emoji del icono
 * @param {string} cardClass - Clase CSS para el color (card-total, card-pendiente, card-proceso, card-resuelto)
 */
function IncidentCard({ label, valor, icon, cardClass }) {
  return (
    <div className={`stat-card ${cardClass}`}>
      <div className="stat-card-icon">
        {icon}
      </div>
      <div className="stat-card-info">
        <span className="stat-card-value">{valor}</span>
        <span className="stat-card-label">{label}</span>
      </div>
    </div>
  );
}

export default IncidentCard;
