// src/utils/generarPDF.ts

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoBase64 from "@/assets/madafrica-logo-base64";

export function generarPDF(
  preguntas,
  respuestasUsuario,
  nombreColaborador
) {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();

  // Tamaño del logo (ajustado)
  const logoWidth = 40;
  const logoHeight = 15;
  const logoY = 10;

  // Dibujar logo centrado arriba
  doc.addImage(logoBase64, "PNG", 14, logoY, logoWidth, logoHeight); // 14 es margen izquierdo estándar

  // Texto del nombre justo debajo del logo (logoY + logoHeight + margen)
  const nombreY = logoY + logoHeight + 10;
  doc.setFontSize(12);
  doc.text(
    `Nombre del colaborador: ${nombreColaborador || "No disponible"}`,
    14,
    nombreY
  );

  // Título principal debajo del nombre (con un poco de margen)
  const tituloY = nombreY + 10;
  doc.setFontSize(18);
  doc.text("Resultados de la encuesta", 14, tituloY);

  // Construir filas de la tabla
  const rows = preguntas.map((p) => {
    const respuestaPeso = respuestasUsuario[p.id];
    const respuestaTexto =
      p.respuestas.find((r) => r.peso === respuestaPeso)?.texto || "Sin respuesta";

    return [
      p.ambito.fase,
      p.pregunta,
      respuestaTexto,
      respuestaPeso !== undefined ? respuestaPeso.toString() : "-",
    ];
  });

  // La tabla empieza debajo del título
  const startY = tituloY + 10;

  autoTable(doc, {
    head: [["Ámbito", "Pregunta", "Mi respuesta", "Peso"]],
    body: rows,
    startY,
    styles: { fontSize: 10 },
    headStyles: { fillColor: "#313131", textColor: "#ffb41d" },
  });

  // Puntuación total después de la tabla
  const puntuacionTotal = Object.values(respuestasUsuario).reduce(
    (acc, peso) => acc + peso,
    0
  );

  doc.text(`Puntuación total: ${puntuacionTotal}`, 14, doc.lastAutoTable.finalY + 10);

  doc.save("resultados-encuesta-madafrica.pdf");
}
