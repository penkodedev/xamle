import React, { useEffect, useState } from "react";

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
  // Estados para animar puntuación y barra por ámbito
  const [animatedScores, setAnimatedScores] = useState<number[]>(ambitos.map(() => 0));
  const [animatedPercents, setAnimatedPercents] = useState<number[]>(ambitos.map(() => 0));

  // Función para calcular la valoración según la puntuación
  function calcularValoracion(puntos: number) {
    if (puntos >= 19) {
      return "ALTO COMPROMISO";
    } else if (puntos >= 12) {
      return "MEDIO COMPROMISO";
    } else if (puntos >= 8) {
      return "BAJO COMPROMISO";
    } else {
      return "COMPROMISO NULO";
    }
  }

  // Calcular valoración total de todos los ámbitos
  const puntuacionTotal = ambitos.reduce((acc, ambito) => acc + ambito.puntuacion, 0);
  const valoracionTotal = calcularValoracion(puntuacionTotal);

  useEffect(() => {
    // Animar puntuación y barra para cada ámbito
    ambitos.forEach((ambito, idx) => {
      let frame: number;
      const duration = 1200;
      const startTime = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        setAnimatedScores(prev => {
          const next = [...prev];
          next[idx] = Math.round(progress * ambito.puntuacion);
          return next;
        });
        
        setAnimatedPercents(prev => {
          const next = [...prev];
          const percent = ambito.puntuacionMaxima > 0 ? (ambito.puntuacion / ambito.puntuacionMaxima) * 100 : 0;
          next[idx] = progress * percent;
          return next;
        });
        
        if (progress < 1) {
          frame = requestAnimationFrame(animate);
        } else {
          // Asegurar valores finales exactos
          setAnimatedScores(prev => {
            const next = [...prev];
            next[idx] = ambito.puntuacion;
            return next;
          });
          setAnimatedPercents(prev => {
            const next = [...prev];
            const percent = ambito.puntuacionMaxima > 0 ? (ambito.puntuacion / ambito.puntuacionMaxima) * 100 : 0;
            next[idx] = percent;
            return next;
          });
        }
      };
      frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambitos]);


  // ********************** EMPEZAMOS EL RETURN PARA MONTAR EL HTML ************************************* //
  return (
    <section className="resultado-container">
      <h1>Evaluación por Ámbitos</h1>

      <ul className="listado-result-amb">
        {ambitos.map((ambito, idx) => (
          <li key={ambito.nombre}>
            <span>{ambito.nombre} - {ambito.area}</span>
            <p className="score-animado"> Tu puntuación ha sido <span className="current-score">{animatedScores[idx]}</span> de {ambito.puntuacionMaxima} puntos.</p>
            
            
            <div className="resultado-desc fade-in">
              <p className="valoracion-ambito" >Obtuviste una valoración de <strong>{calcularValoracion(ambito.puntuacion)}</strong>.</p>

              <div className="progress-bar-animada-container">
              <div
                className="progress-bar-animada"
                style={{ 
                  width: `${animatedPercents[idx]}%`,
                  animation: 'none' // Desactivar la animación CSS automática
                }}
              />
              </div>
              
              <p>Aquí irá un texto explicativo sobre la evaluación por ámbitos.
              Ese texto vendrá por la API de WordPress y será dinámico.</p>
            </div>
          </li>
        ))}
      </ul>
      
      <button className="btn-sig-amb" onClick={onVerEvaluacionFinal}>Ver evaluación final</button>
    </section>
  );
}
