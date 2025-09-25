import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Tipos para los datos que vienen de la API
type ValoracionAmbito = {
  nivel: string;
  titulo: string;
  puntuacion_min: number;
  puntuacion_max: number;
  texto: string;
  recomendacion: string;
};

// El tipo para cada ámbito calculado, que incluye los datos de la API
type Ambito = {
  nombre: string;
  area: string;
  puntuacion: number;
  aspecto_evaluado: string;
  puntuacionMaxima: number;
  valoraciones: ValoracionAmbito[];
};

type EvaluacionAmbitosProps = {
  ambitos: Ambito[];
  onVerEvaluacionFinal: () => void;
};

function getValoracionParaAmbito(ambito: Ambito): { titulo: string; texto: string } {
  const puntos = ambito.puntuacion;

  // La API ya nos da el array de valoraciones ordenado de mayor a menor puntuación.
  // Simplemente encontramos el primer nivel que cumple la condición.
  const valoracionEncontrada = ambito.valoraciones.find(v => puntos >= v.puntuacion_min);

  if (valoracionEncontrada) {
    return { titulo: valoracionEncontrada.titulo, texto: valoracionEncontrada.texto };
  }

  // Si no se encuentra (p. ej. puntuación 0 y todos los mínimos son > 0), devolvemos el nivel más bajo.
  const nivelMasBajo = ambito.valoraciones[ambito.valoraciones.length - 1];
  return { titulo: nivelMasBajo?.titulo || 'N/A', texto: nivelMasBajo?.texto || 'Explicación no disponible.' };
}

export default function EvaluacionAmbitos({ ambitos, onVerEvaluacionFinal }: EvaluacionAmbitosProps) {
  // Estado para controlar qué acordeón está abierto
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

  // Manejador para abrir/cerrar el acordeón
  const toggleAccordion = (index: number) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  // ********************** EMPEZAMOS EL RETURN PARA MONTAR EL HTML ************************************* //
  return (
    <section className="resultado-container">
      <h1>Evaluación por Ámbitos</h1>

      <ul className="listado-result-amb">
        {ambitos.map((ambito, idx) => {
          const percentage = ambito.puntuacionMaxima > 0 ? (ambito.puntuacion / ambito.puntuacionMaxima) * 100 : 0;
          const valoracion = getValoracionParaAmbito(ambito); // Usamos la nueva función simplificada
          return (
            <li key={ambito.nombre}>
              <h2>{ambito.nombre} - {ambito.area}</h2>
              <div className="aspecto-evaluado-ambito">                
                <h3>Aspecto Evaluado</h3>
                <p>{ambito.aspecto_evaluado}</p>
                <p><strong>{valoracion.titulo}</strong></p>
              </div>
              <p className="score-animado">
                Tu puntuación ha sido <span className="current-score">{ambito.puntuacion}</span> de {ambito.puntuacionMaxima} puntos.
              </p>
              
              
              <div className="resultado-desc fade-in">
                <p className="valoracion-ambito" >Obtuviste una valoración de <strong>{valoracion.titulo || 'N/A'}</strong>.</p>

                <div className="progress-bar-animada-container">
                <motion.div
                  className="progress-bar-animada"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
                </div>

                <div className="accordion-ambito">
                  <button onClick={() => toggleAccordion(idx)} className={`accordion-toggle ${openAccordion === idx ? 'active' : ''}`} aria-expanded={openAccordion === idx}>
                    {openAccordion === idx ? 'Ver menos' : 'Ver explicación'}
                  </button>
                <AnimatePresence initial={false}>
                  {openAccordion === idx && (
                    <motion.section
                      key="content"
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                        open: { opacity: 1, height: 'auto' },
                        collapsed: { opacity: 0, height: 0 },
                      }}
                      transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="accordion-content">
                        <p>{valoracion.texto || 'Explicación no disponible.'}</p>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>
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
