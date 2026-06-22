import { useParams } from 'react-router-dom';
import IncidentForm from '../components/IncidentForm';

function NewIncident() {
  const { id } = useParams();

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 fw-bold text-primary mb-1">
          <i className={`bi ${id ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i> 
          {id ? 'Editar Incidencia' : 'Nueva Incidencia'}
        </h1>
        <p className="text-muted mb-0">
          {id
            ? 'Modifique los datos de la incidencia seleccionada'
            : 'Complete el formulario para registrar una nueva incidencia de equipo dañado'}
        </p>
      </div>

      <IncidentForm editId={id ? Number(id) : null} />
    </div>
  );
}

export default NewIncident;
