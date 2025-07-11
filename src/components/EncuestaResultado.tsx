// EncuestaResultado.tsx

import React from "react";

type ResultadoProps = {
  respuestas: number[]; // Array de pesos de las respuestas dadas en el ámbito
  totalPreguntas: number;
  ambitoNombre: string;
};

export default function EncuestaResultado({ respuestas, totalPreguntas, ambitoNombre }: ResultadoProps) {
  if (respuestas.length === 0) return null;

  const suma = respuestas.reduce((acc, val) => acc + val, 0);

  // Clasificación según tabla Excel que mandas
  let valoracion = "";
  if (suma >= 19) valoracion = "ALTO COMPROMISO";
  else if (suma >= 12) valoracion = "MEDIO COMPROMISO";
  else if (suma >= 8) valoracion = "BAJO COMPROMISO";
  else valoracion = "COMPROMISO NULO";

  // Explicación tipo resumen simplificado:
  let descripcion = "";
  switch (valoracion) {
    case "ALTO COMPROMISO":
      descripcion = "Compromiso y acción";
      break;
    case "MEDIO COMPROMISO":
      descripcion = "Compromiso incipiente";
      break;
    case "BAJO COMPROMISO":
      descripcion = "No se posiciona ni actúa";
      break;
    case "COMPROMISO NULO":
      descripcion = "Rechazo, negacionismo. FACHA";
      break;
  }


  // ********************** EMPEZAMOS EL RETURN PARA MONTAR EL HTML ************************************* //
  return (
    <section className="resultado-container">

      <div className="texto-resultado">
        <p>Has completado un total de {totalPreguntas} preguntas relativas al {ambitoNombre}.
        <br></br><span className="suma-puntos"> Has tenido una puntuación de {suma} puntos </span>
        <br></br>Valoración: {valoracion}</p>
        </div>
        
        <p className="resultado-desc">
          <span className="icono-alerta" aria-hidden="true">⚠️ {descripcion}</span>
        </p>

    </section>
  );
}
