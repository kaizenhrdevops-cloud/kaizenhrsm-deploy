// Custom table cell extensions — adds spreadsheet essentials missing from
// stock TipTap cells: per-cell background color (set via
// `setCellAttribute('backgroundColor', ...)`, which natively applies to
// every cell in a multi-cell / CellSelection) and text alignment support
// (enabled by adding these types to TextAlign in paragraph-block.tsx).

import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

const backgroundColorAttr = {
  backgroundColor: {
    default: null,
    parseHTML: (element: HTMLElement) =>
      element.style.backgroundColor || null,
    renderHTML: (attributes: Record<string, unknown>) => {
      if (!attributes.backgroundColor) {
        return {};
      }
      return { style: `background-color: ${attributes.backgroundColor}` };
    },
  },
};

export const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...backgroundColorAttr,
    };
  },
});

export const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...backgroundColorAttr,
    };
  },
});
