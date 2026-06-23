import { appStore } from "../store/appStore";

export const exportChapterToWord = async (
  title: string,
  body: string,
  bookIdx: number,
) => {
  const [docxModule, fileSaverModule] = await Promise.all([
    import("docx"),
    import("file-saver"),
  ]);

  const { Document, Packer, Paragraph, TextRun } = docxModule;
  const { saveAs } = fileSaverModule;

  // Convert HTML to plain text paragraphs
  const temp = document.createElement("div");
  temp.innerHTML = body || "";

  // Refresh mention names before export
  const mentionSpans = temp.querySelectorAll("span[data-mention-id]");
  if (mentionSpans.length > 0 && bookIdx >= 0) {
    const book = appStore.books[bookIdx].get();
    mentionSpans.forEach((span) => {
      const id = span.getAttribute("data-mention-id");
      const trigger = span.getAttribute("data-trigger");
      let entity: { name?: string } | undefined | null = null;
      switch (trigger) {
        case "@":
          entity = book.characters?.find((c) => c.id === id);
          break;
        case "#":
          entity = book.nations?.find((c) => c.id === id);
          break;
        case "%":
          entity = book.monsters?.find((c) => c.id === id);
          break;
        case "~":
          entity = book.ingredients?.find((c) => c.id === id);
          break;
        case "^":
          entity = book.techniques?.find((c) => c.id === id);
          break;
        case "$":
          entity = book.treasures?.find((c) => c.id === id);
          break;
      }
      if (entity) {
        span.textContent = `${trigger}${entity.name}`;
      }
    });
  }

  // Get text and split by newlines
  const paragraphs = Array.from(temp.querySelectorAll("p")).map(
    (p) => p.textContent || "",
  );
  // If no <p> tags were found, fallback to innerText split
  const lines = paragraphs.length > 0 ? paragraphs : temp.innerText.split("\n");

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title || "Untitled Chapter",
                bold: true,
                size: 32, // 16pt
              }),
            ],
            spacing: { after: 400 },
          }),
          ...lines
            .filter((line) => line.trim().length > 0)
            .map(
              (line) =>
                new Paragraph({
                  text: line,
                  spacing: { after: 200 },
                }),
            ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title || "chapter"}.docx`);
};
