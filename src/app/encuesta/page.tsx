// app/encuesta/page.tsx
"use client";

import React, { useState } from "react";
import BodyClass from "@/utils/BodyClass";

import Encuesta from "@/components/Encuesta";
import EncuestaSidebar from "@/components/EncuestaSidebar";
import SiteInfo from "@/components/SiteInfo";

type AmbitoSidebar = {
  id: number;
  nombre: string;
  slug: string;
  area: string;
  aspecto_evaluado: string;
};

export default function EncuestaPage() {
  const [ambitoActivo, setAmbitoActivo] = useState<string>("");
  const [sidebarData, setSidebarData] = useState<{
    ambitos: AmbitoSidebar[];
    cargando: boolean;
  }>({
    ambitos: [],
    cargando: true
  });
  const [mostrarMensajeFinal, setMostrarMensajeFinal] = useState(false);

  return (
    <>
      <BodyClass />

      <div className="layout-encuesta">
        {!mostrarMensajeFinal && (
          <aside>
            <EncuestaSidebar 
              ambitoNombre={ambitoActivo}
              ambitos={sidebarData.ambitos}
              cargando={sidebarData.cargando}
            />
          </aside>
        )}

        <article>
          <Encuesta
            onAmbitoChange={setAmbitoActivo}
            onMostrarMensajeFinalChange={setMostrarMensajeFinal}
            onSidebarDataChange={setSidebarData}
          />
          <small className="copy-encuesta">
          <SiteInfo /></small>
        </article>
      </div>
    </>
  );
}
