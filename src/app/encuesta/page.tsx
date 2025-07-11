// app/encuesta/page.tsx
"use client";

import { useState, useEffect } from "react";
import BodyClass from "@/utils/BodyClass";

import Encuesta from "@/components/Encuesta";
import EncuestaSidebar from "@/components/EncuestaSidebar";
import SiteInfo from "@/components/SiteInfo";

export default function EncuestaPage() {
  const [ambitoActivo, setAmbitoActivo] = useState<string>("");
  const [siteInfo, setSiteInfo] = useState<{ title: string; description: string }>({
    title: "",
    description: "",
  });

  // useEffect(() => {
  //   fetch("http://encuestamad.local/wp-json/custom/v1/site-info")
  //     .then((res) => res.json())
  //     .then((data) => setSiteInfo({ title: data.title, description: data.description }))
  //     .catch(() => setSiteInfo({ title: "", description: "" }));
  // }, []);

  return (
    <>
      <BodyClass />

      <div className="layout-encuesta">
        <aside>
          <EncuestaSidebar ambitoNombre={ambitoActivo} />
        </aside>

        <article>
          <Encuesta onAmbitoChange={setAmbitoActivo} />
          <p className="copy-encuesta">
          <SiteInfo />
          </p>
        </article>
      </div>
    </>
  );
}
