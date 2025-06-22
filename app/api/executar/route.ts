import { type NextRequest } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export async function GET(request: NextRequest) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  let isClosed = false;

  // Utilitários seguros para escrita e fechamento
  const safeWrite = (data: string) => {
    if (!isClosed) {
      try {
        writer.write(encoder.encode(data));
      } catch (err) {
        console.warn("Tentativa de escrever após fechamento do stream", err);
      }
    }
  };

  const safeClose = () => {
    if (!isClosed) {
      try {
        writer.close();
      } catch (err) {
        console.warn("Tentativa de fechar stream já fechado", err);
      }
      isClosed = true;
    }
  };

  const sendLog = (message: string) => {
    safeWrite(`data: ${JSON.stringify({ log: message })}\n\n`);
  };

  (async () => {
    try {
      sendLog("Iniciando execução do script...");

      const pythonProcess = spawn("python", ["-u", "app/scripts/sigaa-scrapper.py"], {
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1",
          PYTHONIOENCODING: "utf-8",
          PYTHONUTF8: "1"
        },
        stdio: ["pipe", "pipe", "pipe"]
      });

      // Encerra o processo caso o cliente aborte a requisição
      request.signal.addEventListener("abort", () => {
        console.log("[API] Conexão abortada pelo cliente");
        try {
          pythonProcess.kill("SIGTERM");
        } catch (err) {
          console.error("Erro ao tentar encerrar processo:", err);
        }
        safeClose();
      });

      let stdoutBuffer = "";
      let stderrBuffer = "";

      pythonProcess.stdout.on("data", (data: Buffer) => {
        const text = data.toString("utf-8");
        stdoutBuffer += text;
        const lines = stdoutBuffer.split("\n");
        stdoutBuffer = lines.pop() || "";

        lines.forEach((line) => {
          if (line.trim()) sendLog(line.trim());
        });
      });

      pythonProcess.stderr.on("data", (data: Buffer) => {
        const text = data.toString("utf-8");
        stderrBuffer += text;
        const lines = stderrBuffer.split("\n");
        stderrBuffer = lines.pop() || "";

        lines.forEach((line) => {
          if (line.trim()) sendLog(`ERRO: ${line.trim()}`);
        });
      });

      pythonProcess.on("close", async (code) => {
        if (isClosed) return; // cliente já fechou, então não continue

        if (code === 0) {
          sendLog("Processamento concluído com sucesso!");
          const docxPath = path.join(process.cwd(), "Mapa_de_Salas.docx");

          if (fs.existsSync(docxPath)) {
            safeWrite(`data: ${JSON.stringify({ success: true, docxPath: "Mapa_de_Salas.docx" })}\n\n`);
          } else {
            safeWrite(`data: ${JSON.stringify({ success: false, message: "Arquivo não gerado" })}\n\n`);
          }
        } else {
          safeWrite(`data: ${JSON.stringify({ success: false, message: `Script falhou com código ${code}` })}\n\n`);
        }

        safeClose();
      });
    } catch (error) {
      sendLog(`Erro crítico: ${error instanceof Error ? error.message : String(error)}`);
      safeClose();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Connection": "keep-alive",
      "Cache-Control": "no-cache"
    }
  });
}
