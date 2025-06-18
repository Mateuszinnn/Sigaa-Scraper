"use client"

import { useState, useEffect } from "react"

export function useIsMobile() {
  // Inicializa com null para evitar incompatibilidade de SSR
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    // Função para verificar se é dispositivo móvel
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Verifica inicialmente
    checkMobile()

    // Adiciona listener para redimensionamento com debounce para melhor performance
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkMobile, 100)
    }

    window.addEventListener("resize", handleResize)

    // Limpa o listener quando o componente é desmontado
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return isMobile === null ? false : isMobile
}
