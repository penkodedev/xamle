import React, { useEffect, useState } from "react";

type Ambito = {
  id: number;
  nombre: string;
  slug: string;
  area: string;
  aspecto_evaluado: string;
};

type EncuestaSidebarProps = {
  ambitoNombre: string; // espero que sea el slug para identificar
};

export default function EncuestaSidebar({ ambitoNombre }: EncuestaSidebarProps) {
  const [ambitos, setAmbitos] = useState<Ambito[]>([]);

  useEffect(() => {
    async function cargarAmbitos() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/custom/v1/ambitos`);
        const data: Ambito[] = await res.json();
        setAmbitos(data);
      } catch (error) {
        if (error) return <p>Hubo un problema al cargar los datos. Intenta de nuevo por favor.</p>;

      }
    }
    cargarAmbitos();
  }, []);

  const ambitoActivo = ambitos.find(a => a.slug === ambitoNombre || a.nombre === ambitoNombre);

  if (!ambitoActivo) return //<p>Ámbito no encontrado.</p>;

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
}
