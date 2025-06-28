"use client"

import { useEffect, useRef, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowDown, Terminal } from "lucide-react"

interface LogViewerProps {
  logs: string[]
}

const LogViewer = memo(function LogViewer({ logs }: LogViewerProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)

  useEffect(() => {
    if (scrollAreaRef.current && shouldAutoScrollRef.current) {
      const scrollElement = scrollAreaRef.current
      scrollElement.scrollTop = scrollElement.scrollHeight
    }
  }, [logs])

  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    shouldAutoScrollRef.current = scrollTop + clientHeight >= scrollHeight - 5;
  };

  const getLogStyle = (log: string) => {
    if (log.startsWith("ERRO") || log.startsWith("[ERRO") || log.startsWith("Erro") ||log.includes("❌")) {
      return "text-red-400 bg-red-900/20 border-l-4 border-red-500 pl-3"
    }
    if (log.includes("sucesso") ||log.includes("Documento") || log.includes("✅") || log.includes("concluído")) {
      return "text-green-400 bg-green-900/20 border-l-4 border-green-500 pl-3"
    }
    if (log.includes("Processando") || log.includes("departamento") || log.includes("🚀")) {
      return "text-yellow-400 bg-yellow-900/20 border-l-4 border-yellow-500 pl-3"
    }
    if (log.includes("Configurando") || log.includes("Iniciando")) {
      return "text-blue-400 bg-blue-900/20 border-l-4 border-blue-500 pl-3"
    }
    if (log.includes("Extraindo") || log.includes("📝")) {
      return "text-green-400 bg-green-900/20 border-l-4 border-green-500 pl-3"
    }
    if (log.startsWith("Processo interrompido") ||log.includes("🚫")) {
      return "text-red-400 bg-red-900/20 border-l-4 border-red-500 pl-3"
    }
    if (log.includes("DISCIPLINA_INCONSISTENTE")) {
      return "text-orange-400 bg-orange-900/20 border-l-4 border-orange-500 pl-3"
    }
    return "text-green-300"
  }

  const getLogIcon = (log: string) => {
    if (log.startsWith("ERRO:") || log.startsWith("[ERRO") || log.startsWith("Erro") || log.includes("❌")) return "❌"
    if (log.includes("sucesso") || log.includes("✅")) return "✅"
    if (log.includes("Processando") || log.includes("🚀")) return "⚡"
    if (log.includes("Configurando")) return "⚙️"
    if (log.includes("Iniciando")) return "🚀"
    if (log.includes("Extraindo")) return "📝"
    if (log.includes("Processo interrompido")) return "🚫"
    if (log.includes("DISCIPLINA_INCONSISTENTE")) return "⚠️"
    return "📝"
  }

  return (
    <div className="relative">
      {/* Header do terminal */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-green-400" />
          <span className="text-green-400 font-mono text-sm font-semibold">Sistema de Logs</span>
        </div>
        {/* Bolinhas de status só quando não há logs ativos */}
        {logs.length === 0 && (
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Área de logs */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="h-[450px] overflow-y-auto p-4 font-mono text-sm bg-gradient-to-b from-gray-900 via-gray-900 to-black"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#4B5563 #1F2937",
        }}
      >
        {logs.length === 0 ? (
          <motion.div
            className="h-full flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="text-6xl mb-4"
            >
              🤖
            </motion.div>
            <p className="text-gray-500 text-center">
              <span className="animate-pulse">Aguardando logs do sistema...</span>
            </p>
            <p className="text-gray-600 text-xs mt-2">Os logs aparecerão aqui em tempo real</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {logs.map((log, index) => (
                <motion.div
                  key={`${index}-${log.substring(0, 20)}`}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut",
                  }}
                  className={`py-2 px-3 rounded-lg transition-all duration-200 hover:bg-gray-800/50 ${getLogStyle(log)}`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-400 text-xs font-semibold min-w-[80px] mt-0.5">
                      [{new Date().toLocaleTimeString()}]
                    </span>
                    <span className="text-lg">{getLogIcon(log)}</span>
                    <span className="flex-1 leading-relaxed">{log}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Indicador de scroll automático */}
            <AnimatePresence>
              {!shouldAutoScrollRef.current && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="sticky bottom-0 right-0 flex justify-end p-2"
                >
                  <motion.button
                    onClick={() => {
                      shouldAutoScrollRef.current = true;
                      if (scrollAreaRef.current) {
                        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
                      }
                    }}
                    className="bg-gradient-to-r from-[#01356f] to-black hover:from-[#081d3d] hover:to-black text-white text-sm px-4 py-2 rounded-full transition-all duration-200 shadow-lg flex items-center space-x-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowDown className="h-4 w-4" />
                    <span>Ir para o final</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Indicador de atividade */}
      {logs.length > 0 && (
        <motion.div
          className="absolute top-3 right-4 flex items-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-2 h-2 bg-green-500 rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
          />
          <span className="text-green-400 text-xs font-semibold">ATIVO</span>
        </motion.div>
      )}
    </div>
  );
})

export default LogViewer
