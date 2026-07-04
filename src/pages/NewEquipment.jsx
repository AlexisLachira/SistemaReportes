import { useParams } from 'react-router-dom';
import EquipmentForm from '../components/EquipmentForm';

function NewEquipment() {
  const { id } = useParams();
  const isEditing = Boolean(id);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <h1 className="h3 fw-bold text-primary mb-1">
          <i className={`bi ${isEditing ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
          {isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}
        </h1>
        <p className="text-muted">
          {isEditing 
            ? 'Modifique los datos del equipo seleccionado' 
            : 'Ingrese los datos del nuevo equipo para el inventario'}
        </p>
      </div>

      <EquipmentForm editId={id} />
    </div>
  );
}

export default NewEquipment;
