import * as fs from "fs"
import * as path from "path"

export async function parseResume(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === ".pdf") return parsePDF(filePath)
  else if (ext === ".docx") return parseDOCX(filePath)
  else if (ext === ".txt") return fs.readFileSync(filePath, "utf-8")
  else throw new Error("Unsupported file format: " + ext)
}

async function parsePDF(filePath: string): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default
  const buffer = fs.readFileSync(filePath)
  const data = await pdfParse(buffer)
  return data.text
}

async function parseDOCX(filePath: string): Promise<string> {
  const mammoth = (await import("mammoth")).default
  const buffer = fs.readFileSync(filePath)
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}