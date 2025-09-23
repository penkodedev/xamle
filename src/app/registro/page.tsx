// src/app/page.tsx
// PÁGIN DE REGISTRO

import FormText from '@/components/FormText';
import FormMain from '@/components/FormMain';


export default function Home() {
  return (

    <article className='form-container'>
      <section>
      <FormText />
      </section>

      <section>
      <FormMain />
      </section>
    </article>
  );
}
