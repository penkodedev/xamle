// src/components/LogoHeader.tsx

'use client';

import Image from 'next/image';
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
    <Image
      src="/xamle-logo.png"
      alt="Autodiagnóstico antirracista para reflexionar y transformar tu prácticadocente"
      width={124}
      height={63}
      priority
      className="logo-xamle-header"
    />
    
     <div className="logo-mad-wrapper">
      <Image
        src="/madafrica-logo-small.png"
        alt="MAD África | Movimiento por la Acción y el Desarrollo de África"
        width={77}
      height={63}
        priority
        className="logo-mad-header"
      />
     </div>

    <p className="header-desc">
      {description}
    </p>
  </div>
);

}
