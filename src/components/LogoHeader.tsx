// src/components/LogoHeader.tsx

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LogoHeader() {
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/custom/v1/site-info`)
      .then(res => res.json())
      .then(data => setDescription(data.description))
      .catch(() => setDescription(''));
      
  }, []);

 return (
  <div id="logo-container">
    <Link href="/" aria-label="Ir a la página de inicio">
      <Image
        src="/xamle-logo.png"
        alt="Autodiagnóstico antirracista para reflexionar y transformar tu prácticadocente"
        width={124}
        height={63}
        priority
        className="logo-xamle-header"
      />
    </Link>
    
     <div className="logo-mad-wrapper">
      <a href="https://www.madafrica.es" target="_blank" rel="noopener noreferrer" aria-label="Ir a la web de MAD África (se abre en una nueva pestaña)">
        <Image
          src="/madafrica-logo-small.png"
          alt="MAD África | Movimiento por la Acción y el Desarrollo de África"
          width={77}
          height={63}
          priority
          className="logo-mad-header"
        />
      </a>
     </div>

    <p className="header-desc">
      {description}
    </p>
  </div>
);

}
