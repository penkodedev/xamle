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
  const margin = 20;
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

    // 1. Decodificar entidades HTML y reemplazar etiquetas de formato por delimitadores
    let processedText = text
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      // Reemplazar etiquetas <a> por un delimitador especial que contiene la URL y el texto
      .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*?>(.*?)<\/a>/gi, '%%LINK:$1%%$2%%/LINK%%')
      .replace(/<strong>|<\/strong>|<b>|<\/b>/g, '%%') // Negrita
      .replace(/<i>|<\/i>|<em>|<\/em>/g, '##'); // Itálica

    // 2. Convertir etiquetas de bloque y listas a un marcador de salto de línea único y fiable
    processedText = processedText
      .replace(/<\/p>|<br\s*\/?>|<\/ul>|<\/li>/gi, '[BR]') // Párrafos, saltos de línea y fin de listas
      .replace(/<\/span>/gi, '[BR]') // Tratar el fin de span como un posible salto de párrafo
      .replace(/<li[^>]*>/gi, '[BR]• ') // Listas
      .replace(/<[^>]+>/g, ''); // Eliminar todas las demás etiquetas HTML
    
    // 3. Limpiar múltiples marcadores y espacios para un espaciado consistente
    processedText = processedText.replace(/(\s*\[BR\]\s*){2,}/g, '[BR]').replace(/\s+/g, ' ').trim();

    doc.setFontSize(fontSize);
    doc.setTextColor(String(textColor));

    // 4. Función para renderizar segmentos de texto, ahora con la nueva lógica
    const renderSegment = (segment: string, currentStyle: { isBold: boolean, isItalic: boolean }) => {
      if (!segment) return;

      let fontStyle = 'normal';
      if (currentStyle.isBold && currentStyle.isItalic) {
        fontStyle = 'bolditalic';
      } else if (currentStyle.isBold) fontStyle = 'bold';
      else if (currentStyle.isItalic) fontStyle = 'italic';
      doc.setFont('helvetica', fontStyle);

      // Dividir por nuestro marcador de salto de línea [BR] y espacios
      const parts = segment.split(/(\[BR\]|\s+|%%LINK:.*?%%.*?%%\/LINK%%)/g).filter(Boolean);

      parts.forEach(part => {
        if (part === '[BR]') {
          cursorY += lineHeight; // Salto de línea simple
          cursorX = margin;
          return;
        }

        // Lógica para enlaces
        if (part.startsWith('%%LINK:')) {
          const linkData = part.match(/%%LINK:(.*?)%%(.*?)%%\/LINK%%/);
          if (linkData) {
            const linkText = linkData[2];
            const linkUrl = linkData[1];
            const linkWidth = doc.getTextWidth(linkText);

            if (cursorX + linkWidth > pageWidth - margin && cursorX > margin) {
              cursorY += lineHeight;
              cursorX = margin;
            }
            doc.setTextColor('#0000FF');
            doc.setFont('helvetica', 'normal'); // Los enlaces no heredan estilo
            doc.textWithLink(linkText, cursorX, cursorY, { url: linkUrl });
            doc.line(cursorX, cursorY + 1.2, cursorX + linkWidth, cursorY + 1.2); // Subrayado manual
            doc.setTextColor(String(textColor)); // Restaurar color
            cursorX += linkWidth;
            return;
          }
        }

        // Lógica para palabras normales y espacios
        const wordWidth = doc.getTextWidth(part);
        if (cursorX + wordWidth > pageWidth - margin && cursorX > margin) {
          cursorY += lineHeight;
          cursorX = margin;
        }
        // Si es un espacio al inicio de una nueva línea, no lo pintamos
        if (part.trim() === '' && cursorX === margin) {
            return;
        }
        doc.text(part, cursorX, cursorY);
        cursorX += wordWidth;
      });
    };

    // 5. Procesar el texto por partes, ahora con el formato correcto
    const style = { isBold: false, isItalic: false };
    processedText.split('%%').forEach((boldPart, index) => {
      if (boldPart.startsWith('LINK:')) {
        renderSegment('%%' + boldPart, style);
        return;
      }
      style.isBold = index % 2 !== 0; // Alternar negrita
      boldPart.split('##').forEach((italicPart, j_index) => {
        style.isItalic = j_index % 2 !== 0;
        renderSegment(italicPart, style);
      });
    });
    
    // Salto de línea final después del bloque de texto
    cursorY += yOffset;
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

    const borderRadius = 2; // El mismo border-radius que los bloques grises
    doc.setFillColor('#FFB41D');
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, titleHeight + paddingV * 2, borderRadius, borderRadius, 'F');
    
    doc.setTextColor('#000000');
    doc.text(titleText, (pageWidth - titleWidth) / 2, cursorY + titleHeight / 2 + paddingV + 1.5); // Pequeño ajuste vertical para centrar mejor
    cursorY += titleHeight + paddingV * 2 + 4; // Reducimos el margen inferior
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
    const paddingH = 4;
    const paddingV = 4;
    const borderRadius = 2;
    const contentWidth = pageWidth - margin * 2 - paddingH * 2;
    let totalTextHeight = 0;

    // Calcular altura del título del ámbito
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const splitAmbitoTitle = doc.splitTextToSize(ambitoTitle, contentWidth - paddingH * 2);
    totalTextHeight += doc.getTextDimensions(splitAmbitoTitle).h;

    // Calcular altura del título de valoración
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const splitValoracionTitle = doc.splitTextToSize(ambito.valoracion.titulo, contentWidth - paddingH * 2);
    totalTextHeight += doc.getTextDimensions(splitValoracionTitle).h + 3; // Espacio antes

    // Calcular altura del texto de valoración
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const splitValoracionText = doc.splitTextToSize(ambito.valoracion.texto, contentWidth - paddingH * 2);
    totalTextHeight += doc.getTextDimensions(splitValoracionText).h + 2; // Espacio antes

    const blockHeight = totalTextHeight + paddingV * 2;

    // Dibujar el fondo gris redondeado con la altura total calculada
    doc.setFillColor('#efefef');
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, blockHeight, borderRadius, borderRadius, 'F');

    // Escribir los textos uno debajo del otro dentro del bloque
    let blockContentCursorY = cursorY + paddingV;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#000000');
    doc.text(splitAmbitoTitle, margin + paddingH, blockContentCursorY + doc.getTextDimensions(splitAmbitoTitle).h / splitAmbitoTitle.length);
    blockContentCursorY += doc.getTextDimensions(splitAmbitoTitle).h + 3;

    doc.setFontSize(12); // Título de valoración
    doc.text(splitValoracionTitle, margin + paddingH, blockContentCursorY + doc.getTextDimensions(splitValoracionTitle).h / splitValoracionTitle.length);
    blockContentCursorY += doc.getTextDimensions(splitValoracionTitle).h + 2;

    doc.setFontSize(10); // Texto de valoración
    doc.setFontSize(11); // Texto de valoración
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#000000');
    doc.text(splitValoracionText, margin + paddingH, blockContentCursorY + doc.getTextDimensions(splitValoracionText).h / splitValoracionText.length);

    cursorY += blockHeight + 8; // Mover cursorY después del bloque

    respuestasDelAmbito.forEach(respuesta => {
      if (cursorY + 25 > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        cursorY = margin;
      }
      addText(respuesta.aspectoEvaluadoPregunta, { fontSize: 11, fontStyle: 'bold', textColor: '#000000' }, 3);
      addText(respuesta.comentario, { fontSize: 11, textColor: '#000000' }, 8); // 'comentario' es la valoración detallada
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
      addTextWithBold(ambito.recomendacion, { fontSize: 11, textColor: '#000000' }, 10);
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
    addTextWithBold(valoracionFinal.recomendacion, { fontSize: 11, textColor: '#000000' }, 8);

  } else {
    addText("No hay una recomendación final disponible.", { fontSize: 11, fontStyle: 'italic', textColor: '#000000' }, 8);
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
