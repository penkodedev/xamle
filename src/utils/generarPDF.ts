// src/utils/generarPDF.ts

import jsPDF from "jspdf";
import logoBase64 from "@/assets/madafrica-logo-base64";
import { DatosPDF } from "@/types/index";

/**
 * Genera un informe en PDF a partir de los datos de la evaluación.
 */
export function generarPDF(datosParaPDF: DatosPDF) {
  const { nombreColaborador, puntuacionTotal, ambitos, respuestasDetalladas, valoracionFinal } = datosParaPDF;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const MARGIN = 20;
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  let cursorY = 10;

  // Establecer fuente por defecto
  doc.setFont('helvetica', 'normal');

  // ==================== HELPERS ====================

  /**
   * Decodifica entidades HTML y caracteres Unicode escapados
   */
  const decodeHTML = (input: string): string => {
    let text = input;
    while (text.includes('&lt;') || text.includes('&amp;')) {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      text = textarea.value;
    }
    return text;
  };

  /**
   * Verifica si hay espacio en la página y añade una nueva si es necesario
   */
  const checkPageBreak = (requiredHeight: number) => {
    if (cursorY + requiredHeight > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      cursorY = MARGIN;
    }
  };

  /**
   * Añade texto con formato HTML (negritas, cursivas, enlaces, listas)
   * Ahora con espaciado semántico unificado
   */
  const addFormattedText = (
    text: string,
    options: {
      fontSize?: number;
      textColor?: string | number;
      yOffset?: number;
      customMargin?: number;
      customWidth?: number;
    } = {}
  ) => {
    const { 
      fontSize = 10, 
      textColor = '#333333', 
      yOffset = 5,
      customMargin = MARGIN,
      customWidth = PAGE_WIDTH - MARGIN * 2
    } = options;

    const lineHeight = doc.getLineHeight() / doc.internal.scaleFactor;
    const availableWidth = customWidth;
    let cursorX = customMargin;

    // 1. Decodificar HTML
    let processedText = decodeHTML(text);

    // 2. Procesar etiquetas y convertirlas a delimitadores internos
    processedText = processedText
      .replace(/<a\s+(?:[^>]*?\s+)?href=["']([^"']*?)["'][^>]*?>(.*?)<\/a>/gi, (_, url, text) => `$$LINK:${url}$$${text}$$LINK$$`)
      .replace(/<strong>|<\/strong>|<b>|<\/b>/g, '%%')
      .replace(/<i>|<\/i>|<em>|<\/em>/g, '##')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<[^>]+>/g, '')
      .replace(/(\s*\n\s*){3,}/g, '\n\n')
      .replace(/ +/g, ' ')
      .trim();

    doc.setFontSize(fontSize);
    doc.setTextColor(String(textColor));

    // 3. Renderizar segmentos con espaciado semántico unificado
    const renderSegment = (segment: string, style: { isBold: boolean; isItalic: boolean }) => {
      if (!segment) return;

      let fontStyle = 'normal';
      if (style.isBold && style.isItalic) fontStyle = 'bolditalic';
      else if (style.isBold) fontStyle = 'bold';
      else if (style.isItalic) fontStyle = 'italic';

      const lines = segment.split('\n');
      
      lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
          // ESPACIADO SEMÁNTICO UNIFICADO:
          // - Línea vacía (párrafo nuevo) = 1.2x el alto de línea
          // - Línea con contenido (lista/texto) = 1.0x el alto de línea
          const spaceMultiplier = line.trim() === '' ? 1.2 : 1.0;
          
          checkPageBreak(lineHeight * spaceMultiplier);
          cursorY += lineHeight * spaceMultiplier;
          cursorX = customMargin;
          
          if (line.trim() === '') return;
        }

        // Procesar enlaces y texto normal
        const parts = line.split(/(\$\$LINK:.+?\$\$.+?\$\$LINK\$\$)/g).filter(p => p);

        parts.forEach(part => {
          if (!part) return;
          
          doc.setFont('helvetica', fontStyle);

          // Procesar enlaces
          if (part.startsWith('$$LINK:')) {
            const linkData = part.match(/\$\$LINK:(.*?)\$\$(.*?)\$\$LINK\$\$/);
            if (linkData) {
              const [, linkUrl, linkText] = linkData;
              const linkWidth = doc.getTextWidth(linkText);

              if (cursorX + linkWidth > customMargin + availableWidth && cursorX > customMargin) {
                cursorY += lineHeight;
                checkPageBreak(lineHeight);
                cursorX = customMargin;
              }

              doc.setTextColor('#0000FF');
              doc.setFont('helvetica', 'normal');
              doc.textWithLink(linkText, cursorX, cursorY, { url: linkUrl });
              doc.line(cursorX, cursorY + 1.2, cursorX + linkWidth, cursorY + 1.2);
              doc.setTextColor(String(textColor));
              cursorX += linkWidth;
            }
          } else {
            // Procesar texto palabra por palabra
            const words = part.split(/(\s+)/g).filter(w => w);
            words.forEach(word => {
              const wordWidth = doc.getTextWidth(word);
              if (cursorX + wordWidth > customMargin + availableWidth && cursorX > customMargin) {
                cursorY += lineHeight;
                checkPageBreak(lineHeight);
                cursorX = customMargin;
              }
              doc.text(word, cursorX, cursorY);
              cursorX += wordWidth;
            });
          }
        });
      });
    };

    // 4. Procesar estilos (negrita e itálica)
    const style = { isBold: false, isItalic: false };
    processedText.split('%%').forEach((boldPart, index) => {
      style.isBold = index % 2 !== 0;
      boldPart.split('##').forEach((italicPart, j_index) => {
        style.isItalic = j_index % 2 !== 0;
        renderSegment(italicPart, style);
      });
    });

    cursorY += yOffset;
  };

  /**
   * Añade un título con fondo amarillo
   */
  const addSectionTitle = (titleText: string) => {
    const TITLE_FONT_SIZE = 20;
    const PADDING_V = 4;
    const BORDER_RADIUS = 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(TITLE_FONT_SIZE);
    
    const titleWidth = doc.getTextWidth(titleText);
    const titleHeight = doc.getTextDimensions(titleText).h;

    checkPageBreak(titleHeight + PADDING_V * 2);

    doc.setFillColor('#FFB41D');
    doc.roundedRect(MARGIN, cursorY, PAGE_WIDTH - MARGIN * 2, titleHeight + PADDING_V * 2, BORDER_RADIUS, BORDER_RADIUS, 'F');
    
    doc.setTextColor('#000000');
    doc.text(titleText, (PAGE_WIDTH - titleWidth) / 2, cursorY + titleHeight / 2 + PADDING_V + 1.5);
    cursorY += titleHeight + PADDING_V * 2 + 4;
  };

  /**
   * Añade un bloque de ámbito con fondo gris
   */
  const addAmbitoBlock = (ambito: any) => {
    const PADDING_H = 4;
    const PADDING_V = 6;
    const BORDER_RADIUS = 2;
    const contentWidth = PAGE_WIDTH - MARGIN * 2 - PADDING_H * 2;

    const ambitoTitle = `${ambito.nombre} - ${ambito.aspecto_evaluado}`;
    
    // Calcular alturas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    const splitAmbitoTitle = doc.splitTextToSize(ambitoTitle, contentWidth - PADDING_H * 2);
    
    doc.setFontSize(12);
    const splitValoracionTitle = doc.splitTextToSize(ambito.valoracion.titulo, contentWidth - PADDING_H * 2);

    const startY = cursorY;
    const startPage = doc.getCurrentPageInfo().pageNumber;

    // Medir altura del contenido
    let measureY = cursorY + PADDING_V;
    measureY += doc.getTextDimensions(splitAmbitoTitle).h + 3;
    measureY += doc.getTextDimensions(splitValoracionTitle).h + 5;
    
    cursorY = measureY;
    addFormattedText(ambito.valoracion.texto, { 
      fontSize: 11, 
      textColor: '#000000', 
      yOffset: 0,
      customMargin: MARGIN + PADDING_H, 
      customWidth: contentWidth - PADDING_H * 2 
    });
    
    const endPage = doc.getCurrentPageInfo().pageNumber;
    const endY = cursorY;
    
    // Si el contenido cabe en una página, dibujar el bloque con fondo
    if (endPage === startPage) {
      const blockHeight = endY - startY + PADDING_V;
      
      cursorY = startY;
      doc.setDrawColor('#cccccc');
      doc.setLineWidth(0.5);
      doc.setFillColor('#efefef');
      doc.roundedRect(MARGIN, cursorY, PAGE_WIDTH - MARGIN * 2, blockHeight, BORDER_RADIUS, BORDER_RADIUS, 'FD');
      
      let blockContentCursorY = cursorY + PADDING_V;
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#000000');
      doc.setFontSize(16);
      doc.text(splitAmbitoTitle, MARGIN + PADDING_H, blockContentCursorY + doc.getTextDimensions(splitAmbitoTitle).h / splitAmbitoTitle.length);
      blockContentCursorY += doc.getTextDimensions(splitAmbitoTitle).h + 3;
      
      doc.setFontSize(12);
      doc.text(splitValoracionTitle, MARGIN + PADDING_H, blockContentCursorY + doc.getTextDimensions(splitValoracionTitle).h / splitValoracionTitle.length);
      blockContentCursorY += doc.getTextDimensions(splitValoracionTitle).h + 5;
      
      cursorY = blockContentCursorY;
      addFormattedText(ambito.valoracion.texto, { 
        fontSize: 11, 
        textColor: '#000000', 
        yOffset: 0,
        customMargin: MARGIN + PADDING_H, 
        customWidth: contentWidth - PADDING_H * 2 
      });
      
      cursorY += PADDING_V + 8;
    } else {
      // Contenido muy largo, mostrar sin fondo
      cursorY = startY;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor('#000000');
      doc.text(ambitoTitle, MARGIN, cursorY);
      cursorY += doc.getTextDimensions(ambitoTitle).h + 3;
      
      doc.setFontSize(12);
      doc.text(ambito.valoracion.titulo, MARGIN, cursorY);
      cursorY += doc.getTextDimensions(ambito.valoracion.titulo).h + 5;
      
      addFormattedText(ambito.valoracion.texto, { fontSize: 11, textColor: '#000000', yOffset: 8 });
    }
  };

  /**
   * Añade un título de ámbito con fondo gris (versión simple para recomendaciones)
   */
  const addAmbitoTitle = (ambito: any) => {
    const PADDING_H = 3;
    const PADDING_V = 2;
    const BORDER_RADIUS = 3;

    const ambitoTitle = `${ambito.nombre} - ${ambito.aspecto_evaluado}`;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);

    const splitTitle = doc.splitTextToSize(ambitoTitle, PAGE_WIDTH - MARGIN * 2 - PADDING_H * 2);
    const textDimensions = doc.getTextDimensions(splitTitle);
    const blockHeight = textDimensions.h + PADDING_V * 2;

    doc.setFillColor('#efefef');
    doc.roundedRect(MARGIN, cursorY, PAGE_WIDTH - MARGIN * 2, blockHeight, BORDER_RADIUS, BORDER_RADIUS, 'F');

    doc.setTextColor('#000000');
    doc.text(splitTitle, MARGIN + PADDING_H, cursorY + PADDING_V + textDimensions.h / splitTitle.length);
    cursorY += blockHeight + 8;
  };

  /**
   * Añade pie de página en todas las páginas
   */
  const addPageFooters = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor('#888888');
      const text = `Página ${i} de ${pageCount}`;
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (PAGE_WIDTH - textWidth) / 2, PAGE_HEIGHT - 10);
    }
  };

  // ==================== CONSTRUCCIÓN DEL PDF ====================

  // --- PORTADA ---
  const LOGO_WIDTH = 40;
  const LOGO_HEIGHT = 15;
  
  doc.addImage(logoBase64, "PNG", MARGIN, 20, LOGO_WIDTH, LOGO_HEIGHT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(["Informe detallado de", "Autoevaluación Antirracista"], PAGE_WIDTH / 2, 90, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }), PAGE_WIDTH / 2, 120, { align: 'center' });

  // --- EVALUACIÓN DETALLADA ---
  doc.addPage();
  cursorY = MARGIN + 5;
  addSectionTitle("EVALUACIÓN DETALLADA");

  // Agrupar respuestas por ámbito
  const respuestasPorAmbito: { [key: string]: typeof respuestasDetalladas } = {};
  respuestasDetalladas.forEach(respuesta => {
    if (!respuestasPorAmbito[respuesta.ambitoNombre]) {
      respuestasPorAmbito[respuesta.ambitoNombre] = [];
    }
    respuestasPorAmbito[respuesta.ambitoNombre].push(respuesta);
  });

  // Iterar sobre los ámbitos
  ambitos.forEach(ambito => {
    const respuestasDelAmbito = respuestasPorAmbito[ambito.nombre];
    if (!respuestasDelAmbito || respuestasDelAmbito.length === 0) return;

    checkPageBreak(30);
    addAmbitoBlock(ambito);

    respuestasDelAmbito.forEach(respuesta => {
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor('#000000');
      doc.text(respuesta.aspectoEvaluadoPregunta, MARGIN, cursorY);
      cursorY += doc.getTextDimensions(respuesta.aspectoEvaluadoPregunta).h + 2;
      
      addFormattedText(respuesta.comentario, { fontSize: 11, textColor: '#000000', yOffset: 5 });
    });

    cursorY += 3;
  });

  // --- RECOMENDACIONES ---
  doc.addPage();
  cursorY = MARGIN + 5;
  addSectionTitle("RECOMENDACIONES");

  ambitos.forEach(ambito => {
    checkPageBreak(30);
    cursorY += 5;
    
    addAmbitoTitle(ambito);
    
    if (ambito.recomendacion && typeof ambito.recomendacion === 'string') {
      addFormattedText(ambito.recomendacion, { fontSize: 11, textColor: '#000000', yOffset: 5 });
    }
  });

  // --- RECOMENDACIÓN FINAL ---
  doc.addPage();
  cursorY = MARGIN + 5;
  addSectionTitle("RECOMENDACIÓN FINAL");
  cursorY += 6;

  if (valoracionFinal.recomendacion && typeof valoracionFinal.recomendacion === 'string') {
    addFormattedText(valoracionFinal.recomendacion, { fontSize: 11, textColor: '#000000', yOffset: 8 });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor('#000000');
    doc.text("No hay una recomendación final disponible.", MARGIN, cursorY);
  }

  // --- PIE DE PÁGINA ---
  addPageFooters();

  doc.save("evaluacion-antirracista-madafrica.pdf");
}