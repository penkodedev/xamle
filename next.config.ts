import type { NextConfig } from 'next';

const nextConfig: NextConfig = {


  // ATENCIÓN:

  // *******************************************************************************************
  // Si vas a desplegar este proyecto en un subdirectorio (por ejemplo, https://tudominio.com/xamle/),
  // debes descomentar la siguiente línea para que Next.js añada el basePath a todas las rutas.
  // Si la dejas activa en local, tendrás problemas de rutas y 404 (como nos pasó al subir el proyecto).
  // Para desarrollo local, lo mejor es dejarla comentada.
  //******************************************************************************************** */


  // basePath: '/xamle',
};

export default nextConfig;