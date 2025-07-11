// src/components/LogoHeader.tsx

'use client';

import Link from 'next/link';
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
      {/* <Link href="/"> */}
        <Image
          src="/madafrica-logo.png"
          alt="Nivel de formación en educación antirracista y conciencia de su necesidad"
          width={98}
          height={42}
          priority
        />
      {/* </Link> */}
      <p className='header-desc'>
        {description}
      </p>
    </div>
  );
}
