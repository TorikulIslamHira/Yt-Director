import mammoth from "mammoth";
import WordExtractor from "word-extractor";

export async function extractScriptText(fileName: string, buffer: Buffer): Promise<string> {
  const ext = fileName.toLowerCase().split(".").pop();

  switch (ext) {
    case "txt":
      return buffer.toString("utf-8");
    case "docx": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case "doc": {
      const extractor = new WordExtractor();
      const doc = await extractor.extract(buffer);
      return doc.getBody();
    }
    case "pdf": {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return result.text;
      } finally {
        await parser.destroy();
      }
    }
    default:
      throw new Error(`Unsupported file type: .${ext}`);
  }
}
