 // src/types.ts
 
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
 
 export type ValoracionFinalPDF = {
   titulo: string;
   texto: string;
   recomendacion: string;
 };
 
 export type RespuestaDetalladaPDF = {
   pregunta: string;
   respuesta: string;
   comentario: string;
 };
 
 export type DatosPDF = {
   nombreColaborador: string;
   puntuacionTotal: number;
   valoracionFinal: ValoracionFinalPDF;
   graficoRadarBase64: string;
   ambitos: AmbitoPDF[];
   respuestasDetalladas: RespuestaDetalladaPDF[];
 };