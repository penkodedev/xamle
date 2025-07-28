"use client";

import React, { useEffect, useState } from "react";
import ResultadoAmbito from "./ResultadoAmbito";
import EncuestaModalFinal from "./EncuestaModalFinal";
import EvaluacionAmbitos from "./EvaluacionAmbitos";
import EvaluacionFinal from "./EvaluacionFinal";
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
};

type AmbitoAPI = {
  id: number;
  nombre: string;
  slug: string;
  area: string;
  aspecto_evaluado: string;
};

export default function Encuesta({ onAmbitoChange, onMostrarMensajeFinalChange }: EncuestaProps) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [ambitos, setAmbitos] = useState<string[]>([]);
  const [ambitosAPI, setAmbitosAPI] = useState<AmbitoAPI[]>([]);
  const [ambitoActivoIndex, setAmbitoActivoIndex] = useState(0);
  const [preguntaSlideIndex, setPreguntaSlideIndex] = useState(0);
  const [respuestasUsuario, setRespuestasUsuario] = useState<{ [key: number]: number }>({});
  const [cargando, setCargando] = useState(true);
  const [mostrarModalFinal, setMostrarModalFinal] = useState(false);
  const [vista, setVista] = useState<'preguntas' | 'evaluacionAmbitos' | 'evaluacionFinal'>('preguntas');

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      const respPreguntas = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/custom/v1/preguntas`);
      const datosPreguntas: Pregunta[] = await respPreguntas.json();
      const fases = Array.from(new Set(datosPreguntas.map(p => p.ambito.fase)));

      setPreguntas(datosPreguntas);
      setAmbitos(fases);
      setCargando(false);
      setPreguntaSlideIndex(0);
      setAmbitoActivoIndex(0);
      setRespuestasUsuario({});
      // Cargar ámbitos desde la API
      try {
        const resAmbitos = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/custom/v1/ambitos`);
        const dataAmbitos: AmbitoAPI[] = await resAmbitos.json();
        setAmbitosAPI(dataAmbitos);
      } catch (error) {
        setAmbitosAPI([]);
      }
    }
    cargarDatos();
  }, []);

  useEffect(() => {
    if (ambitos.length && onAmbitoChange) {
      onAmbitoChange(ambitos[ambitoActivoIndex]);
    }
  }, [ambitos, ambitoActivoIndex, onAmbitoChange]);

  const preguntasAmbito = preguntas.filter(p => p.ambito.fase === ambitos[ambitoActivoIndex]);
  const mostrarMensajeFinal = preguntaSlideIndex === preguntasAmbito.length;

  useEffect(() => {
    if (onMostrarMensajeFinalChange) {
      onMostrarMensajeFinalChange(mostrarMensajeFinal);
    }
    // Si es el último ámbito y se ha completado, ir directamente a EvaluacionAmbitos
    if (
      mostrarMensajeFinal &&
      ambitoActivoIndex === ambitos.length - 1 &&
      vista === 'preguntas'
    ) {
      setVista('evaluacionAmbitos');
      enviarRespuestasFinales();
    }
  }, [mostrarMensajeFinal, onMostrarMensajeFinalChange, ambitoActivoIndex, ambitos.length, vista]);

  function manejarRespuesta(preguntaId: number, peso: number) {
    setRespuestasUsuario(prev => ({ ...prev, [preguntaId]: peso }));
  }

  async function enviarRespuestasFinales() {
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

      await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/custom/v1/colaboradores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuestas: respuestasArray }),
      });
      

      console.log("Respuestas enviadas correctamente.");
    } catch (error) {
      console.error("Error enviando respuestas finales:", error);
    }
  }

  function siguientePregunta() {
    if (preguntaSlideIndex < preguntasAmbito.length - 1) {
      setPreguntaSlideIndex(i => i + 1);
    } else {
      setPreguntaSlideIndex(preguntasAmbito.length);
    }
  }

  function preguntaAnterior() {
    if (preguntaSlideIndex > 0) {
      setPreguntaSlideIndex(i => i - 1);
    }
  }

  async function siguienteAmbito() {
    if (ambitoActivoIndex < ambitos.length - 1) {
      setAmbitoActivoIndex(i => i + 1);
      setPreguntaSlideIndex(0);
    } else {
      // setMostrarModalFinal(true);
      // await enviarRespuestasFinales();
      setVista('evaluacionAmbitos');
      await enviarRespuestasFinales();
    }
  }

  function handleVerEvaluacionFinal() {
    setVista('evaluacionFinal');
  }

  function handleDescargarPDF() {
    // Aquí puedes llamar a tu función de generación de PDF
    // generarPDF(...)
    alert('Descargar PDF (lógica pendiente)');
  }

  if (cargando) return (
    <div className="loader-overlay">
      <div className="spinner" />
      <p>Cargando...</p>
    </div>
  );
  
  
  if (!preguntas.length) return <p>No hay preguntas disponibles.</p>;

  const respuestasAmbito = preguntasAmbito
    .map(p => respuestasUsuario[p.id])
    .filter((peso): peso is number => peso !== undefined);
  
  
  // ********************** EMPEZAMOS EL RETURN PARA MONTAR EL HTML ************************************* //
  if (vista === 'evaluacionAmbitos') {
    // Calcular datos de ámbitos cruzando con ambitosAPI
    const ambitosData = ambitos
      .map(nombre => {
        const ambitoInfo = ambitosAPI.find(a => a.nombre === nombre || a.slug === nombre);
        const preguntasDeAmbito = preguntas.filter(p => p.ambito.fase === nombre);
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

  if (vista === 'evaluacionFinal') {
    // Calcular datos de ámbitos y puntuación final
    const ambitosData = ambitos
      .map(nombre => {
        const ambitoInfo = ambitosAPI.find(a => a.nombre === nombre || a.slug === nombre);
        const preguntasDeAmbito = preguntas.filter(p => p.ambito.fase === nombre);
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
        preguntas={preguntas}
        respuestasUsuario={respuestasUsuario}
      />
    );
  }

  return (
    <div className="encuesta-block">
      <AnimatePresence mode="wait">
        {!mostrarMensajeFinal ? (
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
              {preguntasAmbito[preguntaSlideIndex].respuestas.map(r => (
                <label key={r.id}>
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
              <button onClick={preguntaAnterior} disabled={preguntaSlideIndex === 0}>
                Anterior
              </button>

              <ul className="pagination">
                {preguntasAmbito.map((pregunta, index) => (
                  <li
                    key={pregunta.id}
                    className={index === preguntaSlideIndex ? "page current" : "page"}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </li>
                ))}
              </ul>

              <button
                onClick={siguientePregunta}
                disabled={respuestasUsuario[preguntasAmbito[preguntaSlideIndex].id] === undefined}
              >
                {preguntaSlideIndex === preguntasAmbito.length - 1 ?
                  (ambitoActivoIndex === ambitos.length - 1 ? "Finalizar encuesta" : "Finalizar ámbito")
                  : "Siguiente"}
              </button>
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
