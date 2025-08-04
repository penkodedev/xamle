"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import ResultadoAmbito from "./ResultadoAmbito";
import EncuestaModalFinal from "./EncuestaModalFinal";
import EvaluacionAmbitos from "./EvaluacionAmbitos";
import EvaluacionFinal from "./EvaluacionFinal";
import EncuestaSidebar from "./EncuestaSidebar";
import { motion, AnimatePresence } from "framer-motion";

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

type EncuestaProps = {
  onAmbitoChange?: (ambito: string) => void;
  onMostrarMensajeFinalChange?: (mostrar: boolean) => void;
  onSidebarDataChange?: (data: { ambitos: any[]; cargando: boolean }) => void;
};

type AmbitoAPI = {
  id: number;
  nombre: string;
  slug: string;
  area: string;
  aspecto_evaluado: string;
};

export default function Encuesta({ onAmbitoChange, onMostrarMensajeFinalChange, onSidebarDataChange }: EncuestaProps) {
  // Estados agrupados para mejor rendimiento
  const [encuestaData, setEncuestaData] = useState({
    preguntas: [] as Pregunta[],
    ambitos: [] as string[],
    ambitosAPI: [] as AmbitoAPI[],
    cargando: true
  });
  
  const [navegacion, setNavegacion] = useState({
    ambitoActivoIndex: 0,
    preguntaSlideIndex: 0,
    vista: 'preguntas' as 'preguntas' | 'evaluacionAmbitos' | 'evaluacionFinal'
  });
  
  const [respuestasUsuario, setRespuestasUsuario] = useState<{ [key: number]: number }>({});
  const [mostrarModalFinal, setMostrarModalFinal] = useState(false);

  // Memoizar la función de carga de datos
  const cargarDatos = useCallback(async () => {
    try {
      setEncuestaData(prev => ({ ...prev, cargando: true }));
      
      // Cargar preguntas y ámbitos en paralelo
      const [respPreguntas, resAmbitos] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/custom/v1/preguntas`),
        fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/custom/v1/ambitos`)
      ]);
      
      const datosPreguntas: Pregunta[] = await respPreguntas.json();
      const dataAmbitos: AmbitoAPI[] = await resAmbitos.json();
      const fases = Array.from(new Set(datosPreguntas.map(p => p.ambito.fase)));

      setEncuestaData({
        preguntas: datosPreguntas,
        ambitos: fases,
        ambitosAPI: dataAmbitos,
        cargando: false
      });
      
      setNavegacion(prev => ({
        ...prev,
        preguntaSlideIndex: 0,
        ambitoActivoIndex: 0
      }));
      setRespuestasUsuario({});
    } catch (error) {
      console.error("Error cargando datos:", error);
      setEncuestaData(prev => ({ ...prev, cargando: false }));
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Memoizar cálculos costosos
  const preguntasAmbito = useMemo(() => 
    encuestaData.preguntas.filter(p => p.ambito.fase === encuestaData.ambitos[navegacion.ambitoActivoIndex]),
    [encuestaData.preguntas, encuestaData.ambitos, navegacion.ambitoActivoIndex]
  );

  const mostrarMensajeFinal = useMemo(() => 
    navegacion.preguntaSlideIndex === preguntasAmbito.length,
    [navegacion.preguntaSlideIndex, preguntasAmbito.length]
  );

  // Memoizar callbacks para evitar re-renders
  const manejarRespuesta = useCallback((preguntaId: number, peso: number) => {
    setRespuestasUsuario(prev => ({ ...prev, [preguntaId]: peso }));
  }, []);

  const siguientePregunta = useCallback(() => {
    if (navegacion.preguntaSlideIndex < preguntasAmbito.length - 1) {
      setNavegacion(prev => ({ ...prev, preguntaSlideIndex: prev.preguntaSlideIndex + 1 }));
    } else {
      setNavegacion(prev => ({ ...prev, preguntaSlideIndex: preguntasAmbito.length }));
    }
  }, [navegacion.preguntaSlideIndex, preguntasAmbito.length]);

  const preguntaAnterior = useCallback(() => {
    if (navegacion.preguntaSlideIndex > 0) {
      setNavegacion(prev => ({ ...prev, preguntaSlideIndex: prev.preguntaSlideIndex - 1 }));
    }
  }, [navegacion.preguntaSlideIndex]);

  const enviarRespuestasFinales = useCallback(async () => {
    try {
      const respuestasArray = Object.entries(respuestasUsuario).map(([preguntaId, peso]) => {
        const pregunta = encuestaData.preguntas.find(p => p.id === parseInt(preguntaId));
        const respuesta = pregunta?.respuestas.find(r => r.peso === peso);
        return {
          preguntaId: parseInt(preguntaId),
          pregunta: pregunta?.pregunta || '',
          respuesta: respuesta?.texto || '',
          peso: peso,
        };
      });

      await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/custom/v1/colaboradores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuestas: respuestasArray }),
      });

      console.log("Respuestas enviadas correctamente.");
    } catch (error) {
      console.error("Error enviando respuestas finales:", error);
    }
  }, [respuestasUsuario, encuestaData.preguntas]);

  const siguienteAmbito = useCallback(async () => {
    if (navegacion.ambitoActivoIndex < encuestaData.ambitos.length - 1) {
      setNavegacion(prev => ({
        ...prev,
        ambitoActivoIndex: prev.ambitoActivoIndex + 1,
        preguntaSlideIndex: 0
      }));
    } else {
      setNavegacion(prev => ({ ...prev, vista: 'evaluacionAmbitos' }));
      await enviarRespuestasFinales();
    }
  }, [navegacion.ambitoActivoIndex, encuestaData.ambitos.length, enviarRespuestasFinales]);

  const handleVerEvaluacionFinal = useCallback(() => {
    setNavegacion(prev => ({ ...prev, vista: 'evaluacionFinal' }));
  }, []);

  const handleDescargarPDF = useCallback(() => {
    alert('Descargar PDF (lógica pendiente)');
  }, []);

  // Efectos optimizados
  useEffect(() => {
    if (encuestaData.ambitos.length && onAmbitoChange) {
      onAmbitoChange(encuestaData.ambitos[navegacion.ambitoActivoIndex]);
    }
  }, [encuestaData.ambitos, navegacion.ambitoActivoIndex, onAmbitoChange]);

  useEffect(() => {
    if (onMostrarMensajeFinalChange) {
      onMostrarMensajeFinalChange(mostrarMensajeFinal);
    }
    
    if (
      mostrarMensajeFinal &&
      navegacion.ambitoActivoIndex === encuestaData.ambitos.length - 1 &&
      navegacion.vista === 'preguntas'
    ) {
      setNavegacion(prev => ({ ...prev, vista: 'evaluacionAmbitos' }));
      enviarRespuestasFinales();
    }
  }, [mostrarMensajeFinal, onMostrarMensajeFinalChange, navegacion.ambitoActivoIndex, encuestaData.ambitos.length, navegacion.vista, enviarRespuestasFinales]);

  // Pasar datos al sidebar
  useEffect(() => {
    if (onSidebarDataChange) {
      onSidebarDataChange({
        ambitos: encuestaData.ambitosAPI,
        cargando: encuestaData.cargando
      });
    }
  }, [encuestaData.ambitosAPI, encuestaData.cargando, onSidebarDataChange]);

  if (encuestaData.cargando) return (
    <div className="loader-overlay">
      <div className="spinner" />
      <p>Preparando encuesta...</p>
    </div>
  );
  
  
  if (!encuestaData.preguntas.length) return <p>No hay preguntas disponibles.</p>;

  const respuestasAmbito = preguntasAmbito
    .map(p => respuestasUsuario[p.id])
    .filter((peso): peso is number => peso !== undefined);
  
  
  // ********************** EMPEZAMOS EL RETURN PARA MONTAR EL HTML ************************************* //
  if (navegacion.vista === 'evaluacionAmbitos') {
    // Calcular datos de ámbitos cruzando con ambitosAPI
    const ambitosData = encuestaData.ambitos
      .map(nombre => {
        const ambitoInfo = encuestaData.ambitosAPI.find(a => a.nombre === nombre || a.slug === nombre);
        const preguntasDeAmbito = encuestaData.preguntas.filter(p => p.ambito.fase === nombre);
        const puntuacion = preguntasDeAmbito.reduce((acc, p) => acc + (respuestasUsuario[p.id] || 0), 0);
        const puntuacionMaxima = preguntasDeAmbito.reduce((acc, p) => acc + Math.max(...p.respuestas.map(r => r.peso)), 0);
        return {
          nombre: ambitoInfo?.nombre || nombre,
          area: ambitoInfo?.area || '',
          puntuacion,
          puntuacionMaxima
        };
      });
    return (
      <EvaluacionAmbitos
        ambitos={ambitosData}
        onVerEvaluacionFinal={handleVerEvaluacionFinal}
      />
    );
  }

  if (navegacion.vista === 'evaluacionFinal') {
    // Calcular datos de ámbitos y puntuación final
    const ambitosData = encuestaData.ambitos
      .map(nombre => {
        const ambitoInfo = encuestaData.ambitosAPI.find(a => a.nombre === nombre || a.slug === nombre);
        const preguntasDeAmbito = encuestaData.preguntas.filter(p => p.ambito.fase === nombre);
        const puntuacion = preguntasDeAmbito.reduce((acc, p) => acc + (respuestasUsuario[p.id] || 0), 0);
        const puntuacionMaxima = preguntasDeAmbito.reduce((acc, p) => acc + Math.max(...p.respuestas.map(r => r.peso)), 0);
        return {
          nombre: ambitoInfo?.nombre || nombre,
          area: ambitoInfo?.area || '',
          puntuacion,
          puntuacionMaxima
        };
      });
    const puntuacionFinal = ambitosData.reduce((acc, a) => acc + a.puntuacion, 0);
    const puntuacionMaxima = ambitosData.reduce((acc, a) => acc + a.puntuacionMaxima, 0);
    return (
      <EvaluacionFinal
        ambitos={ambitosData}
        puntuacionFinal={puntuacionFinal}
        puntuacionMaxima={puntuacionMaxima}
        preguntas={encuestaData.preguntas}
        respuestasUsuario={respuestasUsuario}
      />
    );
  }

  return (
    <div className="encuesta-block">
          <AnimatePresence mode="wait">
            {!mostrarMensajeFinal ? (
              <motion.div
                key={`pregunta-${navegacion.preguntaSlideIndex}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="encuesta-container"
              >
            <p className="pregunta-bold">{preguntasAmbito[navegacion.preguntaSlideIndex].pregunta}</p>

            <div>
              {preguntasAmbito[navegacion.preguntaSlideIndex].respuestas.map((r, index) => (
                <label key={`respuesta-${preguntasAmbito[navegacion.preguntaSlideIndex].id}-${r.id}-${index}`}>
                  <input
                    type="radio"
                    name={`respuesta-${preguntasAmbito[navegacion.preguntaSlideIndex].id}`}
                    value={r.peso}
                    checked={respuestasUsuario[preguntasAmbito[navegacion.preguntaSlideIndex].id] === r.peso}
                    onChange={() => manejarRespuesta(preguntasAmbito[navegacion.preguntaSlideIndex].id, r.peso)}
                  />
                  {" "}{r.texto}
                </label>
              ))}
            </div>

            <div className="nav-container">
              <button onClick={preguntaAnterior} disabled={navegacion.preguntaSlideIndex === 0}>
                Anterior
              </button>

              <ul className="pagination">
                {preguntasAmbito.map((pregunta, index) => (
                  <li
                    key={`pagination-${pregunta.id}-${index}`}
                    className={index === navegacion.preguntaSlideIndex ? "page current" : "page"}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </li>
                ))}
              </ul>

              <button
                onClick={siguientePregunta}
                disabled={respuestasUsuario[preguntasAmbito[navegacion.preguntaSlideIndex].id] === undefined}
              >
                {navegacion.preguntaSlideIndex === preguntasAmbito.length - 1 ?
                  (navegacion.ambitoActivoIndex === encuestaData.ambitos.length - 1 ? "Finalizar encuesta" : "Finalizar ámbito")
                  : "Siguiente"}
              </button>
            </div>
          </motion.div>
        ) : (
          navegacion.ambitoActivoIndex < encuestaData.ambitos.length - 1 && (
            <motion.div
              key="resultado"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 1 }}
            >
              <ResultadoAmbito
                ambitoNombre={encuestaData.ambitos[navegacion.ambitoActivoIndex]}
                totalPreguntas={preguntasAmbito.length}
                onSiguienteAmbito={siguienteAmbito}
                esUltimoAmbito={navegacion.ambitoActivoIndex >= encuestaData.ambitos.length - 1}
              />
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
