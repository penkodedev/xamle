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
      doc.setTextColor(String(options.textColor));
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
      doc.setTextColor(String(options.textColor));
    }

    doc.text(splitText, margin, cursorY);
    cursorY += textDimensions.h + yOffset;
  };

  // Helper para añadir texto que puede contener negritas (<strong> o <b>)
  const addTextWithBold = (text: string, options: { fontSize?: number; textColor?: string | number; }, yOffset = 5) => {
    const { fontSize = 10, textColor = '#333333' } = options;
    const lineHeight = doc.getLineHeight() / doc.internal.scaleFactor;
    let cursorX = margin;

    // 1. Decodificar entidades HTML y normalizar saltos de línea y listas
    const decodedText = text
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<li>/gi, '\n• ') // Convertir <li> en un punto de lista
      .replace(/<\/li>/gi, '')   // Eliminar la etiqueta de cierre
      .replace(/<ul>/gi, '\n')   // Añadir un salto de línea antes de la lista
      .replace(/<\/ul>/gi, '');  // Eliminar la etiqueta de cierre

    // 2. Reemplazar etiquetas de formato por delimitadores
    const processedText = decodedText
      .replace(/<strong>|<\/strong>|<b>|<\/b>/g, '%%') // Negrita
      .replace(/<i>|<\/i>|<em>|<\/em>/g, '##'); // Itálica

    doc.setFontSize(fontSize);
    doc.setTextColor(String(textColor));

    // 3. Función para renderizar segmentos de texto
    const renderSegment = (segment: string, currentStyle: { isBold: boolean, isItalic: boolean }) => {
      // Eliminar cualquier etiqueta HTML restante
      const plainSegment = segment.replace(/<[^>]+>/g, '');
      if (!plainSegment) return;

      let fontStyle = 'normal';
      if (currentStyle.isBold && currentStyle.isItalic) fontStyle = 'bolditalic';
      else if (currentStyle.isBold) fontStyle = 'bold';
      else if (currentStyle.isItalic) fontStyle = 'italic';

      doc.setFont('helvetica', fontStyle);

      // Manejar saltos de línea dentro del segmento
      const lines = plainSegment.split('\n');
      lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
          cursorY += lineHeight;
          cursorX = margin;
        }
        const words = line.split(/\s+/);

        words.forEach(word => {
          if (!word) return;
          const wordWidth = doc.getTextWidth(word + ' ');
          if (cursorX + wordWidth > pageWidth - margin) {
            cursorY += lineHeight;
            cursorX = margin;
            if (cursorY > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              cursorY = margin;
            }
          }
          doc.text(word, cursorX, cursorY);
          cursorX += doc.getTextWidth(word + ' ');
        });
      });
    };

    // 4. Procesar el texto por partes
    const style = { isBold: false, isItalic: false };
    processedText.split('%%').forEach((boldPart, index) => {
      style.isBold = index % 2 !== 0;
      boldPart.split('##').forEach((italicPart, j_index) => {
        style.isItalic = j_index % 2 !== 0;
        renderSegment(italicPart, style);
      });
    });

    // Mover el cursor a la siguiente línea después de terminar
    cursorY += lineHeight + yOffset;
  };

  // Helper para añadir un título con fondo de color
  const addTitleWithBackground = (titleText: string) => {
    const titleFontSize = 20;
    const paddingV = 4; // Padding vertical reducido

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(titleFontSize);
    const titleWidth = doc.getTextWidth(titleText);
    const textDimensions = doc.getTextDimensions(titleText);
    const titleHeight = textDimensions.h;

    // Comprobar si cabe en la página actual
    if (cursorY + titleHeight + paddingV * 2 > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin;
    }

    doc.setFillColor('#FFB41D');
    doc.rect(margin, cursorY, pageWidth - margin * 2, titleHeight + paddingV * 2, 'F');
    
    doc.setTextColor('#000000');
    doc.text(titleText, (pageWidth - titleWidth) / 2, cursorY + titleHeight / 2 + paddingV + 2);
    cursorY += titleHeight + paddingV * 2 + 8; // Mover cursorY después del bloque
  };

  // ==================================================================
  // CONSTRUCCIÓN DEL PDF
  // ==================================================================

  // --- 1. PORTADA ---
  doc.addImage(logoBase64, "PNG", margin, 20, logoWidth, logoHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(["Informe detallado de", "Autoevaluación Antirracista"], pageWidth / 2, 90, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  // Se quita la línea del colaborador
  
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth / 2, 120, { align: 'center' });



  // --- 2. EVALUACIÓN DETALLADA ---
  doc.addPage();
  cursorY = margin + 5;
  addTitleWithBackground("EVALUACIÓN DETALLADA");

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

    // --- Bloque para el título del ámbito con fondo ---
    const ambitoTitle = `${ambito.nombre} - ${ambito.aspecto_evaluado}`;
    const paddingH = 3; // Padding horizontal (similar a 10px)
    const paddingV = 2; // Padding vertical (similar a 5px)
    const borderRadius = 3; // Border radius (similar a 8px)

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    
    // Calcular dimensiones del texto para el fondo
    const splitTitle = doc.splitTextToSize(ambitoTitle, pageWidth - margin * 2 - paddingH * 2);
    const textDimensions = doc.getTextDimensions(splitTitle);
    const blockHeight = textDimensions.h + paddingV * 2;

    // Dibujar el fondo redondeado
    doc.setFillColor('#efefef');
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, blockHeight, borderRadius, borderRadius, 'F');

    // Escribir el texto sobre el fondo
    doc.setTextColor('#000000');
    doc.text(splitTitle, margin + paddingH, cursorY + paddingV + textDimensions.h / splitTitle.length);
    cursorY += blockHeight + 5; // Mover cursorY después del bloque

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
  addTitleWithBackground("RECOMENDACIONES");

  ambitos.forEach(ambito => {
    if (cursorY + 30 > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin;
    }

    // --- Bloque para el título del ámbito con fondo (replicado para consistencia) ---
    const ambitoTitle = `${ambito.nombre} - ${ambito.aspecto_evaluado}`;
    const paddingH = 3; // Padding horizontal (similar a 10px)
    const paddingV = 2; // Padding vertical (similar a 5px)
    const borderRadius = 3; // Border radius (similar a 8px)

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);

    // Calcular dimensiones del texto para el fondo
    const splitTitle = doc.splitTextToSize(ambitoTitle, pageWidth - margin * 2 - paddingH * 2);
    const textDimensions = doc.getTextDimensions(splitTitle);
    const blockHeight = textDimensions.h + paddingV * 2;

    // Dibujar el fondo redondeado
    doc.setFillColor('#efefef');
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, blockHeight, borderRadius, borderRadius, 'F');

    // Escribir el texto sobre el fondo
    doc.setTextColor('#000000');
    doc.text(splitTitle, margin + paddingH, cursorY + paddingV + textDimensions.h / splitTitle.length);
    cursorY += blockHeight + 8; // Mover cursorY después del bloque

    if (ambito.recomendacion && typeof ambito.recomendacion === 'string') {
      addTextWithBold(ambito.recomendacion, { fontSize: 10, textColor: '#333333' }, 10);
    }
  });

  // Recomendación Final
  if (cursorY + 30 > doc.internal.pageSize.getHeight() - margin) {
    doc.addPage();
    cursorY = margin;
  }

  addTitleWithBackground("RECOMENDACIÓN FINAL");

  if (valoracionFinal.recomendacion && typeof valoracionFinal.recomendacion === 'string') {
    // Usar la función addTextWithBold para renderizar el texto
    addTextWithBold(valoracionFinal.recomendacion, { fontSize: 10, textColor: '#333333' }, 8);

  } else {
    addText("No hay una recomendación final disponible.", { fontSize: 10, fontStyle: 'italic', textColor: '#333333' }, 8);
  }



  // --- PIE DE PÁGINA ---
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
