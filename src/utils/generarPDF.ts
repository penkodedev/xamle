// src/utils/generarPDF.ts

import jsPDF from "jspdf";
import logoBase64 from "@/assets/madafrica-logo-base64";
import { DatosPDF } from "@/types/index"; // Asegúrate de que la ruta a tu archivo de tipos sea correcta

/**
 * Genera un informe en PDF a partir de los datos de la evaluación.
 * @param datosParaPDF - Un objeto que contiene todos los datos necesarios para el informe.
 */
export function generarPDF(datosParaPDF: DatosPDF) {
  const {
    nombreColaborador,
    puntuacionTotal,
    ambitos,
    respuestasDetalladas,
    valoracionFinal,
  } = datosParaPDF;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 10;

  // **SOLUCIÓN**: Establecer una fuente por defecto inmediatamente después de crear el doc.
  // Esto asegura que todas las llamadas a `getTextDimensions` tengan una fuente válida.
  doc.setFont('helvetica', 'normal');

  // Tamaño del logo (ajustado)
  const logoWidth = 40;
  const logoHeight = 15;

  // Helper para añadir texto con control de saltos de página
  const addText = (text: string, options: { fontSize?: number; fontStyle?: string; textColor?: string | number; }, yOffset = 5) => {
    if (options.textColor) {
      doc.setTextColor(options.textColor);
    }

    doc.setFont('helvetica', options.fontStyle || 'normal');
    doc.setFontSize(options.fontSize || 10);
    const splitText = doc.splitTextToSize(text || '', pageWidth - margin * 2);
    const textDimensions = doc.getTextDimensions(splitText);

    if (cursorY + textDimensions.h > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin;
    }
    doc.setFontSize(options.fontSize || 10);
    doc.setFont('helvetica', options.fontStyle || 'normal');
    if (options.textColor) {
      doc.setTextColor(options.textColor);
    }

    doc.text(splitText, margin, cursorY);
    cursorY += textDimensions.h + yOffset;
  };

  // ==================================================================
  // CONSTRUCCIÓN DEL PDF
  // ==================================================================

  // --- 1. Portada ---
  doc.addImage(logoBase64, "PNG", margin, 20, logoWidth, logoHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text("Informe detallado de Autoevaluación Antirracista", pageWidth / 2, 90, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  // Se quita la línea del colaborador
  
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth / 2, 120, { align: 'center' });

  // --- 2. EVALUACIÓN DETALLADA ---
  doc.addPage();
  cursorY = margin + 5;
  addText("EVALUACIÓN DETALLADA", { fontSize: 18, fontStyle: 'bold', textColor: '#000000' }, 10);

  // Agrupar respuestas por ámbito
  const respuestasPorAmbito: { [key: string]: typeof respuestasDetalladas } = {};
  respuestasDetalladas.forEach(respuesta => {
    if (!respuestasPorAmbito[respuesta.ambitoNombre]) {
      respuestasPorAmbito[respuesta.ambitoNombre] = [];
    }
    respuestasPorAmbito[respuesta.ambitoNombre].push(respuesta);
  });

  // Iterar sobre los ámbitos en el orden original
  ambitos.forEach(ambito => {
    const ambitoNombre = ambito.nombre;
    const respuestasDelAmbito = respuestasPorAmbito[ambitoNombre];
    if (!respuestasDelAmbito || respuestasDelAmbito.length === 0) return;

    if (cursorY + 30 > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin;
    }

    addText(`${ambito.nombre}`, { fontSize: 14, fontStyle: 'bold', textColor: '#000000' }, 8);

    respuestasDelAmbito.forEach(respuesta => {
      if (cursorY + 25 > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        cursorY = margin;
      }
      addText(respuesta.aspectoEvaluadoPregunta, { fontSize: 11, fontStyle: 'bold', textColor: '#000000' }, 3);
      addText(respuesta.comentario, { fontSize: 10, textColor: '#333333' }, 8); // 'comentario' es la valoración detallada
    });

    cursorY += 5; // Espacio extra entre ámbitos
  });

  // --- 3. RECOMENDACIONES ---
  doc.addPage();
  cursorY = margin + 5;
  addText("RECOMENDACIONES", { fontSize: 18, fontStyle: 'bold', textColor: '#000000' }, 10);

  ambitos.forEach(ambito => {
    if (cursorY + 30 > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin;
    }

    addText(`${ambito.nombre}`, { fontSize: 14, fontStyle: 'bold', textColor: '#000000' }, 8);

    if (ambito.recomendacion && typeof ambito.recomendacion === 'string') {
      const textoPlano = ambito.recomendacion
        .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
      addText(textoPlano, { fontSize: 10, fontStyle: 'normal', textColor: '#333333' }, 10);
    }
  });

  // Recomendación Final
  if (cursorY + 30 > doc.internal.pageSize.getHeight() - margin) {
    doc.addPage();
    cursorY = margin;
  }
  addText("RECOMENDACIÓN FINAL", { fontSize: 14, fontStyle: 'bold', textColor: '#000000' }, 8);
  if (valoracionFinal.recomendacion && typeof valoracionFinal.recomendacion === 'string') {
    const textoPlano = valoracionFinal.recomendacion
      .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    addText(textoPlano, { fontSize: 10, fontStyle: 'normal', textColor: '#333333' }, 8);
  } else {
    addText("No hay una recomendación final disponible.", { fontSize: 10, fontStyle: 'italic', textColor: '#333333' }, 8);
  }

  // --- Pie de página ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor('#888888');
    const text = `Página ${i} de ${pageCount}`;
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, doc.internal.pageSize.getHeight() - 10);
  }

  doc.save("evaluacion-antirracista-madafrica.pdf");
}
