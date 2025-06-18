"use client"

import { useEffect, useRef, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface LogViewerProps {
  logs: string[]
}

// Usando memo para evitar re-renderizações desnecessárias
const LogViewer = memo(function LogViewer({ logs }: LogViewerProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll para o último log
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current
      scrollElement.scrollTop = scrollElement.scrollHeight
    }
  }, [logs])

  // Configurações de animação otimizadas
  const logItemVariants = {
    hidden: { opacity: 0, x: -5 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <div
      ref={scrollAreaRef}
      className="h-[350px] overflow-y-auto p-4 font-mono text-sm bg-gradient-to-b from-gray-900 to-gray-950 text-green-400 rounded-xl"
      style={{
        boxShadow: "inset 0 0 30px rgba(0, 0, 0, 0.5)",
        willChange: "transform", // Dica para o navegador otimizar a renderização
      }}
    >
      {logs.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500 animate-pulse">Aguardando logs do sistema...</p>
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {logs.map((log, index) => (
              <motion.div
                key={`${index}-${log.substring(0, 10)}`}
                initial="hidden"
                animate="visible"
                variants={logItemVariants}
                transition={{
                  duration: 0.2,
                  // Usar CSS transform em vez de JS para melhor performance
                  type: "tween",
                }}
                className="py-1 border-b border-gray-800 last:border-0"
                // Otimização para evitar re-renderizações desnecessárias
                layout={false}
              >
                <span className="text-blue-400 mr-2">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-green-400">{log}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
})

export default LogViewer
