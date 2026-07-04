import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TechnicianForm from '../components/TechnicianForm';
import { getTecnicoById, createTecnico, updateTecnico } from '../services/api';

function NewTechnician() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      getTecnicoById(id)
        .then(data => {
          setInitialData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error(error);
          setLoading(false);
          alert('Error al cargar datos del técnico');
          navigate('/tecnicos');
        });
    }
  }, [id, isEditing, navigate]);

  const handleSubmit = async (formData) => {
    try {
      if (isEditing) {
        await updateTecnico(id, formData);
      } else {
        await createTecnico({
          ...formData,
          id: Math.random().toString(36).substr(2, 9)
        });
      }
      navigate('/tecnicos');
    } catch (error) {
      console.error(error);
      alert('Error al guardar el técnico');
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 fw-bold text-primary mb-1">
          {isEditing ? 'Modificar Técnico' : 'Alta de Técnico'}
        </h1>
        <p className="text-muted mb-0">
          {isEditing ? 'Actualiza los datos del personal técnico.' : 'Ingresa los datos para registrar a un nuevo técnico en el sistema.'}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <TechnicianForm 
          initialData={initialData} 
          onSubmit={handleSubmit} 
          isEditing={isEditing} 
        />
      )}
    </div>
  );
}

export default NewTechnician;
