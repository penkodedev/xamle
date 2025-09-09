// src/utils/generarPDF.ts

import jsPDF from "jspdf";
import logoBase64 from "@/assets/madafrica-logo-base64";
import { DatosPDF } from "@/types";

/**
 * Genera un informe en PDF a partir de los datos de la evaluación.
 * @param datosParaPDF - Un objeto que contiene todos los datos necesarios para el informe.
 */
export function generarPDF(datosParaPDF: DatosPDF) {
  const {
    nombreColaborador,
    ambitos,
  } = datosParaPDF;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 10;

  // Tamaño del logo (ajustado)
  const logoWidth = 40;
  const logoHeight = 15;

  // Helper para añadir texto con control de saltos de página
  const addText = (text: string, options: { fontSize?: number; fontStyle?: string; textColor?: string | number }, yOffset = 5) => {
    const splitText = doc.splitTextToSize(text, pageWidth - margin * 2);
    const textDimensions = doc.getTextDimensions(splitText, { fontSize: options.fontSize || 10, font: options.fontStyle || 'normal' });

    if (cursorY + textDimensions.h > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        cursorY = margin;
    }
    doc.setFontSize(options.fontSize || 10);
    doc.setFont(doc.getFont().fontName, options.fontStyle || 'normal');
    doc.setTextColor(String(options.textColor || '#000000')); // Negro por defecto
    doc.text(splitText, margin, cursorY);
    cursorY += textDimensions.h + yOffset;
  };

  // ==================================================================
  // CONSTRUCCIÓN DEL PDF
  // ==================================================================

  // --- 1. Portada ---
  doc.addImage(logoBase64, "PNG", margin, 20, logoWidth, logoHeight);
  doc.setFontSize(22);
  // CORRECCIÓN 1: No se puede usar 'undefined'. Usamos la fuente actual del documento.
  doc.setFont(doc.getFont().fontName, 'bold');
  doc.text("Informe de Autoevaluación Antirracista", pageWidth / 2, 90, { align: 'center' });
  
  doc.setFontSize(14);
  // CORRECCIÓN 2: Mismo problema aquí.
  doc.setFont(doc.getFont().fontName, 'normal');
  doc.text(`Colaborador/a: ${nombreColaborador || "No disponible"}`, pageWidth / 2, 110, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth / 2, 120, { align: 'center' });

  // --- 2. Detalle por Ámbito ---
  doc.addPage();
  cursorY = margin;
  addText("Análisis y Recomendaciones por Ámbito", { fontSize: 18, fontStyle: 'bold' }, 15);

  ambitos.forEach(ambito => {
    // --- INICIO DE LA CORRECCIÓN DE FORMATO ---
    // Función para dibujar un ámbito completo
    const dibujarAmbito = () => {
      // Nombre del Ámbito y Área
      addText(`${ambito.nombre} (${ambito.area})`, { fontSize: 14, fontStyle: 'bold', textColor: '#313131' }, 10);
      
      // Aspecto Evaluado
      addText('Aspecto Evaluado:', { fontSize: 11, fontStyle: 'bold' }, 5);
      addText(ambito.valoracion.texto, { fontSize: 10 }, 10);
      
      // Valoración de Compromiso
      addText('Nivel de Compromiso:', { fontSize: 11, fontStyle: 'bold' }, 5);
      addText(ambito.valoracion.titulo || 'No disponible', { fontSize: 10, fontStyle: 'italic' }, 10);
      
      // Recomendación para PDF
      if (ambito.recomendacion) {
          addText('Recomendaciones:', { fontSize: 11, fontStyle: 'bold' }, 5);
          const textoPlano = ambito.recomendacion
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/p>/gi, '\n')
              .replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
              .trim();
          addText(textoPlano, { fontSize: 10, fontStyle: 'normal' }, 10);
      }
    };

    // 1. Intento de dibujado para ver si cabe
    const yFinEstimado = cursorY + 100; // Una estimación conservadora
    if (yFinEstimado > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin;
    }

    // 2. Dibujar el ámbito
    dibujarAmbito();

    // 3. Añadir separador y espacio para el siguiente
    doc.setDrawColor(220); // Gris más claro
    doc.line(margin, cursorY + 5, pageWidth - margin, cursorY + 5);
    cursorY += 15; // Espacio después del separador
    // --- FIN DE LA CORRECCIÓN DE FORMATO ---
  });

  // --- Pie de página ---
  const pageCount = doc.internal.getNumberOfPages();
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
