export type Respuesta = {
  id: number;
  texto: string;
  peso: number;
  valoracion_detallada?: string;
};

export type Pregunta = {
  id: number;
  titulo: string;
  pregunta: string;
  aspecto_evaluado: string;
  ambito: { fase: string };
  respuestas: Respuesta[];
};

export type ValoracionAmbito = {
  nivel: string;
  titulo: string;
  puntuacion_min: number;
  puntuacion_max: number;
  texto: string;
  recomendacion: string;
};

export type ValoracionAmbitoPDF = {
  titulo: string;
  texto: string;
};

export type AmbitoPDF = {
  nombre: string;
  area: string;
  aspecto_evaluado: string;
  puntuacion: number;
  puntuacionMaxima: number;
  valoracion: ValoracionAmbitoPDF;
  recomendacion: string;
  graficoBarraBase64: string;
};

export type AmbitoData = {
  nombre: string;
  area: string;
  puntuacion: number;
  puntuacionMaxima: number;
  valoraciones: ValoracionAmbito[];
  aspecto_evaluado: string;
};

export type RespuestaDetalladaPDF = {
  ambitoNombre: string;
  ambitoArea: string;
  aspectoEvaluadoPregunta: string;
  pregunta: string;
  respuesta: string;
  comentario: string;
};

export type DatosPDF = {
  nombreColaborador: string;
  puntuacionTotal: number;
  valoracionFinal: { titulo: string; texto: string; recomendacion: string };
  graficoRadarBase64: string; // Propiedad que faltaba
  ambitos: AmbitoPDF[];
  respuestasDetalladas: RespuestaDetalladaPDF[];
};