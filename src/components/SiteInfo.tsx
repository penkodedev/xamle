// src/components/SiteInfo.tsx
"use client";

import { useEffect, useState } from "react";

type SiteInfoData = {
  title: string;
  description: string;
};

export default function SiteInfo() {
  const [siteInfo, setSiteInfo] = useState<SiteInfoData>({ title: "", description: "" });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/custom/v1/site-info`)

      .then((res) => res.json())
      .then((data) => setSiteInfo({ title: data.title, description: data.description }))
      .catch(() => setSiteInfo({ title: "", description: "" }));
  }, []);

  if (!siteInfo.title && !siteInfo.description) return null;



  // ******************** EMPIEZA EL RETURN PARA MONTAR EL HTML *******************************
  return (
    <>
      &copy; {new Date().getFullYear()} {siteInfo.title}
        <br />
      {siteInfo.description}
    </>
  );
}
