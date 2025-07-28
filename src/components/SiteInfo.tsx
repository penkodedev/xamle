// src/components/SiteInfo.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
    
      <div className="logo-footer-wrapper">
        <Image
          src="/logo-xamle-mad-footer.png"
          alt="MAD África | Movimiento por la Acción y el Desarrollo de África"
          width={133}
          height={30}
          priority
          //className="logo-mad-footer"
        />
      </div>
      <div>
        &copy; {new Date().getFullYear()} {siteInfo.title}
        <br />
        {siteInfo.description}
      </div>
      
      </>
  );
}
