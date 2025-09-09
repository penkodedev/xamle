'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type FormData = {
  nombre: string;
  email: string;
  edad: number | '';
  pais: string;
  ciudad: string;
  genero: string;
  etnia: string;
  etniaDetalles: string;
  etniaOtra: string;
  colectivo: string;
  tipoCentro: string;
};

const generoOptions = [
  'Mujer',
  'Hombre',
  'No binario',
  'Prefiero no responder'
];

const etniaOptions = [
  'Persona blanca',
  'Persona racializada'
];

const etniaDropdownOptions = [
  'Afrodescendiente',
  'Árabe',
  'Asiática',
  'Gitana',
  'Indígena',
  'Latino',
  'Pueblo Originário',
  'Prefiero no responder'
];

const colectivoOptions = [
  'Docente en activo (etapas infantil o primaria)',
  'Docente en activo (etapas secundaria o bachillerato)',
  'Docente en activo (etapa universitaria)',
  'Estudiante de educación',
  'Estudiante de otras disciplinas',
  'Educadora/e/or en el ámbito no formal o informal',
  'Otros'
];

const tipoCentroOptions = [
  'Centro Público',
  'Centro Concertado',
  'Centro Privado'
];

export default function FormMain() {
  const [form, setForm] = useState<FormData>({
    nombre: '',
    email: '',
    edad: '',
    pais: '',
    ciudad: '',
    genero: '',
    etnia: '',
    etniaDetalles: '',
    etniaOtra: '',
    colectivo: '',
    tipoCentro: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setForm(prev => {
      const newForm = { ...prev, [name]: value };

      // Lógica para limpiar campos de etnia mutuamente excluyentes
      if (name === 'etniaDetalles' && value) {
        newForm.etniaOtra = '';
      }
      if (name === 'etniaOtra' && value) {
        newForm.etniaDetalles = '';
      }

      return newForm;
    });
  };

  const validarFormulario = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio';
    if (!form.email.trim()) return 'El email es obligatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'El email no es válido';
    if (!form.genero.trim()) return 'El género es obligatorio';
    if (!form.etnia.trim()) return 'La identidad étnica es obligatoria';
    if (!form.colectivo.trim()) return 'El colectivo es obligatorio';
    if (!form.pais.trim()) return 'El país es obligatorio';
    if (!form.ciudad.trim()) return 'La ciudad es obligatoria';
    if (!form.tipoCentro.trim()) return 'El tipo de centro es obligatorio';

    // Validación de edad robusta
    const edadNum = Number(form.edad);
    if (
      form.edad === '' ||
      isNaN(edadNum) ||
      !Number.isFinite(edadNum) ||
      edadNum < 0 ||
      edadNum > 120
    ) {
      return 'La edad debe ser un número válido entre 0 y 120';
    }

    if (
      form.etnia === 'Persona racializada' &&
      !form.etniaDetalles &&
      !form.etniaOtra.trim()
    ) {
      return 'Debes especificar el detalle de tu identidad étnica o describirla';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationError = validarFormulario();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const payload = {
      nombre: form.nombre,
      email: form.email,
      genero: form.genero,
      edad: Number(form.edad),
      identidad_etnica: form.etnia,
      sub_etnias: form.etniaDetalles ? [form.etniaDetalles] : [],
      otra_etnia: form.etniaOtra,
      colectivo: form.colectivo,
      pais: form.pais,
      ciudad: form.ciudad,
      tipo_centro: form.tipoCentro,
      respuestas: [],
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/custom/v1/colaboradores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.id) {
        // Guardamos tanto el ID como el nombre para usarlo en el PDF
        const colaboradorInfo = { id: data.id, nombre: form.nombre };
        localStorage.setItem('colaborador_info', JSON.stringify(colaboradorInfo));
      }

      // Redirigir directamente sin mensaje de éxito
      router.push('/encuesta');
    } catch {
      setError('Falló el envío. Intenta más tarde.');
      setIsSubmitting(false);
    }
  };

  // ************** EMPIEZA EL RETURN PARA MONTAR EL HTML *************************//
  return (
    <form className="form-main" onSubmit={handleSubmit} aria-describedby={error ? "form-error" : undefined}>
      <fieldset>
        <h1>Datos Personales</h1>
        <small>Todos los campos son obligatorios</small>
        <input type="text" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Tu nombre" required />
        <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Tu email" required />
        <input type="text" name="edad" value={form.edad} onChange={handleChange} placeholder="Tu edad" min={0} max={120} required />
      </fieldset>

      <fieldset>
        <h1>Un poco más sobre ti</h1>
        <input type="text" name="pais" value={form.pais} onChange={handleChange} placeholder="País" required />
        <input type="text" name="ciudad" value={form.ciudad} onChange={handleChange} placeholder="Ciudad" required />
      </fieldset>

      <fieldset>
        <legend>¿Cómo te defines desde tu identidad de género?</legend>
        {generoOptions.map(option => (
          <label key={option} style={{ marginRight: '1rem' }}>
            <input
              type="radio"
              name="genero"
              value={option}
              checked={form.genero === option}
              onChange={handleChange}
              required
            />
            {option}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>¿Cómo te defines desde tu identidad étnica o racial?</legend>
        {etniaOptions.map(option => (
          <label key={option} style={{ marginRight: '1rem' }}>
            <input
              type="radio"
              name="etnia"
              value={option}
              checked={form.etnia === option}
              onChange={handleChange}
              required
            />
            {option}
          </label>
        ))}

        {form.etnia === 'Persona racializada' && (
          <>
            <legend className="racializada">Especifica si quieres (elige una):</legend>
            <label>
              <select name="etniaDetalles" value={form.etniaDetalles} onChange={handleChange}>
                <option value="">Selecciona</option>
                {etniaDropdownOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>
            <textarea
              name="etniaOtra"
              value={form.etniaOtra}
              onChange={handleChange}
              placeholder="Prefiero describirlo de otra manera:"
              rows={4}
            />
          </>
        )}
      </fieldset>

      <fieldset>
        <legend>Selecciona el colectivo docente al que perteneces</legend>
        <select name="colectivo" value={form.colectivo} onChange={handleChange} required>
          <option value="">Selecciona</option>
          {colectivoOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </fieldset>

      <fieldset>
        <legend>Tipo de centro</legend>
        <select name="tipoCentro" value={form.tipoCentro} onChange={handleChange} required>
          <option value="">Selecciona</option>
          {tipoCentroOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </fieldset>

      {error && <p id="form-error" style={{ color: 'red', fontWeight: 'bold' }} role="alert">{error}</p>}

      <div className="empezar-container">
        <button className="btn-empezar" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Enviando formulario...</span>
            </>
          ) : (
            'Empezar la encuesta'
          )}
        </button>
      </div>
    </form>
  );
}
