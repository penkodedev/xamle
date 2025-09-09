import { useState, useEffect, useCallback } from 'react'

export type CookieCategory = 'necessary' | 'performance' | 'marketing' | 'functionality'

export type CookiePreference = {
  id: string
  enabled: boolean
  category: CookieCategory
}

export type CookieConsentState = {
  preferences: Record<string, boolean>
  hasConsented: boolean
  isLoaded: boolean
}

const COOKIE_CONSENT_KEY = 'cookie_consent_options'
const COOKIE_CONSENT_VERSION = '1.0'

export const useCookieConsent = () => {
  const [state, setState] = useState<CookieConsentState>({
    preferences: {},
    hasConsented: false,
    isLoaded: false
  })

  // Cargar preferencias desde localStorage
  const loadPreferences = useCallback(() => {
    try {
      const saved = localStorage.getItem(COOKIE_CONSENT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.version === COOKIE_CONSENT_VERSION) {
          setState({
            preferences: parsed.preferences || {},
            hasConsented: true,
            isLoaded: true
          })
          return
        }
      }
    } catch (error) {
      console.warn('Error loading cookie preferences:', error)
    }
    
    setState(prev => ({ ...prev, isLoaded: true }))
  }, [])

  // Guardar preferencias
  const savePreferences = useCallback((preferences: Record<string, boolean>) => {
    try {
      const consentData = {
        version: COOKIE_CONSENT_VERSION,
        preferences,
        timestamp: Date.now()
      }
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData))
      
      setState({
        preferences,
        hasConsented: true,
        isLoaded: true
      })

      // Disparar evento personalizado para que otros componentes puedan escuchar
      window.dispatchEvent(new CustomEvent('cookieConsentChanged', { 
        detail: { preferences } 
      }))

      return true
    } catch (error) {
      console.error('Error saving cookie preferences:', error)
      return false
    }
  }, [])

  // Obtener todas las cookies por categoría
  const getCookiesByCategory = useCallback((category: CookieCategory) => {
    const allCookies = [
      // Cookies necesarias
      { id: 'session', category: 'necessary' as CookieCategory },
      { id: 'csrf', category: 'necessary' as CookieCategory },
      { id: 'language', category: 'necessary' as CookieCategory },
      
      // Cookies de rendimiento
      { id: 'analytics', category: 'performance' as CookieCategory },
      { id: 'performance', category: 'performance' as CookieCategory },
      
      // Cookies de marketing
      { id: 'google_ads', category: 'marketing' as CookieCategory },
      { id: 'facebook_pixel', category: 'marketing' as CookieCategory },
      { id: 'retargeting', category: 'marketing' as CookieCategory },
      
      // Cookies de funcionalidad
      { id: 'preferences', category: 'functionality' as CookieCategory },
      { id: 'social_media', category: 'functionality' as CookieCategory }
    ]
    
    return allCookies.filter(cookie => cookie.category === category)
  }, [])

  // Verificar si una categoría específica está habilitada
  const isCategoryEnabled = useCallback((category: CookieCategory) => {
    const categoryCookies = getCookiesByCategory(category)
    return categoryCookies.every(cookie => !!state.preferences[cookie.id])
  }, [state.preferences, getCookiesByCategory])

  // Verificar si una cookie específica está habilitada
  const isCookieEnabled = useCallback((cookieId: string) => {
    return !!state.preferences[cookieId]
  }, [state.preferences])

  // Cargar preferencias al montar el componente
  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  return {
    ...state,
    savePreferences,
    isCategoryEnabled,
    isCookieEnabled,
    getCookiesByCategory
  }
}

// Hook para componentes que necesitan respetar las preferencias de cookies
export const useCookieAware = (cookieId: string, category: CookieCategory) => {
  const { isCookieEnabled, isCategoryEnabled, hasConsented } = useCookieConsent()
  
  const shouldLoad = () => {
    if (!hasConsented) return false
    if (category === 'necessary') return true
    return isCookieEnabled(cookieId) || isCategoryEnabled(category)
  }

  return {
    shouldLoad: shouldLoad(),
    isEnabled: isCookieEnabled(cookieId),
    hasConsented
  }
}

// Hook para inicializar Google Analytics
export const useGoogleAnalytics = (measurementId: string) => {
  const { isCookieEnabled, isCategoryEnabled } = useCookieConsent()
  
  useEffect(() => {
    const shouldLoad = isCookieEnabled('analytics') || isCategoryEnabled('performance')
    
    if (shouldLoad && typeof window !== 'undefined' && !window.gtag) {
      // Cargar gtag script
      const script = document.createElement('script')
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
      script.async = true
      document.head.appendChild(script)

      // Inicializar gtag
      window.dataLayer = window.dataLayer || []
      window.gtag = function() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer?.push(arguments)
      }
      // CORRECCIÓN: TypeScript es estricto con los tipos de gtag.
      // Le decimos que trate los argumentos como 'any' para que coincidan con la definición global.
      const gtagArgs: any[] = ['js', new Date()];
      window.gtag(...gtagArgs);
      window.gtag('config', measurementId, {
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure'
      })
      
      console.log('✅ Google Analytics cargado')
    }
  }, [measurementId, isCookieEnabled, isCategoryEnabled])
}

// Hook para inicializar Facebook Pixel
export const useFacebookPixel = (pixelId: string) => {
  const { isCookieEnabled, isCategoryEnabled } = useCookieConsent()
  
  useEffect(() => {
    const shouldLoad = isCookieEnabled('facebook_pixel') || isCategoryEnabled('marketing')
    
    if (shouldLoad && typeof window !== 'undefined' && !window.fbq) {
      // Cargar Facebook Pixel script
      const script = document.createElement('script')
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `
      document.head.appendChild(script)
      
      console.log('✅ Facebook Pixel cargado')
    }
  }, [pixelId, isCookieEnabled, isCategoryEnabled])
}

// Función utilitaria para cargar scripts condicionalmente (sin hooks)
export const loadScriptConditionally = (
  scriptSrc: string, 
  preferences: Record<string, boolean>,
  cookieId: string, 
  category: CookieCategory
) => {
  const hasConsented = Object.keys(preferences).length > 0
  
  if (!hasConsented) return false
  if (category === 'necessary') return true
  
  const isCookieEnabled = !!preferences[cookieId]
  const isCategoryEnabled = (() => {
    const categoryCookies = [
      { id: 'session', category: 'necessary' as CookieCategory },
      { id: 'csrf', category: 'necessary' as CookieCategory },
      { id: 'language', category: 'necessary' as CookieCategory },
      { id: 'analytics', category: 'performance' as CookieCategory },
      { id: 'performance', category: 'performance' as CookieCategory },
      { id: 'google_ads', category: 'marketing' as CookieCategory },
      { id: 'facebook_pixel', category: 'marketing' as CookieCategory },
      { id: 'retargeting', category: 'marketing' as CookieCategory },
      { id: 'preferences', category: 'functionality' as CookieCategory },
      { id: 'social_media', category: 'functionality' as CookieCategory }
    ].filter(cookie => cookie.category === category)
    
    return categoryCookies.every(cookie => preferences[cookie.id])
  })()
  
  const shouldLoad = isCookieEnabled || isCategoryEnabled
  
  if (shouldLoad) {
    const script = document.createElement('script')
    script.src = scriptSrc
    script.async = true
    document.head.appendChild(script)
    return true
  }
  
  return false
}

// Tipos para TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: IArguments[];
    fbq?: (...args: any[]) => void;
  }
} 