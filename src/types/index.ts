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