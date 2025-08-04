// app/encuesta/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import BodyClass from "@/utils/BodyClass";

import Encuesta from "@/components/Encuesta";
import EncuestaSidebar from "@/components/EncuestaSidebar";
import SiteInfo from "@/components/SiteInfo";

export default function EncuestaPage() {
  const [ambitoActivo, setAmbitoActivo] = useState<string>("");
  const [sidebarData, setSidebarData] = useState<{
    ambitos: any[];
    cargando: boolean;
  }>({
    ambitos: [],
    cargando: true
  });
  const [siteInfo, setSiteInfo] = useState<{ title: string; description: string }>({
    title: "",
    description: "",
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
