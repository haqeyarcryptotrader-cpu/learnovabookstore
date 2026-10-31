import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

// Standard PDF fonts only support Latin characters; strip anything else.
const latin = (s: string) => s.replace(/[^\x20-\x7E]/g, "").trim();

export async function stampPdf(url: string, name: string, phone: string, title: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load the PDF file");
  const doc = await PDFDocument.load(await res.arrayBuffer(), { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const who = latin(name) || "Customer";
  const ph = latin(phone);
  const footer = `Licensed to: ${who} | WhatsApp: ${ph} | Learnova Books - copying or sharing is prohibited`;
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const size = Math.max(6, Math.min(9, (width - 40) / (footer.length * 0.55)));
    page.drawText(footer, { x: 20, y: 12, size, font, color: rgb(0.55, 0.1, 0.1), opacity: 0.85 });
    page.drawText(`${who} - ${ph}`, {
      x: width * 0.18, y: height * 0.35, size: Math.min(width, height) / 16, font,
      color: rgb(0.6, 0.6, 0.6), opacity: 0.12, rotate: degrees(35),
    });
  }
  doc.setAuthor(`Learnova Books - licensed to ${who}`);
  const bytes = await doc.save();
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${latin(title).replace(/\s+/g, "-") || "book"}-${who.replace(/\s+/g, "-")}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
