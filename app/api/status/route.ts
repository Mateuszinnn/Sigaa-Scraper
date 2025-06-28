import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
  const filePath = path.resolve('./public', 'Mapa_de_Salas.docx')

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath)
    return NextResponse.json({
      exists: true,
      lastModified: stats.mtime,
    })
  }

  return NextResponse.json({ exists: false })
}
