"use client";

import React, { useEffect, useState } from "react";
import EncuestaResultado from "./EncuestaResultado";
import EncuestaModalFinal from "./EncuestaModalFinal";
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
};

export default function Encuesta({ onAmbitoChange }: EncuestaProps) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [ambitos, setAmbitos] = useState<string[]>([]);
  const [ambitoActivoIndex, setAmbitoActivoIndex] = useState(0);
  const [preguntaSlideIndex, setPreguntaSlideIndex] = useState(0);
  const [respuestasUsuario, setRespuestasUsuario] = useState<{ [key: number]: number }>({});
  const [cargando, setCargando] = useState(true);
  const [mostrarModalFinal, setMostrarModalFinal] = useState(false);

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
    }
    cargarDatos();
  }, []);

  useEffect(() => {
    if (ambitos.length && onAmbitoChange) {
      onAmbitoChange(ambitos[ambitoActivoIndex]);
    }
  }, [ambitos, ambitoActivoIndex, onAmbitoChange]);

  const preguntasAmbito = preguntas.filter(p => p.ambito.fase === ambitos[ambitoActivoIndex]);

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
      setMostrarModalFinal(true);
      await enviarRespuestasFinales();
    }
  }

  async function cerrarModal() {
    setMostrarModalFinal(false);
    await enviarRespuestasFinales();
  }

  if (cargando) return (
    <div className="loader-overlay">
      <div className="spinner" />
      <p>Cargando...</p>
    </div>
  );
  
  
  if (!preguntas.length) return <p>No hay preguntas disponibles.</p>;

  const mostrarMensajeFinal = preguntaSlideIndex === preguntasAmbito.length;

  const respuestasAmbito = preguntasAmbito
    .map(p => respuestasUsuario[p.id])
    .filter((peso): peso is number => peso !== undefined);

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
                {preguntasAmbito.map((_, index) => (
                  <li
                    key={index}
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
                {preguntaSlideIndex === preguntasAmbito.length - 1 ? "Finalizar ámbito" : "Siguiente"}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="resultado"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 1 }}
          >
            <EncuestaResultado
              respuestas={respuestasAmbito}
              totalPreguntas={preguntasAmbito.length}
              ambitoNombre={ambitos[ambitoActivoIndex]}
            />
            <div>
              <button className="btn-sig-amb" onClick={siguienteAmbito}>
                {ambitoActivoIndex < ambitos.length - 1 ? "Pasar al siguiente ámbito" : "Finalizar encuesta"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mostrarModalFinal && (
        <EncuestaModalFinal
          preguntas={preguntas}
          respuestasUsuario={respuestasUsuario}
          onClose={cerrarModal}
        />
      )}
    </div>
  );
}
