import React, { useEffect, useState } from "react";
import { generarPDF } from "@/utils/generarPDF";

type Respuesta = {
  id: number;
  texto: string;
  peso: number;
  valoracion_detallada?: string; // Añadimos la propiedad que falta como opcional
};

type Pregunta = {
  id: number;
  titulo: string;
  pregunta: string;
  ambito: { fase: string };
  respuestas: Respuesta[];
};

type ValoracionAmbito = {
  nivel: string;
  titulo: string;
  puntuacion_min: number;
  puntuacion_max: number;
  texto: string;
  recomendacion: string;
};

type AmbitoData = {
  nombre: string;
  area: string;
  puntuacion: number;
  puntuacionMaxima: number;
  valoraciones: ValoracionAmbito[];
  aspecto_evaluado: string;
};

type Valoracion = {
  titulo: string;
  puntuacion_minima: number;
  puntuacion_maxima: number;
  texto_valoracion: string;
  recomendacion: string;
};

type EvaluacionFinalProps = {
  ambitos: AmbitoData[];
  puntuacionFinal: number;
  puntuacionMaxima: number;
  preguntas: Pregunta[];
  respuestasUsuario: { [key: number]: number };
  valoraciones: Valoracion[];
};

function getValoracionPorPuntuacion(puntos: number, valoraciones: Valoracion[]): Valoracion | null {  
  if (!valoraciones || valoraciones.length === 0) return null;

  const sortedValoraciones = [...valoraciones]
    .sort((a, b) => b.puntuacion_minima - a.puntuacion_minima)
  
  const valoracionEncontrada = sortedValoraciones.find(v => puntos >= v.puntuacion_minima);

  // Si se encuentra una valoración, se devuelve.
  // Si no (porque la puntuación es más baja que todos los mínimos),
  // se devuelve la valoración con la puntuación mínima más baja (la última del array ordenado).
  // Esto asegura que siempre haya un resultado, incluso para puntuaciones muy bajas.
  return valoracionEncontrada || sortedValoraciones[sortedValoraciones.length - 1] || null;
}

export default function EvaluacionFinal({ ambitos, puntuacionFinal, puntuacionMaxima, preguntas, respuestasUsuario, valoraciones }: EvaluacionFinalProps) {
  // Animación para puntuación final
  const [animatedScores, setAnimatedScores] = useState(ambitos.map(() => 0));
  const [animatedPercents, setAnimatedPercents] = useState(ambitos.map(() => 0));

  // Animación para puntuación final
  const [animatedFinal, setAnimatedFinal] = useState(0);
  // Estado para mostrar la modal de despedida
  const [mostrarModal, setMostrarModal] = useState(false);

  const valoracionFinal = getValoracionPorPuntuacion(puntuacionFinal, valoraciones);

  useEffect(() => {
    // Animaciones para barras de cada ámbito
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
          // Asegurar valores finales exactos al terminar la animación
          setAnimatedScores(prev => { const next = [...prev]; next[idx] = ambito.puntuacion; return next; });
          setAnimatedPercents(prev => { const next = [...prev]; next[idx] = ambito.puntuacionMaxima > 0 ? (ambito.puntuacion / ambito.puntuacionMaxima) * 100 : 0; return next; });
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
    let nombreColaborador = "Colaborador";
    try {
      const infoGuardada = localStorage.getItem('colaborador_info');
      if (infoGuardada) {
        const infoParseada = JSON.parse(infoGuardada);
        if (infoParseada.nombre) {
          nombreColaborador = infoParseada.nombre;
        }
      }
    } catch (error) {
      console.error("Error al cargar datos del colaborador desde localStorage:", error);
    }

    // Llamar a generarPDF con los datos correctos
    const datosParaPDF = {
      nombreColaborador: nombreColaborador,
      puntuacionTotal: puntuacionFinal,
      valoracionFinal: {
        titulo: valoracionFinal?.titulo || 'N/A',
        texto: valoracionFinal?.texto_valoracion || 'Sin texto',
        recomendacion: valoracionFinal?.recomendacion || 'Sin recomendación', // Ahora esto es correcto
      },
      graficoRadarBase64: '', // Dejamos esto vacío por ahora
      ambitos: ambitos.map(ambito => {
        const sortedValoraciones = [...ambito.valoraciones].sort((a, b) => b.puntuacion_min - a.puntuacion_min);
        const valoracionAmbito = sortedValoraciones.find(v => ambito.puntuacion >= v.puntuacion_min);
        return {
          nombre: ambito.nombre,
          area: ambito.area,
          aspecto_evaluado: ambito.aspecto_evaluado,
          puntuacion: ambito.puntuacion,
          puntuacionMaxima: ambito.puntuacionMaxima,
          valoracion: {
            titulo: valoracionAmbito?.titulo || 'N/A',
            texto: valoracionAmbito?.texto || 'Sin texto',
          },
          recomendacion: valoracionAmbito?.recomendacion || 'Sin recomendación', // Esto ya era correcto
          graficoBarraBase64: '', // Dejamos esto vacío por ahora
        };
      }),
      respuestasDetalladas: preguntas.map(p => {
        const respuestaPeso = respuestasUsuario[p.id];
        const respuestaSeleccionada = p.respuestas.find(r => r.peso === respuestaPeso);
        return {
          pregunta: p.pregunta,
          respuesta: respuestaSeleccionada?.texto || 'Sin respuesta',
          comentario: respuestaSeleccionada?.valoracion_detallada || '',
        };
      }),
    };
    generarPDF(datosParaPDF);
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

      <ul className="listado-result-amb final">
        {ambitos.map((ambito, idx) => (
          <li key={ambito.nombre}>
            <p>Has sumado <strong>{animatedScores[idx]}</strong> puntos en el ámbito <strong>{ambito.nombre}</strong> - {ambito.area}</p>
            <div className="progress-bar-animada-container">
              <div
                className="progress-bar-animada"
                style={{ width: `${animatedPercents[idx]}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="puntuacion-final">
        <h2 className="score-animado final">Puntuación final: {animatedFinal} / {puntuacionMaxima}</h2>
      </div>

      <div className="resultado-desc fade-in">
        <p>Obtuviste una valoración final de <strong>{valoracionFinal?.titulo || 'Calculando...'}</strong></p>
      </div>

      <div className="texto-eval-final">
        {valoracionFinal?.texto_valoracion ? (
          valoracionFinal.texto_valoracion.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))
        ) : (
          <p>Cargando recomendación...</p>
        )}
      </div>
      <button className="btn-sig-amb" onClick={handleDescargarPDF}>Descarga en PDF tu evaluación detallada y recomendaciones</button>
      <small className="msj-final-boton">Al descargar el PDF recibirás una evaluación detallada y recomendaciones para mejorar tu practica docente antiracista.</small>      {mostrarModal && (
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