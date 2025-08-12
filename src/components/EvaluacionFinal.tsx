import React, { useEffect, useState } from "react";
import { generarPDF } from "../utils/generarPDF";

type Respuesta = {
  id: number;
  texto: string;
  peso: number;
};

type Pregunta = {
  id: number;
  titulo: string;
  pregunta: string;
  ambito: { fase: string };
  respuestas: Respuesta[];
};

type Ambito = {
  nombre: string;
  area: string;
  puntuacion: number;
  puntuacionMaxima: number;
};

type EvaluacionFinalProps = {
  ambitos: Ambito[];
  puntuacionFinal: number;
  puntuacionMaxima: number;
  preguntas: Pregunta[];
  respuestasUsuario: { [key: number]: number };
};

export default function EvaluacionFinal({ ambitos, puntuacionFinal, puntuacionMaxima, preguntas, respuestasUsuario }: EvaluacionFinalProps) {
  // Animaciones para ámbitos
  const [animatedScores, setAnimatedScores] = useState<number[]>(ambitos.map(() => 0));
  const [animatedPercents, setAnimatedPercents] = useState<number[]>(ambitos.map(() => 0));
  // Animación para puntuación final
  const [animatedFinal, setAnimatedFinal] = useState(0);
  // Estado para mostrar la modal de despedida
  const [mostrarModal, setMostrarModal] = useState(false);

  // Función para calcular la valoración según la puntuación
  function calcularValoracion(puntos: number) {
    if (puntos >= 19) {
      return {
        valoracion: "ALTO COMPROMISO",
        descripcion: "Compromiso y acción"
      };
    } else if (puntos >= 12) {
      return {
        valoracion: "MEDIO COMPROMISO", 
        descripcion: "Compromiso incipiente"
      };
    } else if (puntos >= 8) {
      return {
        valoracion: "BAJO COMPROMISO",
        descripcion: "No se posiciona ni actúa"
      };
    } else {
      return {
        valoracion: "COMPROMISO NULO",
        descripcion: "Rechazo, negacionismo."
      };
    }
  }

  const valoracionFinal = calcularValoracion(puntuacionFinal);

  useEffect(() => {
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
          setAnimatedScores(prev => {
            const next = [...prev];
            next[idx] = ambito.puntuacion;
            return next;
          });
          setAnimatedPercents(prev => {
            const next = [...prev];
            next[idx] = (ambito.puntuacion / ambito.puntuacionMaxima) * 100;
            return next;
          });
        }
      };
      frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
    });
    // Animación para puntuación final
    let frameFinal: number;
    const durationFinal = 1500;
    const startTimeFinal = performance.now();
    const animateFinal = (now: number) => {
      const elapsed = now - startTimeFinal;
      const progress = Math.min(elapsed / durationFinal, 1);
      setAnimatedFinal(Math.round(progress * puntuacionFinal));
      if (progress < 1) {
        frameFinal = requestAnimationFrame(animateFinal);
      } else {
        setAnimatedFinal(puntuacionFinal);
      }
    };
    frameFinal = requestAnimationFrame(animateFinal);
    return () => cancelAnimationFrame(frameFinal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambitos, puntuacionFinal]);

  function handleDescargarPDF() {
    // Llamar a generarPDF con los datos correctos
    generarPDF(preguntas, respuestasUsuario, "Colaborador");
    setMostrarModal(true);
  }

  function handleCerrarModal() {
    setMostrarModal(false);
    window.location.href = "/";
  }

  // ********************** EMPEZAMOS EL RETURN PARA MONTAR EL HTML ************************************* //
  return (
    <section className="resultado-container">
      <h2>Evaluación Final</h2>
      <ul>
        {ambitos.map((ambito, idx) => (
          <li key={ambito.nombre}>
            <span>{ambito.nombre} - {ambito.area}</span>
            <div className="progress-bar-animada-container">
              <div
                className="progress-bar-animada"
                style={{ 
                  width: `${animatedPercents[idx]}%`,
                  animation: 'none' // Desactivar la animación CSS automática
                }}
              />
            </div>
            <span className="score-animado">{animatedScores[idx]} / {ambito.puntuacionMaxima}</span>
          </li>
        ))}
      </ul>
      
      <div className="puntuacion-final">
        <strong className="score-animado final">Puntuación final: {animatedFinal} / {puntuacionMaxima}</strong>
      </div>

      <div className="resultado-desc fade-in">
        <p>Valoración: {valoracionFinal.valoracion}</p>
        <span className="icono-alerta" aria-hidden="true">⚠️ {valoracionFinal.descripcion}</span>
      </div>

      <p className="texto-placeholder">Aquí irá un texto explicativo sobre la evaluación final.</p>
      <button className="btn-sig-amb"onClick={handleDescargarPDF}>Descarga tu evaluación detallada en PDF</button>
      {mostrarModal && (
        <div className="modal-final">
          <div>
            <h2>¡Gracias por completar la encuesta!</h2>
            <p>Puedes cerrar la encuesta y volver a la página principal.</p>
            <div className="botones-final">
              <button className="btn-sig-amb" onClick={handleCerrarModal}>Cerrar encuesta</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}