"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { generarPDF } from "@/utils/generarPDF";
import type { Pregunta } from "@/types";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  preguntas: Pregunta[];
  respuestasUsuario: { [key: number]: number };
};

export default function EncuestaModalFinal({ preguntas, respuestasUsuario }: Props) {
  const [fase, setFase] = useState<1 | 2>(1);
  const router = useRouter();

  function handleDescargarPDF() {
    //generarPDF(preguntas, respuestasUsuario);
    setTimeout(() => setFase(2), 600); // da tiempo a que inicie la descarga
  }

  function handleFinalizar() {
    router.push("/");
  }

  return (
    <div className="modal-final">
      <AnimatePresence mode="wait">
        {fase === 1 ? (
          <motion.div
            key="fase1"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="modal-contenido"
          >
            <h2>Encuesta completada</h2>
            <p>
              Gracias por tu colaboración. Puedes descargar un resumen de tus respuestas.
            </p>
            <div className="botones-final">
              <button onClick={handleDescargarPDF}>Descargar PDF</button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="fase2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="modal-contenido"
          >
            <h2>PDF descargado</h2>
            <p>
              De nuevo te damos las gracias por tu colaboración. <br />
              Ya puedes cerrar esta ventana para volver al inicio.
            </p>
            <div className="botones-final">
              <button onClick={handleFinalizar}>Finalizar encuesta</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
