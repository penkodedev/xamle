'use client'
import { useEffect, useState, useRef } from 'react'
import { useCookieConsent } from '@/utils/useCookieConsent'

type CookieItem = {
  id: string
  name: string
  description: string
  category: string
  duration: string
  provider: string
}

const cookiesList: CookieItem[] = [
  // Cookies necesarias
  {
    id: 'session',
    name: 'Cookie de sesión',
    description: 'Mantiene tu sesión activa mientras navegas por el sitio web.',
    category: 'necessary',
    duration: 'Sesión',
    provider: 'Propia'
  },
  {
    id: 'csrf',
    name: 'Token CSRF',
    description: 'Protege contra ataques de falsificación de solicitudes entre sitios.',
    category: 'necessary',
    duration: 'Sesión',
    provider: 'Propia'
  },
  {
    id: 'language',
    name: 'Preferencia de idioma',
    description: 'Recuerda tu idioma preferido para mostrar el contenido correcto.',
    category: 'necessary',
    duration: '1 año',
    provider: 'Propia'
  },
  
  // Cookies de rendimiento
  {
    id: 'analytics',
    name: 'Google Analytics',
    description: 'Recopila información sobre cómo usas nuestro sitio web para mejorar nuestros servicios.',
    category: 'performance',
    duration: '2 años',
    provider: 'Google'
  },
  {
    id: 'performance',
    name: 'Cookies de rendimiento',
    description: 'Ayudan a medir el rendimiento del sitio web y optimizar la experiencia del usuario.',
    category: 'performance',
    duration: '1 año',
    provider: 'Propia'
  },
  
  // Cookies de marketing
  {
    id: 'google_ads',
    name: 'Google Ads',
    description: 'Utilizada para mostrar anuncios relevantes basados en tus intereses.',
    category: 'marketing',
    duration: '1 año',
    provider: 'Google'
  },
  {
    id: 'facebook_pixel',
    name: 'Facebook Pixel',
    description: 'Ayuda a medir la efectividad de nuestros anuncios en Facebook.',
    category: 'marketing',
    duration: '3 meses',
    provider: 'Meta'
  },
  {
    id: 'retargeting',
    name: 'Cookies de remarketing',
    description: 'Permiten mostrar anuncios personalizados cuando visitas otros sitios web.',
    category: 'marketing',
    duration: '6 meses',
    provider: 'Varios'
  },
  
  // Cookies de funcionalidad
  {
    id: 'preferences',
    name: 'Preferencias del usuario',
    description: 'Recuerda tus preferencias y configuraciones personalizadas.',
    category: 'functionality',
    duration: '1 año',
    provider: 'Propia'
  },
  {
    id: 'social_media',
    name: 'Redes sociales',
    description: 'Permite compartir contenido en redes sociales y mostrar feeds integrados.',
    category: 'functionality',
    duration: 'Sesión',
    provider: 'Varios'
  }
]

type ConsentOptions = Record<string, boolean>

const CookieConsent = () => {
  const [show, setShow] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [localOptions, setLocalOptions] = useState<ConsentOptions>({})
  const [activeAction, setActiveAction] = useState<'accept' | 'reject' | 'customize' | null>(null)
  const { preferences, hasConsented, isLoaded, savePreferences } = useCookieConsent()
  
  const acceptAllRef = useRef<HTMLButtonElement>(null)
  const rejectAllRef = useRef<HTMLButtonElement>(null)
  const customizeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isLoaded && !hasConsented) {
      // Por defecto activamos solo las necesarias
      const defaults: ConsentOptions = {}
      cookiesList.forEach(cookie => {
        if (cookie.category === 'necessary') {
          defaults[cookie.id] = true
        } else {
          defaults[cookie.id] = false
        }
      })
      setLocalOptions(defaults)
      setTimeout(() => setShow(true), 1000)
    } else if (isLoaded && hasConsented) {
      setLocalOptions(preferences)
    }
  }, [isLoaded, hasConsented, preferences])

  const toggleOption = (id: string) => {
    setLocalOptions(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const toggleCategory = (category: string, enabled: boolean) => {
    const newOptions = { ...localOptions }
    cookiesList.forEach(cookie => {
      if (cookie.category === category && cookie.category !== 'necessary') {
        newOptions[cookie.id] = enabled
      }
    })
    setLocalOptions(newOptions)
  }

  const acceptAll = () => {
    const allEnabled: ConsentOptions = {}
    cookiesList.forEach(cookie => {
      allEnabled[cookie.id] = true
    })
    setLocalOptions(allEnabled)
    setActiveAction('accept')
  }

  const rejectAll = () => {
    const allDisabled: ConsentOptions = {}
    cookiesList.forEach(cookie => {
      if (cookie.category === 'necessary') {
        allDisabled[cookie.id] = true
      } else {
        allDisabled[cookie.id] = false
      }
    })
    setLocalOptions(allDisabled)
    setActiveAction('reject')
  }

  const handleCustomize = () => {
    setShowDetails(!showDetails)
    setActiveAction('customize')
  }

  const handleSaveConsent = () => {
    savePreferences(localOptions)
    setShow(false)
    console.log('Preferencias guardadas:', localOptions)
  }

  if (!show) return null

  // Agrupar cookies por categoría
  const grouped = cookiesList.reduce((acc, cookie) => {
    if (!acc[cookie.category]) acc[cookie.category] = []
    acc[cookie.category].push(cookie)
    return acc
  }, {} as Record<string, CookieItem[]>)

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'necessary':
        return {
          title: 'Cookies estrictamente necesarias',
          description: 'Estas cookies son esenciales para el funcionamiento del sitio web y no se pueden desactivar.',
          color: '#dc3545'
        }
      case 'performance':
        return {
          title: 'Cookies de rendimiento',
          description: 'Nos ayudan a entender cómo interactúas con el sitio web recopilando información anónima.',
          color: '#17a2b8'
        }
      case 'marketing':
        return {
          title: 'Cookies de marketing',
          description: 'Se utilizan para rastrear visitantes en sitios web para mostrar anuncios relevantes.',
          color: '#28a745'
        }
      case 'functionality':
        return {
          title: 'Cookies de funcionalidad',
          description: 'Permiten que el sitio web recuerde las elecciones que haces para proporcionar funcionalidad mejorada.',
          color: '#ffc107'
        }
      default:
        return {
          title: category,
          description: '',
          color: '#6c757d'
        }
    }
  }

  return (
    <div className="cookie-consent-overlay">
      <div className="cookie-consent-modal">
        <div className="cookie-consent-header">
          <h2>🍪 Configuración de cookies</h2>
          <p className="cookie-consent-intro">
            Utilizamos cookies para mejorar tu experiencia, analizar el tráfico del sitio y personalizar el contenido. 
            Puedes elegir qué tipos de cookies aceptar.
          </p>
        </div>

        <div className="cookie-consent-actions">
          <button 
            ref={acceptAllRef}
            className={`btn-accept-all ${activeAction === 'accept' ? 'active' : ''}`}
            onClick={acceptAll}
          >
            Aceptar todas
          </button>
          <button 
            ref={rejectAllRef}
            className={`btn-reject-all ${activeAction === 'reject' ? 'active' : ''}`}
            onClick={rejectAll}
          >
            Rechazar todas
          </button>
          <button 
            ref={customizeRef}
            className={`btn-customize ${activeAction === 'customize' ? 'active' : ''}`}
            onClick={handleCustomize}
          >
            {showDetails ? 'Ocultar detalles' : 'Personalizar'}
          </button>
        </div>

        {showDetails && (
          <div className="cookie-consent-details">
            {Object.entries(grouped).map(([category, cookies]) => {
              const categoryInfo = getCategoryInfo(category)
              const categoryEnabled = cookies.every(cookie => localOptions[cookie.id])
              
              return (
                <div key={category} className="cookie-category">
                  <div className="category-header">
                    <div className="category-info">
                      <h3 className="category-title">
                        {categoryInfo.title}
                      </h3>
                      <p>{categoryInfo.description}</p>
                    </div>
                    {category !== 'necessary' && (
                      <div className="category-toggle">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={categoryEnabled}
                            onChange={(e) => toggleCategory(category, e.target.checked)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="cookie-list">
                    {cookies.map(cookie => (
                      <div key={cookie.id} className="cookie-item">
                        <div className="cookie-info">
                          <div className="cookie-header">
                            <strong>{cookie.name}</strong>
                            <span className="cookie-provider">{cookie.provider}</span>
                          </div>
                          <p className="cookie-description">{cookie.description}</p>
                          <div className="cookie-meta">
                            <span className="cookie-duration">Duración: {cookie.duration}</span>
                          </div>
                        </div>
                        {category === 'necessary' ? (
                          <label className="toggle-switch disabled">
                            <input type="checkbox" checked disabled />
                            <span className="slider"></span>
                          </label>
                        ) : (
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={!!localOptions[cookie.id]}
                              onChange={() => toggleOption(cookie.id)}
                            />
                            <span className="slider"></span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="cookie-consent-footer">
          <button 
            className="btn-save" 
            onClick={handleSaveConsent}
          >
            Guardar y acceptar
          </button>
          <p className="cookie-consent-legal">
            Al hacer clic en &quot;Guardar y acceptar&quot;, aceptas el uso de cookies según tus selecciones. 
            <br></br>Puedes cambiar estas preferencias en cualquier momento.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
