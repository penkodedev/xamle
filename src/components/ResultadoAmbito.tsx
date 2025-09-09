// ResultadoAmbito.tsx

import React from "react";

type ResultadoAmbitoProps = {
  ambitoNombre: string;
  totalPreguntas: number;
  onSiguienteAmbito: () => void;
  esUltimoAmbito: boolean;
};

export default function ResultadoAmbito({ ambitoNombre, totalPreguntas, onSiguienteAmbito, esUltimoAmbito }: ResultadoAmbitoProps) {
  
  
// ********************** EMPEZAMOS EL RETURN PARA MONTAR EL HTML ************************************* //
  return (
    <section className="resultado-container">
      <h2>Has completado las {totalPreguntas} preguntas del ámbito <span>{ambitoNombre}</span></h2>
      <button className="btn-sig-amb" onClick={onSiguienteAmbito}>
        {esUltimoAmbito ? "Finalizar encuesta" : "Pasar al siguiente ámbito"}
      </button>
    </section>
  );
}
