export type Respuesta = {
  id: number;
  texto: string;
  peso: number;
};

export type Pregunta = {
  id: number;
  titulo: string;
  pregunta: string;
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

export type AmbitoData = {
  nombre: string;
  area: string;
  puntuacion: number;
  puntuacionMaxima: number;
  valoraciones: ValoracionAmbito[];
  aspecto_evaluado: string;
  valoracion: {
    titulo: string;
    texto: string;
  };
  recomendacion: string;
  graficoBarraBase64: string;
};

export type DatosPDF = {
  nombreColaborador: string;
  puntuacionTotal: number;
  valoracionFinal: { titulo: string; texto: string; recomendacion: string };
  graficoRadarBase64: string; // Propiedad que faltaba
  ambitos: AmbitoData[];
  // Propiedad que faltaba para las respuestas detalladas
  respuestasDetalladas: { pregunta: string; respuesta: string; comentario: string }[];
};