import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Caminho para o arquivo DOCX gerado pelo script Python
    const docxPath = path.join(process.cwd(), "public", "Mapa_de_Salas.docx")

    // Verifica se o arquivo existe
    if (!fs.existsSync(docxPath)) {
      return NextResponse.json(
        {
          error: "Arquivo não encontrado",
          message: "O arquivo DOCX não foi encontrado. Execute a geração do cronograma primeiro.",
        },
        { status: 404 },
      )
    }

    // Lê o arquivo
    const fileBuffer = fs.readFileSync(docxPath)

    // Retorna o arquivo como resposta
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=Mapa_de_Salas.docx",
      },
    })
  } catch (error) {
    console.error("Erro ao processar download:", error)

    // Melhorando o tratamento de erro
    return NextResponse.json(
      {
        error: "Erro ao gerar arquivo para download",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
