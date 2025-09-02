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

type EvaluacionFinalProps = {
  puntuacionFinal: number;
  puntuacionMaxima: number;
  preguntas: Pregunta[];
  respuestasUsuario: { [key: number]: number };
};

export default function EvaluacionFinal({ puntuacionFinal, puntuacionMaxima, preguntas, respuestasUsuario }: EvaluacionFinalProps) {
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
  }, [puntuacionFinal]);

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
      <h1>Evaluación Final</h1>
      <div className="puntuacion-final">
        <strong className="score-animado final">Puntuación final: {animatedFinal} / {puntuacionMaxima}</strong>
      </div>

      <div className="resultado-desc fade-in">
        <p>Valoración: {valoracionFinal.valoracion}</p>
        <span className="icono-alerta" aria-hidden="true">⚠️ {valoracionFinal.descripcion}</span>
      </div>

      <p className="texto-eval-final">Aquí irá un texto explicativo sobre la evaluación final.</p>
      <button className="btn-sig-amb"onClick={handleDescargarPDF}>Descarga en PDF tu evaluación detallada y recomendaciones</button>
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