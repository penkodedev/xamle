import React, { useState } from "react";
import { motion } from "framer-motion";

type Ambito = {
  nombre: string;
  area: string;
  puntuacion: number;
  puntuacionMaxima: number;
};

type EvaluacionAmbitosProps = {
  ambitos: Ambito[];
  onVerEvaluacionFinal: () => void;
};

export default function EvaluacionAmbitos({ ambitos, onVerEvaluacionFinal }: EvaluacionAmbitosProps) {
  // Estado para controlar qué acordeón está abierto
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

  // Función para calcular la valoración según la puntuación
  function calcularValoracion(puntos: number) {
    if (puntos >= 19) {
      return "COMPROMISO Y ACCIÓN";
    } else if (puntos >= 12) {
      return "CONCIENCIA EN DESARROLLO";
    } else if (puntos >= 8) {
      return "NEUTRALIDAD PASIVA";
    } else {
      return "RESISTENCIA AL CAMBIO";
    }
  }

  // Manejador para abrir/cerrar el acordeón
  const toggleAccordion = (index: number) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  // Calcular valoración total de todos los ámbitos
  const puntuacionTotal = ambitos.reduce((acc, ambito) => acc + ambito.puntuacion, 0);
  const valoracionTotal = calcularValoracion(puntuacionTotal);

  // ********************** EMPEZAMOS EL RETURN PARA MONTAR EL HTML ************************************* //
  return (
    <section className="resultado-container">
      <h1>Evaluación por Ámbitos</h1>

      <ul className="listado-result-amb">
        {ambitos.map((ambito, idx) => {
          const percentage = ambito.puntuacionMaxima > 0 ? (ambito.puntuacion / ambito.puntuacionMaxima) * 100 : 0;
          return (
            <li key={ambito.nombre}>
              <span>{ambito.nombre} - {ambito.area}</span>
              <p className="score-animado"> Tu puntuación ha sido <span className="current-score">{ambito.puntuacion}</span> de {ambito.puntuacionMaxima} puntos.</p>
              
              
              <div className="resultado-desc fade-in">
                <p className="valoracion-ambito" >Obtuviste una valoración de <strong>{calcularValoracion(ambito.puntuacion)}</strong>.</p>

                <div className="progress-bar-animada-container">
                <motion.div
                  className="progress-bar-animada"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
                </div>

                <div className="accordion-ambito">
                  <button onClick={() => toggleAccordion(idx)} className="accordion-toggle" aria-expanded={openAccordion === idx}>
                    Ver explicación
                    {/* El icono puede ser un SVG o un carácter para indicar el estado */}
                    <span className={`accordion-icon ${openAccordion === idx ? 'open' : ''}`}>▼</span>
                  </button>
                  {openAccordion === idx && (
                    <div className="accordion-content">
                      <p>
                        Aquí irá un texto explicativo sobre la evaluación por ámbitos. Ese texto vendrá por la API de WordPress y será dinámico.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      
      <button className="btn-sig-amb" onClick={onVerEvaluacionFinal}>Ver evaluación final</button>
    </section>
  );
}
