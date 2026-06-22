function IncidentCard({ label, valor, icon, bg, textDark }) {
  return (
    <div className={`card border-0 shadow-sm h-100 bg-${bg} ${textDark ? 'text-dark' : 'text-white'}`}>
      <div className="card-body d-flex align-items-center">
        <div className="flex-shrink-0 me-3">
          <i className={`bi ${icon} fs-1 opacity-75`}></i>
        </div>
        <div>
          <h6 className="card-title mb-0 opacity-75 text-uppercase fw-semibold" style={{ fontSize: '0.8rem' }}>{label}</h6>
          <h2 className="mb-0 fw-bold">{valor}</h2>
        </div>
      </div>
    </div>
  );
}

export default IncidentCard;
