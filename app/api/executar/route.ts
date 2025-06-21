import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

export async function GET(request: NextRequest) {
  // Cria um stream de transformação para enviar logs em tempo real
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Função para enviar logs via stream
  const sendLog = (message: string) => {
    writer.write(encoder.encode(`data: ${JSON.stringify({ log: message })}\n\n`));
  };

  // Inicia o processamento assíncrono
  (async () => {
    try {
      sendLog("Iniciando execução do script...");
      
      // Executa o script Python com streams
      const pythonProcess = spawn('python', ['-u', 'app/scripts/sigaa-scrapper.py'],{
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          PYTHONIOENCODING: 'utf-8', 
          PYTHONUTF8: '1'            
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdoutBuffer = '';
      let stderrBuffer = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        const text = data.toString('utf-8');
        
        // Processar por linhas completas
        stdoutBuffer += text;
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop() || '';
        
        lines.forEach(line => {
          if (line.trim()) sendLog(line.trim());
        });
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        const text = data.toString('utf-8');
        
        stderrBuffer += text;
        const lines = stderrBuffer.split('\n');
        stderrBuffer = lines.pop() || '';
        
        lines.forEach(line => {
          if (line.trim()) sendLog(`ERRO: ${line.trim()}`);
        });
      });


      pythonProcess.on('close', async (code) => {
        if (code === 0) {
          sendLog("Processamento concluído com sucesso!");
          // Verifica se o arquivo foi gerado
          const docxPath = path.join(process.cwd(), "Mapa_de_Salas.docx");
          if (fs.existsSync(docxPath)) {
            writer.write(encoder.encode(`data: ${JSON.stringify({ success: true, docxPath: "Mapa_de_Salas.docx" })}\n\n`));
          } else {
            writer.write(encoder.encode(`data: ${JSON.stringify({ success: false, message: "Arquivo não gerado" })}\n\n`));
          }
        } else {
          writer.write(encoder.encode(`data: ${JSON.stringify({ success: false, message: `Script falhou com código ${code}` })}\n\n`));
        }
        writer.close();
      });
    } catch (error) {
      sendLog(`Erro crítico: ${error instanceof Error ? error.message : String(error)}`);
      writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
    },
  });
}