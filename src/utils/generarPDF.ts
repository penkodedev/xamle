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
  let margin = 20;
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
  const addTextWithBold = (text: string, options: { fontSize?: number; textColor?: string | number; }, yOffset = 5, customMargin?: number, customWidth?: number) => {
    const { fontSize = 10, textColor = '#333333' } = options;
    const lineHeight = doc.getLineHeight() / doc.internal.scaleFactor;
    // Usa el margen personalizado si se proporciona, si no, el margen global.
    const currentMargin = customMargin !== undefined ? customMargin : margin;
    const availableWidth = customWidth !== undefined ? customWidth : (pageWidth - currentMargin * 2);
    let cursorX = currentMargin;

    // Helper para gestionar saltos de página dentro de esta función
    const checkPageBreak = (extraHeight = 0) => {
      if (cursorY + extraHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        cursorY = margin;
      }
    };

// 1. Primero decodificar TODAS las entidades HTML y caracteres Unicode escapados
    // Crear un elemento temporal para decodificar entidades HTML
    const decodeHTML = (input: string) => {
      let text = input;
      // Bucle para decodificar múltiples niveles de escapado (ej: &amp;lt; se convierte en &lt; y luego en <)
      while (text.includes('&lt;') || text.includes('&amp;')) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        text = textarea.value;
      }
      return text;
    };
    
    // 1. Decodificar el texto HTML para tener etiquetas limpias como <p>, <a>, etc.
    let processedText = decodeHTML(text);
    console.log('Texto después de decodificar HTML:', processedText.substring(0, 200));

    // 2. Ahora que tenemos HTML limpio, procesamos las etiquetas y las convertimos a nuestros delimitadores.
    //    Este orden es crucial para que los enlaces <a> se detecten correctamente.
    processedText = processedText
      // Procesar etiquetas <a> HTML y convertirlas a nuestro delimitador interno
      .replace(/<a\s+(?:[^>]*?\s+)?href=["']([^"']*?)["'][^>]*?>(.*?)<\/a>/gi, (match, url, text) => {
        console.log('Encontrado enlace:', { match, url, text });
        return `$$LINK:${url}$$${text}$$LINK$$`;
      })
      .replace(/<strong>|<\/strong>|<b>|<\/b>/g, '%%') // Negrita
      .replace(/<i>|<\/i>|<em>|<\/em>/g, '##'); // Itálica
    
    // Debug: mostrar después del procesamiento
    console.log('Texto después de procesar tags:', processedText.substring(0, 200));

    // 3. Normalizar saltos de línea y listas, y luego eliminar el resto de etiquetas
    processedText = processedText
      .replace(/<\/p>/gi, '\n\n') // Párrafos generan un párrafo nuevo (doble salto).
      .replace(/<\/li>/gi, '\n') // El final de un elemento de lista es un salto simple.
      //.replace(/<br\s*\/?>/gi, '\n') // Convertir <br> en salto de línea simple.
      .replace(/<li[^>]*>/gi, '\n• ') // El inicio de un <li> es un salto de línea + viñeta.
      .replace(/<[^>]+>/g, ''); // Eliminar todas las demás etiquetas HTML
    
    // 4. Limpiar saltos de línea y espacios múltiples para evitar espaciado excesivo
    processedText = processedText.replace(/(\s*\n\s*){3,}/g, '\n\n').replace(/ +/g, ' ').trim();

    doc.setFontSize(fontSize);
    doc.setTextColor(String(textColor));

    // 5. Función para renderizar segmentos de texto (reescrita para mayor robustez)
    const renderSegment = (segment: string, currentStyle: { isBold: boolean, isItalic: boolean }) => {
      if (!segment) return;

      let fontStyle = 'normal';
      if (currentStyle.isBold && currentStyle.isItalic) {
        fontStyle = 'bolditalic';
      } else if (currentStyle.isBold) fontStyle = 'bold';
      else if (currentStyle.isItalic) fontStyle = 'italic';

      const lines = segment.split('\n');
      lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
          // Si es un salto de línea, movemos el cursor. Si la línea está vacía, es un párrafo nuevo.
          // Aumentamos el espacio para los párrafos para que sea más notable.
          // Un párrafo (línea vacía) añade un 50% extra de espacio. 
          // Un salto simple (como los <li>), usa un multiplicador reducido de 0.6
          let spaceMultiplier = 1;
          if (line.trim() === '') {
            spaceMultiplier = 1.5; // Párrafos
          } else if (line.trim().startsWith('•')) {
            spaceMultiplier = 0.6; // Items de lista más compactos
          }
          checkPageBreak(lineHeight * spaceMultiplier);
          cursorY += lineHeight * spaceMultiplier;
          cursorX = currentMargin;
          if (line.trim() === '') return;
        }

        const parts = line.split(/(\$\$LINK:.+?\$\$.+?\$\$LINK\$\$)/g).filter(p => p);

        parts.forEach(part => {
          if (!part) return;
          doc.setFont('helvetica', fontStyle); // Restaurar estilo para cada palabra/enlace

          // Si la parte es un enlace, procesarlo como tal
          if (part.startsWith('$$LINK:')) {
            const linkData = part.match(/\$\$LINK:(.*?)\$\$(.*?)\$\$LINK\$\$/);
            if (linkData) {
              const linkText = linkData[2];
              const linkUrl = linkData[1];
              const linkWidth = doc.getTextWidth(linkText);

              if (cursorX + linkWidth > currentMargin + availableWidth && cursorX > currentMargin) {
                cursorY += lineHeight;
                checkPageBreak(lineHeight);
                cursorX = currentMargin;
              }

              doc.setTextColor('#0000FF');
              doc.setFont('helvetica', 'normal'); // Los enlaces no heredan negrita/cursiva
              doc.textWithLink(linkText, cursorX, cursorY, { url: linkUrl });
              doc.line(cursorX, cursorY + 1.2, cursorX + linkWidth, cursorY + 1.2); // Subrayado manual
              doc.setTextColor(String(textColor)); // Restaurar color
              cursorX += linkWidth;
              return; // Continuar con la siguiente palabra/enlace
            }
          } else {
            // Si es texto normal, lo procesamos palabra por palabra para el ajuste de línea
            const words = part.split(/(\s+)/g).filter(w => w);
            words.forEach(word => {
              const wordWidth = doc.getTextWidth(word);
              if (cursorX + wordWidth > currentMargin + availableWidth && cursorX > currentMargin) {
                cursorY += lineHeight;
                checkPageBreak(lineHeight);
                cursorX = currentMargin;
              }
              doc.text(word, cursorX, cursorY);
              cursorX += wordWidth;
            });
          }
        });
      });
    };

    // 6. Procesar el texto por partes
    const style = { isBold: false, isItalic: false };
    processedText.split('%%').forEach((boldPart, index) => {
      style.isBold = index % 2 !== 0; // Alternar negrita
      boldPart.split('##').forEach((italicPart, j_index) => {
        style.isItalic = j_index % 2 !== 0;
        renderSegment(italicPart, style);
      });
    });
    
    // Salto de línea final después del bloque de texto
    // cursorY += lineHeight + yOffset; // Comentado según tu indicación
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

    // Calcular altura del título del ámbito
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const splitAmbitoTitle = doc.splitTextToSize(ambitoTitle, contentWidth - paddingH * 2);

    // Calcular altura del título de valoración
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const splitValoracionTitle = doc.splitTextToSize(ambito.valoracion.titulo, contentWidth - paddingH * 2);

    const startY = cursorY; // Guardar posición inicial
    const startPage = doc.getCurrentPageInfo().pageNumber; // Guardar página inicial

    // Renderizar temporalmente el contenido para medir su altura
    let measureY = cursorY + paddingV;
    measureY += doc.getTextDimensions(splitAmbitoTitle).h + 3;
    measureY += doc.getTextDimensions(splitValoracionTitle).h + 5;
    
    // Simular el renderizado del texto para saber su altura
    cursorY = measureY;
    addTextWithBold(ambito.valoracion.texto, { fontSize: 11, textColor: '#000000' }, 0, margin + paddingH, contentWidth - paddingH * 2);
    
    const endPage = doc.getCurrentPageInfo().pageNumber;
    const endY = cursorY;
    
    // Si el contenido provocó un salto de página, no dibujamos el fondo gris
    if (endPage > startPage) {
      // El contenido se extendió a otra página, solo mostramos sin fondo
      cursorY = startY;
      addText(`${ambito.nombre} - ${ambito.aspecto_evaluado}`, { fontSize: 14, fontStyle: 'bold', textColor: '#000000' }, 3);
      addText(ambito.valoracion.titulo, { fontSize: 12, fontStyle: 'bold', textColor: '#000000' }, 5);
      addTextWithBold(ambito.valoracion.texto, { fontSize: 11, textColor: '#000000' }, 8);
    } else {
      // El contenido cabe en una página, dibujamos el bloque con fondo
      const blockHeight = endY - startY + paddingV;
      
      // Volver al inicio y dibujar el fondo
      cursorY = startY;
      doc.setFillColor('#efefef');
      doc.roundedRect(margin, cursorY, pageWidth - margin * 2, blockHeight, borderRadius, borderRadius, 'F');
      
      // Dibujar el contenido encima del fondo
      let blockContentCursorY = cursorY + paddingV;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#000000');
      doc.text(splitAmbitoTitle, margin + paddingH, blockContentCursorY + doc.getTextDimensions(splitAmbitoTitle).h / splitAmbitoTitle.length);
      blockContentCursorY += doc.getTextDimensions(splitAmbitoTitle).h + 3;
      
      doc.setFontSize(12);
      doc.text(splitValoracionTitle, margin + paddingH, blockContentCursorY + doc.getTextDimensions(splitValoracionTitle).h / splitValoracionTitle.length);
      blockContentCursorY += doc.getTextDimensions(splitValoracionTitle).h + 5;
      
      cursorY = blockContentCursorY;
      addTextWithBold(ambito.valoracion.texto, { fontSize: 11, textColor: '#000000' }, 0, margin + paddingH, contentWidth - paddingH * 2);
      
      cursorY += paddingV + 8;
    }

    respuestasDelAmbito.forEach(respuesta => {
      if (cursorY + 25 > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        cursorY = margin;
      }
      addText(respuesta.aspectoEvaluadoPregunta, { fontSize: 11, fontStyle: 'bold', textColor: '#000000' }, 2);
      addText(respuesta.comentario, { fontSize: 11, textColor: '#000000' }, 5); // 'comentario' es la valoración detallada
    });

    cursorY += 3; // Espacio extra entre ámbitos
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
      addTextWithBold(ambito.recomendacion, { fontSize: 11, textColor: '#000000' }, 5);
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