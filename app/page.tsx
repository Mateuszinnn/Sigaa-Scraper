"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, FileText, AlertTriangle, Sparkles, Play, Square } from "lucide-react"
import { useToast } from "@/app/hooks/use-toast"
import LogViewer from "@/components/log-viewer"
import { YearSemesterSelector } from '@/components/YearSemesterSelector';
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/app/lib/utils"
import { useIsMobile } from "@/app/hooks/use-mobile"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import logo from '@/app/assets/image.png'

interface Particle { left: number; top: number; duration: number; delay: number; }
// Constantes para animações - facilita ajustes e melhora performance
const ANIMATION_CONFIG = {
  headerAnimation: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },
  contentAnimation: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: 0.1 },
  },
  tabContentAnimation: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.25 },
  },
  buttonHoverAnimation: {
    whileHover: { scale: 1.01 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.1 },
  },
  successAnimation: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  },
}

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradiente base */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20" />

      {/* Orbs flutuantes */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/2 left-3/4 w-64 h-64 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"
        animate={{
          x: [0, -60, 0],
          y: [0, -80, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 18,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}

// Componente de partículas flutuantes (background)
const FloatingParticles = () => {
  const isMobile = useIsMobile();
  const count = isMobile ? 15 : 30;

  // 1) estado vazio na primeira renderização (SSR e primeiro cliente)
  const [particles, setParticles] = useState<Particle[]>([]);

  // 2) depois que monta no cliente, preenche com valores aleatórios
  useEffect(() => {
    const p = Array.from({ length: count }).map<Particle>(() => ({
      left: Math.random() * 100,
      top:  Math.random() * 100,
      duration: Math.random() * 3 + 2,
      delay:    Math.random() * 2,
    }));
    setParticles(p);
  }, [count]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {particles.map(({ left, top, duration, delay }, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/70 rounded-full"
          style={{ left: `${left}%`, top: `${top}%` }}
          animate={{ y: [-20, -100], opacity: [0,1,0] }}
          transition={{ duration, repeat: Infinity, delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [downloadReady, setDownloadReady] = useState(false)
  const [activeTab, setActiveTab] = useState("gerar")
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [showSuccessEffect, setShowSuccessEffect] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const particleCount = useMemo(() => (isMobile ? 25 : 50), [isMobile])
  const [lastGeneratedDate, setLastGeneratedDate] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSemester, setSelectedSemester] = useState(1);

  // Efeito para animação de sucesso - otimizado
  useEffect(() => {
    if (success) {
      setShowSuccessEffect(true)
      const timer = setTimeout(() => {
        setShowSuccessEffect(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
  const checkDocxStatus = async () => {
    try {
      const res = await fetch("/api/status")
      const data = await res.json()
      if (data.exists) {
        setDownloadReady(true)
        setLastGeneratedDate(new Date(data.lastModified).toLocaleString("pt-BR"))
      }
    } catch (err) {
      console.error("Erro ao verificar status do arquivo:", err)
    }
  }

  checkDocxStatus()
}, [])

  const stopProcess = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setLoading(false)
    setConnectionStatus("disconnected")
    setLogs((prev) => [...prev, "Processo interrompido pelo usuário."])
  }, [])

  // Memoize funções para evitar re-renderizações desnecessárias
const fetchCronograma = useCallback(async () => {
  setLoading(true);
  setLogs(["Iniciando coleta..."]);
  setActiveTab("logs");
  setError(null);
  setSuccess(false);
  setDownloadReady(false);

  if (eventSourceRef.current) {
    eventSourceRef.current.close();
    eventSourceRef.current = null;
  }

  try {
    if (!selectedYear || !selectedSemester) {
      toast({
        title: "Erro",
        description: "Selecione o ano e o semestre antes de gerar o cronograma.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    const eventSource = new EventSource(`/api/executar?year=${selectedYear}&semester=${selectedSemester}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      if (data.log) {
        setLogs((prev) => [...prev, data.log]);
      }

      if (data.success !== undefined) {
        eventSource.close();

        if (data.success) {
          setSuccess(true);
          setDownloadReady(true);
          setActiveTab("gerar");
          setLastGeneratedDate(new Date(data.lastModified).toLocaleString("pt-BR"))
          toast({ title: "Sucesso!", description: "Cronograma gerado" });
        } else {
          setError(data.message || "Erro na geração");
          toast({
            title: "Erro",
            description: data.message || "Erro na geração",
            variant: "destructive",
          });
        }

        setLoading(false);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setLoading(false);
      setError("Erro na conexão com o servidor");
      toast({
        title: "Erro",
        description: "Erro na conexão com o servidor",
        variant: "destructive",
      });
    };
  } catch (error: any) {
    console.error("Erro ao buscar cronograma:", error);
    const message = error instanceof Error ? error.message : String(error);
    setError(message);
    setLogs((prev) => [...prev, `Erro: ${message}`]);
    toast({
      title: "Erro",
      description: `Ocorreu um erro ao gerar o cronograma: ${message}`,
      variant: "destructive",
    });
    setLoading(false);
  }
}, [selectedYear, selectedSemester, toast]);


  const downloadDocx = useCallback(async () => {
    try {
      setLogs((prev) => [...prev, "Iniciando download do arquivo DOCX..."])

      const response = await fetch("/api/download")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || `Erro ao baixar arquivo: ${response.status}`
        throw new Error(errorMessage)
      }

      const contentType = response.headers.get("Content-Type")
      if (
        !contentType ||
        !contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      ) {
        throw new Error("O tipo de arquivo recebido não é um documento DOCX válido")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "Mapa_de_Salas.docx"
      document.body.appendChild(a)
      a.click()

      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setLogs((prev) => [...prev, "Download concluído com sucesso!"])

      toast({
        title: "📄 Download concluído",
        description: "O arquivo DOCX foi baixado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error)
      setLogs((prev) => [...prev, `Erro no download: ${error instanceof Error ? error.message : String(error)}`])

      toast({
        title: "Erro no download",
        description: `Ocorreu um erro ao baixar o arquivo DOCX: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    }
  }, [toast])

  // Memoize o componente de partículas para evitar re-renderizações
   const SuccessParticles = useMemo(() => {
    if (!showSuccessEffect) return null

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      >
        <div className="relative w-full h-full">
          {Array.from({ length: particleCount }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 8 + 4,
                height: Math.random() * 8 + 4,
                background: `linear-gradient(45deg, ${
                  ["#3B82F6", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B"][Math.floor(Math.random() * 5)]
                }, ${["#1D4ED8", "#7C3AED", "#0891B2", "#059669", "#D97706"][Math.floor(Math.random() * 5)]})`,
              }}
              initial={{
                opacity: 1,
                x: "50vw",
                y: "50vh",
                scale: 0,
              }}
              animate={{
                opacity: 0,
                x: `${50 + (Math.random() - 0.5) * 100}vw`,
                y: `${50 + (Math.random() - 0.5) * 100}vh`,
                scale: [0, 1, 0],
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 1.5 + Math.random(),
                ease: "easeOut",
                delay: Math.random() * 0.3,
              }}
            />
          ))}

          {/* Texto de sucesso central */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-8 w-8 text-yellow-500" />
                <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Sucesso!
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    )
  }, [showSuccessEffect, particleCount])

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <FloatingParticles />
      <AnimatePresence>{SuccessParticles}</AnimatePresence>

      <main className="container mx-auto py-8 px-4">
        <motion.div {...ANIMATION_CONFIG.headerAnimation} className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-2">
            <img src={logo.src} alt="Logo" width="200"/>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#01356f] dark:text-[#01356f]">
            Sistema de Mapa de Salas
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Gerencie cronogramas de aulas por sala com facilidade. Visualize, exporte e compartilhe informações
            acadêmicas em poucos cliques.
          </p>
        </motion.div>

        <motion.div {...ANIMATION_CONFIG.contentAnimation}>
          <Tabs defaultValue="gerar" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-center mb-8">
              <TabsList className="grid grid-cols-2 w-[400px] max-w-full bg-blue-50 dark:bg-gray-800 p-1 rounded-lg shadow-inner">
                <TabsTrigger
                  value="gerar"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400 rounded-md transition-all duration-200"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Gerar Cronograma
                </TabsTrigger>
                <TabsTrigger
                  value="logs"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400 rounded-md transition-all duration-200"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Logs do Sistema
                  {logs.length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-blue-100 dark:bg-blue-900 text-xs">
                      {logs.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="max-w-8xl w-full mx-auto relative z-[9999]">
              <div className="mb-8">
                <YearSemesterSelector
                  selectedYear={selectedYear}
                  selectedSemester={selectedSemester}
                  onYearChange={setSelectedYear}
                  onSemesterChange={setSelectedSemester}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8">
              <TabsContent value="gerar" className="mt-0">
                <motion.div
                  {...ANIMATION_CONFIG.tabContentAnimation}
                  className="bg-white/10 dark:bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-visible border border-white/20"
                  layout="position"
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <Calendar className="mr-2 h-6 w-6 text-blue-500" />
                        Gerar Cronograma
                      </h2>
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-3 py-1 text-xs font-medium rounded-full",
                          loading
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
                            : success
                              ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                              : "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                        )}
                      >
                        {loading ? "Gerando..." : success ? "Concluído" : "Pronto para gerar"}
                      </Badge>
                    </div>

                    {error && (
                      <Alert variant="destructive" className="mb-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-6">
                      <div className="bg-blue-50 dark:bg-gray-800/50 p-4 rounded-xl">
                        <p className="text-gray-700 dark:text-gray-300">
                          Este sistema irá gerar um mapa completo de salas processando os departamentos definidos
                          disponíveis no SIGAA. O processo pode levar alguns minutos. Você pode acompanhar o progresso
                          na aba "Logs do Sistema".
                        </p>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <motion.div {...ANIMATION_CONFIG.buttonHoverAnimation} className="w-full">
                            <Button
                            onClick={loading ? stopProcess : fetchCronograma}
                            className={cn(
                              "w-full h-16 rounded-2xl shadow-2xl text-lg font-bold transition-all duration-300 transform",
                              loading
                                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/25"
                                : "bg-gradient-to-r from-[#01356f] to-[#01356f] hover:from-[#081d3d] hover:to-[#081d3d] text-white shadow-blue-500/25",
                            )}
                          >
                            {loading ? (
                              <span className="flex items-center justify-center">
                                <Square className="mr-3 h-6 w-6" />
                                Parar Processo
                              </span>
                            ) : (
                              <span className="flex items-center justify-center">
                                <Play className="mr-3 h-6 w-6" />
                                Gerar Cronograma
                              </span>
                            )}
                          </Button>
                          </motion.div>
                        </div>

                        <div className="flex-1">
                          <motion.div {...ANIMATION_CONFIG.buttonHoverAnimation} className="w-full">
                            <Button
                              onClick={downloadDocx}
                              disabled={!downloadReady}
                              variant="outline"
                              className={cn(
                                "w-full h-16 rounded-2xl border-2 text-lg font-bold transition-all duration-200",
                                downloadReady
                                  ? "border-green-500 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20"
                                  : "border-gray-300 text-gray-400 dark:border-gray-700 dark:text-gray-500",
                              )}
                            >
                              <FileText className="mr-2 h-5 w-5" />
                              Baixar DOCX
                            </Button>
                          </motion.div>
                          {lastGeneratedDate && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                              Arquivo gerado em: <span className="font-medium">{lastGeneratedDate}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {success && (
                        <motion.div
                          {...ANIMATION_CONFIG.successAnimation}
                          className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-4 flex items-center"
                        >
                          <div className="bg-green-100 dark:bg-green-800 rounded-full p-2 mr-4">
                            <svg
                              className="h-6 w-6 text-green-600 dark:text-green-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-green-800 dark:text-green-400">
                              Cronograma gerado com sucesso!
                            </h3>
                            <p className="text-green-700 dark:text-green-500 text-sm">
                              O arquivo está pronto para download.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="logs" className="mt-0">
                <motion.div
                  {...ANIMATION_CONFIG.tabContentAnimation}
                  className="bg-white/10 dark:bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/20"
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <Clock className="mr-2 h-6 w-6 text-blue-500" />
                        Logs do Sistema
                      </h2>
                      <Badge
                        variant="outline"
                        className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                      >
                        {logs.length} entradas
                      </Badge>
                    </div>

                    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-inner">
                      <LogViewer logs={logs} />
                    </div>

                    <div className="mt-6 flex justify-between">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLogs([])}
                          className="text-gray-600 dark:text-gray-400 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 rounded-xl"
                          disabled={loading}
                        >
                          🗑️ Limpar logs
                        </Button>
                      </motion.div>

                      {loading && (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={stopProcess}
                            className="text-red-600 dark:text-red-400 border-red-300 hover:bg-red-50 dark:border-red-600 dark:hover:bg-red-900/20 rounded-xl"
                          >
                            🚫 Parar Processo
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="mt-16 text-center text-gray-500 dark:text-gray-400"
        >
          <p className="text-sm">
            © {new Date().getFullYear()} Sistema de Mapa de Salas. Todos os direitos reservados.
          </p>
        </motion.footer>
      </main>
    </div>
  )
}
