import { useParams } from 'react-router-dom';
import IncidentForm from '../components/IncidentForm';

/**
 * NewIncident — Página para crear o editar una incidencia
 * Si la URL contiene un :id, el formulario entra en modo edición
 */
function NewIncident() {
  // Obtener ID de la URL (si existe) usando useParams
  const { id } = useParams();

  return (
    <div>
      <div className="page-header">
        <h1>{id ? '✏️ Editar Incidencia' : '➕ Nueva Incidencia'}</h1>
        <p>
          {id
            ? 'Modifique los datos de la incidencia seleccionada'
            : 'Complete el formulario para registrar una nueva incidencia de equipo dañado'}
        </p>
      </div>

      {/* Componente del formulario — recibe editId si estamos editando */}
      <IncidentForm editId={id ? Number(id) : null} />
    </div>
  );
}

export default NewIncident;
