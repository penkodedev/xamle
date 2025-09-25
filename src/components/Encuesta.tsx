"use client";

import React, { useEffect, useReducer, useCallback, useMemo } from "react";
import ResultadoAmbito from "./ResultadoAmbito";
import EvaluacionAmbitos from "./EvaluacionAmbitos";
import EvaluacionFinal from "./EvaluacionFinal";
import { motion, AnimatePresence } from 'framer-motion';
import { Pregunta } from '@/types'; // Importar el tipo unificado

type ValoracionAmbito = {
  nivel: string;
  titulo: string;
  puntuacion_min: number;
  puntuacion_max: number;
  texto: string;
  recomendacion: string;
};

type AmbitoAPI = {
  id: number;
  nombre: string;
  slug: string;
  area: string;
  aspecto_evaluado: string;
  valoraciones: ValoracionAmbito[];
};

type Valoracion = {
  titulo: string;
  puntuacion_minima: number;
  puntuacion_maxima: number;
  texto_valoracion: string;
  recomendacion: string;
};

type EncuestaProps = {
  onAmbitoChange?: (ambito: string) => void;
  onMostrarMensajeFinalChange?: (mostrar: boolean) => void;
  onSidebarDataChange?: (data: { ambitos: AmbitoAPI[]; cargando: boolean }) => void;
};

// --- Lógica del Reducer ---
type EncuestaState = {
  preguntas: Pregunta[];
  ambitos: string[];
  ambitosAPI: AmbitoAPI[];
  valoraciones: Valoracion[];
  cargando: boolean;
  ambitoActivoIndex: number;
  preguntaSlideIndex: number;
  vista: 'preguntas' | 'evaluacionAmbitos' | 'evaluacionFinal';
  respuestasUsuario: { [key: number]: number };
};

type Action =
  | { type: 'CARGA_DATOS_INICIO' }
  | { type: 'CARGA_DATOS_EXITO'; payload: { preguntas: Pregunta[]; ambitos: string[]; ambitosAPI: AmbitoAPI[]; valoraciones: Valoracion[] } }
  | { type: 'CARGA_DATOS_ERROR' }
  | { type: 'RESPONDER_PREGUNTA'; payload: { preguntaId: number; peso: number } }
  | { type: 'SIGUIENTE_PREGUNTA' }
  | { type: 'PREGUNTA_ANTERIOR' }
  | { type: 'SIGUIENTE_AMBITO' }
  | { type: 'VER_EVALUACION_AMBITOS' }
  | { type: 'VER_EVALUACION_FINAL' };

const initialState: EncuestaState = {
  preguntas: [],
  ambitos: [],
  ambitosAPI: [],
  valoraciones: [],
  cargando: true,
  ambitoActivoIndex: 0,
  preguntaSlideIndex: 0,
  vista: 'preguntas',
  respuestasUsuario: {},
};

function encuestaReducer(state: EncuestaState, action: Action): EncuestaState {
  switch (action.type) {
    case 'CARGA_DATOS_INICIO':
      return { ...state, cargando: true };
    case 'CARGA_DATOS_EXITO':
      return {
        ...initialState,
        cargando: false,
        preguntas: action.payload.preguntas,
        ambitos: action.payload.ambitos,
        ambitosAPI: action.payload.ambitosAPI,
        valoraciones: action.payload.valoraciones,
      };
    case 'CARGA_DATOS_ERROR':
      return { ...initialState, cargando: false };
    case 'RESPONDER_PREGUNTA':
      return {
        ...state,
        respuestasUsuario: {
          ...state.respuestasUsuario,
          [action.payload.preguntaId]: action.payload.peso,
        },
      };
    case 'SIGUIENTE_PREGUNTA': {
      const preguntasAmbito = state.preguntas.filter(p => p.ambito.fase === state.ambitos[state.ambitoActivoIndex]);
      const nuevoIndex = state.preguntaSlideIndex < preguntasAmbito.length ? state.preguntaSlideIndex + 1 : state.preguntaSlideIndex;
      return { ...state, preguntaSlideIndex: nuevoIndex };
    }
    case 'PREGUNTA_ANTERIOR':
      return { ...state, preguntaSlideIndex: Math.max(0, state.preguntaSlideIndex - 1) };
    case 'SIGUIENTE_AMBITO':
      return {
        ...state,
        ambitoActivoIndex: state.ambitoActivoIndex + 1,
        preguntaSlideIndex: 0,
      };
    case 'VER_EVALUACION_AMBITOS':
      return { ...state, vista: 'evaluacionAmbitos' };
    case 'VER_EVALUACION_FINAL':
      return { ...state, vista: 'evaluacionFinal' };
    default:
      return state;
  }
}

export default function Encuesta({ onAmbitoChange, onMostrarMensajeFinalChange, onSidebarDataChange }: EncuestaProps) {
  const [state, dispatch] = useReducer(encuestaReducer, initialState);
  const { preguntas, ambitos, ambitosAPI, valoraciones, cargando, ambitoActivoIndex, preguntaSlideIndex, vista, respuestasUsuario } = state;

  // Memoizamos el cálculo de los datos de los ámbitos para optimizar el rendimiento
  // Lo movemos aquí para que se llame incondicionalmente en cada render
  const ambitosData = useMemo(() => {
    return ambitos.map((nombre) => {
        const ambitoInfo = ambitosAPI.find((a) => a.nombre === nombre || a.slug === nombre);
        const preguntasDeAmbito = preguntas.filter((p) => p.ambito.fase === nombre);
        const puntuacion = preguntasDeAmbito.reduce((acc, p) => acc + (respuestasUsuario[p.id] || 0), 0); // Suma de puntos obtenidos
        const puntuacionMaxima = preguntasDeAmbito.reduce((acc, p) => acc + Math.max(...p.respuestas.map((r) => r.peso)), 0); // Suma de puntos máximos posibles
        
        return {
            nombre: ambitoInfo?.nombre ?? nombre,            
            aspecto_evaluado: ambitoInfo?.aspecto_evaluado ?? '',
            valoraciones: ambitoInfo?.valoraciones ?? [],
            puntuacion,
            puntuacionMaxima,
        };
    });
  }, [ambitos, ambitosAPI, preguntas, respuestasUsuario]);

  // Memoizar la función de carga de datos
  const cargarDatos = useCallback(async () => {
    dispatch({ type: 'CARGA_DATOS_INICIO' });
    try {
      // Cargar preguntas y ámbitos en paralelo
      const [respPreguntas, resAmbitos, resValoraciones] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/custom/v1/preguntas`),
        fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/custom/v1/ambitos`),
        fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/custom/v1/valoraciones-finales`)
      ]);
      
      if (!respPreguntas.ok || !resAmbitos.ok || !resValoraciones.ok) {
        throw new Error('Fallo al cargar los datos de la encuesta');
      }

      const datosPreguntas: Pregunta[] = await respPreguntas.json();
      const dataAmbitos: AmbitoAPI[] = await resAmbitos.json();
      const dataValoraciones: Valoracion[] = await resValoraciones.json();

      dispatch({ type: 'CARGA_DATOS_EXITO', payload: { preguntas: datosPreguntas, ambitos: dataAmbitos.map(a => a.nombre), ambitosAPI: dataAmbitos, valoraciones: dataValoraciones } });
    } catch (error) {
      console.error("Error cargando datos:", error);
      dispatch({ type: 'CARGA_DATOS_ERROR' });
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Memoizar cálculos costosos
  const preguntasAmbito = useMemo(() => 
    preguntas.filter(p => p.ambito.fase === ambitos[ambitoActivoIndex]),
    [preguntas, ambitos, ambitoActivoIndex]
  );

  const mostrarMensajeFinal = useMemo(() => 
    preguntaSlideIndex === preguntasAmbito.length && preguntasAmbito.length > 0,
    [preguntaSlideIndex, preguntasAmbito.length]
  );

  // Memoizar callbacks para evitar re-renders
  const manejarRespuesta = useCallback((preguntaId: number, peso: number) => {
    dispatch({ type: 'RESPONDER_PREGUNTA', payload: { preguntaId, peso } });
  }, []);

  const enviarRespuestasFinales = useCallback(async () => {
    let colaboradorId: string | null = null;
    try {
      const infoGuardada = localStorage.getItem('colaborador_info');
      if (infoGuardada) {
        colaboradorId = JSON.parse(infoGuardada).id;
      }
    } catch (e) { /* No hacer nada si falla el parseo */ }

    if (!colaboradorId) {
      console.error("No se encontró el ID del colaborador para enviar las respuestas.");
      return;
    }

    try {
      const respuestasArray = Object.entries(respuestasUsuario).map(([preguntaId, peso]) => {
        const pregunta = preguntas.find(p => p.id === parseInt(preguntaId));
        const respuesta = pregunta?.respuestas.find(r => r.peso === peso);
        return {
          preguntaId: parseInt(preguntaId),
          pregunta: pregunta?.pregunta || '',
          respuesta: respuesta?.texto || '',
          peso: peso,
        };
      });

      await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/custom/v1/colaboradores/${colaboradorId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuestas: respuestasArray }),
      });

      console.log("Respuestas enviadas correctamente.");
    } catch (error) {
      console.error("Error enviando respuestas finales:", error);
    }
  }, [respuestasUsuario, preguntas]);

  const siguientePregunta = useCallback(() => {
    dispatch({ type: 'SIGUIENTE_PREGUNTA' });
  }, []);

  const preguntaAnterior = useCallback(() => {
    dispatch({ type: 'PREGUNTA_ANTERIOR' });
  }, []);

  const siguienteAmbito = useCallback(async () => {
    if (ambitoActivoIndex < ambitos.length - 1) {
      dispatch({ type: 'SIGUIENTE_AMBITO' });
    } else {
      await enviarRespuestasFinales();
      dispatch({ type: 'VER_EVALUACION_AMBITOS' });
    }
  }, [ambitoActivoIndex, ambitos.length, enviarRespuestasFinales]);

  const handleVerEvaluacionFinal = useCallback(() => {
    dispatch({ type: 'VER_EVALUACION_FINAL' });
  }, []);

  // Efectos optimizados
  useEffect(() => {
    onAmbitoChange?.(ambitos[ambitoActivoIndex]);
  }, [ambitos, ambitoActivoIndex, onAmbitoChange]);

  useEffect(() => {
    onMostrarMensajeFinalChange?.(mostrarMensajeFinal);
    if (mostrarMensajeFinal && ambitoActivoIndex === ambitos.length - 1 && vista === 'preguntas') {
      enviarRespuestasFinales();
      dispatch({ type: 'VER_EVALUACION_AMBITOS' });
    }
  }, [mostrarMensajeFinal, onMostrarMensajeFinalChange, ambitoActivoIndex, ambitos.length, vista, enviarRespuestasFinales]);

  // Pasar datos al sidebar
  useEffect(() => {
    onSidebarDataChange?.({ ambitos: ambitosAPI, cargando });
  }, [ambitosAPI, cargando, onSidebarDataChange]);

  if (cargando) return (
    <div className="loader-overlay">
      <div className="spinner" />
      <p>Preparando encuesta...</p>
    </div>
  );
  
  
  if (!preguntas.length) return <p>No hay preguntas disponibles.</p>;

  // ********************** EMPEZAMOS EL RETURN PARA MONTAR EL HTML ************************************* //
  if (vista === 'evaluacionAmbitos') {
    return <EvaluacionAmbitos ambitos={ambitosData} onVerEvaluacionFinal={handleVerEvaluacionFinal} />;
  }

  if (vista === 'evaluacionFinal') {
    const puntuacionFinal = ambitosData.reduce((acc, a) => acc + a.puntuacion, 0);
    const puntuacionMaxima = ambitosData.reduce((acc, a) => acc + a.puntuacionMaxima, 0);
    return (
      <EvaluacionFinal
        ambitos={ambitosData}
        puntuacionFinal={puntuacionFinal}
        puntuacionMaxima={puntuacionMaxima}
        preguntas={preguntas}
        respuestasUsuario={respuestasUsuario}
        valoraciones={valoraciones}
      />
    );
  }

  return (
    <div className="encuesta-block" key={`ambito-${ambitoActivoIndex}`}>
          <AnimatePresence mode="wait">
            {preguntasAmbito.length > 0 && !mostrarMensajeFinal ? (
              <motion.div
                key={`pregunta-${preguntaSlideIndex}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="encuesta-container"
              >
            <p className="pregunta-bold">{preguntasAmbito[preguntaSlideIndex].pregunta}</p>

            <div>
              {preguntasAmbito[preguntaSlideIndex].respuestas.map((r, index) => (
                <label key={`respuesta-${preguntasAmbito[preguntaSlideIndex].id}-${r.id}-${index}`}>
                  <input
                    type="radio"
                    name={`respuesta-${preguntasAmbito[preguntaSlideIndex].id}`}
                    value={r.peso}
                    checked={respuestasUsuario[preguntasAmbito[preguntaSlideIndex].id] === r.peso}
                    onChange={() => manejarRespuesta(preguntasAmbito[preguntaSlideIndex].id, r.peso)}
                  />
                  {" "}{r.texto}
                </label>
              ))}
            </div>

            <div className="nav-container">
              <div className="nav-buttons">
                <button onClick={preguntaAnterior} disabled={preguntaSlideIndex === 0}>
                  Anterior
                </button>
                <button
                  onClick={siguientePregunta}
                  disabled={respuestasUsuario[preguntasAmbito[preguntaSlideIndex].id] === undefined}
                >
                  {preguntaSlideIndex === preguntasAmbito.length - 1
                    ? (ambitoActivoIndex === ambitos.length - 1 ? "Finalizar encuesta" : "Finalizar ámbito")
                    : "Siguiente"}
                </button>
              </div>

              <ul className="pagination">
                {preguntasAmbito.map((pregunta, index) => (
                  <li
                    key={`pagination-${pregunta.id}-${index}`}
                    className={index === preguntaSlideIndex ? "page current" : "page"}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ) : (
          ambitoActivoIndex < ambitos.length - 1 && (
            <motion.div
              key="resultado"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 1 }}
            >
              <ResultadoAmbito
                ambitoNombre={ambitos[ambitoActivoIndex]}
                totalPreguntas={preguntasAmbito.length}
                onSiguienteAmbito={siguienteAmbito}
                esUltimoAmbito={ambitoActivoIndex >= ambitos.length - 1}
              />
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
