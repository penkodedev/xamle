'use client'
import { useEffect, useState } from 'react'

type CookieItem = {
  id: string
  name: string
  description: string
  category: string
}

const COOKIE_KEY = 'cookie_consent_options'

const cookiesList: CookieItem[] = [
  {
    id: 'necessary1',
    name: '',
    description: 'Estas cookies son esenciales para el funcionamiento del sitio.',
    category: 'necessary',
  },
  // Añadir cookies propias o externas opcionales aquí en el futuro
]


type ConsentOptions = Record<string, boolean>

const CookieConsent = () => {
  const [show, setShow] = useState(false)
  const [options, setOptions] = useState<ConsentOptions>({})

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_KEY)
    if (!saved) {
      // Por defecto activamos las necesarias (no configurables)
      const defaults: ConsentOptions = {}
      cookiesList.forEach(cookie => {
        if (cookie.category === 'necessary') defaults[cookie.id] = true
      })
      setOptions(defaults)
      setTimeout(() => setShow(true), 1000)
    } else {
      const parsed = JSON.parse(saved)
      setOptions(parsed)
    }
  }, [])

  const toggleOption = (id: string) => {
    setOptions(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const saveConsent = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(options))
    setShow(false)
    // Aquí disparar lógica según preferencias
  }

  if (!show) return null

  // Agrupar cookies por categoría para mostrar
  const grouped = cookiesList.reduce((acc, cookie) => {
    if (!acc[cookie.category]) acc[cookie.category] = []
    acc[cookie.category].push(cookie)
    return acc
  }, {} as Record<string, CookieItem[]>)

  return (
    <div className="cookieConsent-overlay">
      <div className="cookieConsent">
        <h2>Preferencias de cookies</h2>
        <p>Usamos cookies para mejorar tu experiencia. Puedes elegir qué cookies aceptar.</p>

        {Object.entries(grouped).map(([category, cookies]) => (
          <div key={category}>
            <h3 className="category-title">
              {category === 'performance'
                ? 'Cookies de rendimiento'
                : category === 'marketing'
                ? 'Cookies de marketing'
                : category === 'necessary'
                ? 'Cookies estrictamente necesarias'
                : category}
            </h3>

            {cookies.map(cookie => (
              <div className="cookie-option" key={cookie.id}>
                <div>
                  <strong>{cookie.name}</strong>
                  <p>{cookie.description}</p>
                </div>
                {category === 'necessary' ? (
                  <label className="toggle disabled">
                    <input type="checkbox" checked disabled />
                    <span className="slider" />
                  </label>
                ) : (
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={!!options[cookie.id]}
                      onChange={() => toggleOption(cookie.id)}
                    />
                    <span className="slider" />
                  </label>
                )}
              </div>
            ))}
          </div>
        ))}

        <button onClick={saveConsent}>Guardar preferencias</button>
      </div>
    </div>
  )
}

export default CookieConsent
