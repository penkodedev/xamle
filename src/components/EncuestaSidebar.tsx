import React, { useMemo } from "react";

type Ambito = {
  id: number;
  nombre: string;
  slug: string;
  area: string;
  aspecto_evaluado: string;
};

type EncuestaSidebarProps = {
  ambitoNombre: string;
  ambitos: Ambito[]; // Recibir datos como props
  cargando?: boolean; // Estado de carga del padre
};

// Memoizar el componente para evitar re-renders innecesarios
const EncuestaSidebar = React.memo(({ ambitoNombre, ambitos, cargando = false }: EncuestaSidebarProps) => {
  // Memoizar el ámbito activo para evitar recálculos
  const ambitoActivo = useMemo(() => 
    ambitos.find(a => a.slug === ambitoNombre || a.nombre === ambitoNombre),
    [ambitos, ambitoNombre]
  );

  // No mostrar nada si está cargando o no hay datos
  if (cargando || ambitos.length === 0) {
    return null;
  }

  if (!ambitoActivo) {
    return null; // No mostrar nada si no encuentra el ámbito
  }

  return (
    <aside className="encuesta-sidebar">
      <div className="ambito-area">
        <h2>{ambitoActivo.nombre}</h2>
        <p className="formacion">{ambitoActivo.area}</p>
      </div>
      
      <div className="ambito-aspecto">
        <h2>Aspecto Evaluado</h2>
        <p>{ambitoActivo.aspecto_evaluado}</p>
      </div>
    </aside>
  );
});

// Añadir displayName para debugging
EncuestaSidebar.displayName = 'EncuestaSidebar';

export default EncuestaSidebar;
