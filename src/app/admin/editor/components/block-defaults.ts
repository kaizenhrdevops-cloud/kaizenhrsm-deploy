export type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "video"
  | "quote"
  | "code"
  | "table";

function defaultTableContent() {
  const header = (text: string) => ({
    type: "tableHeader",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  });
  const cell = (text: string) => ({
    type: "tableCell",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  });
  const row = (cells: { type: string; content: unknown }[]) => ({
    type: "tableRow",
    content: cells,
  });

  return {
    type: "doc",
    content: [
      {
        type: "table",
        content: [
          row([header("Header 1"), header("Header 2"), header("Header 3")]),
          row([cell("Cell 1"), cell("Cell 2"), cell("Cell 3")]),
          row([cell("Cell 4"), cell("Cell 5"), cell("Cell 6")]),
        ],
      },
    ],
  };
}

/**
 * Default content for a newly added block.
 * Extracted from step-3-content so the editor orchestrator stays readable.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDefaultContent(type: BlockType): any {
  switch (type) {
    case "paragraph":
      return {
        type: "doc",
        content: [{ type: "paragraph" }],
      };
    case "heading":
      return { level: 2, text: "" };
    case "image":
      return { url: "", alt: "", caption: "" };
    case "video":
      return { url: "", caption: "" };
    case "quote":
      return { text: "", author: "" };
    case "code":
      return { code: "", language: "javascript" };
    case "table":
      return defaultTableContent();
  }
}
