/**
 * Atom One Dark — shared Monaco theme + CSS token helpers
 * Classic One Dark Syntax palette (Atom)
 */
(function (root) {
  const ATOM_ONE_DARK = {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "abb2bf" },
      { token: "comment", foreground: "5c6370", fontStyle: "italic" },
      { token: "comment.doc", foreground: "5c6370", fontStyle: "italic" },
      { token: "keyword", foreground: "c678dd" },
      { token: "keyword.control", foreground: "c678dd" },
      { token: "keyword.operator", foreground: "56b6c2" },
      { token: "keyword.flow", foreground: "c678dd" },
      { token: "storage", foreground: "c678dd" },
      { token: "storage.type", foreground: "c678dd" },
      { token: "operator", foreground: "56b6c2" },
      { token: "string", foreground: "98c379" },
      { token: "string.escape", foreground: "56b6c2" },
      { token: "number", foreground: "d19a66" },
      { token: "constant", foreground: "d19a66" },
      { token: "constant.numeric", foreground: "d19a66" },
      { token: "constant.language", foreground: "56b6c2" },
      { token: "constant.character", foreground: "98c379" },
      { token: "type", foreground: "e5c07b" },
      { token: "type.identifier", foreground: "e5c07b" },
      { token: "class", foreground: "e5c07b" },
      { token: "struct", foreground: "e5c07b" },
      { token: "function", foreground: "61afef" },
      { token: "function.declaration", foreground: "61afef" },
      { token: "method", foreground: "61afef" },
      { token: "variable", foreground: "e06c75" },
      { token: "variable.predefined", foreground: "e5c07b" },
      { token: "variable.parameter", foreground: "abb2bf" },
      { token: "identifier", foreground: "abb2bf" },
      { token: "delimiter", foreground: "abb2bf" },
      { token: "delimiter.bracket", foreground: "abb2bf" },
      { token: "tag", foreground: "e06c75" },
      { token: "attribute.name", foreground: "d19a66" },
      { token: "attribute.value", foreground: "98c379" },
      { token: "metatag", foreground: "c678dd" },
      { token: "metatag.content", foreground: "98c379" },
      { token: "heading", foreground: "e06c75", fontStyle: "bold" },
      { token: "strong", foreground: "abb2bf", fontStyle: "bold" },
      { token: "emphasis", foreground: "c678dd", fontStyle: "italic" },
      { token: "string.link", foreground: "61afef" },
      { token: "regexp", foreground: "98c379" },
      { token: "annotation", foreground: "e5c07b" },
      { token: "invalid", foreground: "ffffff", background: "e06c75" },
    ],
    colors: {
      "editor.background": "#09090b",
      "editor.foreground": "#abb2bf",
      "editor.lineHighlightBackground": "#17171b",
      "editor.lineHighlightBorder": "#09090b",
      "editorLineNumber.foreground": "#636d83",
      "editorLineNumber.activeForeground": "#abb2bf",
      "editorCursor.foreground": "#528bff",
      "editor.selectionBackground": "#3e4451",
      "editor.inactiveSelectionBackground": "#3a3f4b",
      "editor.selectionHighlightBackground": "#3e445155",
      "editor.wordHighlightBackground": "#3e445166",
      "editor.wordHighlightStrongBackground": "#3e445188",
      "editor.findMatchBackground": "#42557b",
      "editor.findMatchHighlightBackground": "#314365",
      "editorWidget.background": "#0e0e11",
      "editorWidget.border": "#181a1f",
      "editorSuggestWidget.background": "#0e0e11",
      "editorSuggestWidget.border": "#181a1f",
      "editorSuggestWidget.selectedBackground": "#17171b",
      "editorHoverWidget.background": "#0e0e11",
      "editorHoverWidget.border": "#181a1f",
      "editorIndentGuide.background": "#27272a",
      "editorIndentGuide.activeBackground": "#3f3f46",
      "editorBracketMatch.background": "#3e445155",
      "editorBracketMatch.border": "#528bff",
      "editorGutter.background": "#09090b",
      "editorWhitespace.foreground": "#27272a",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#3f3f4655",
      "scrollbarSlider.hoverBackground": "#52525b88",
      "scrollbarSlider.activeBackground": "#71717aaa",
      "minimap.background": "#09090b",
      "minimap.selectionHighlight": "#3e4451",
      "panel.background": "#09090b",
      "panel.border": "#181a1f",
      "dropdown.background": "#0e0e11",
      "dropdown.border": "#181a1f",
      "input.background": "#0e0e11",
      "input.border": "#181a1f",
      "input.foreground": "#abb2bf",
      "focusBorder": "#528bff",
      "list.activeSelectionBackground": "#17171b",
      "list.hoverBackground": "#17171b",
    },
  };

  function withBackground(bg) {
    const base = bg || "#09090b";
    const line = base === "#0b0d10" ? "#12151a" : "#17171b";
    return {
      ...ATOM_ONE_DARK,
      colors: {
        ...ATOM_ONE_DARK.colors,
        "editor.background": base,
        "editor.lineHighlightBackground": line,
        "editor.lineHighlightBorder": base,
        "editorGutter.background": base,
        "minimap.background": base,
        "panel.background": base,
      },
    };
  }

  function defineAtomOneDark(monaco, opts) {
    if (!monaco?.editor) return;
    const bg = opts && opts.background ? opts.background : "#09090b";
    monaco.editor.defineTheme("atom-one-dark", withBackground(bg));
  }

  root.AtomOneDark = {
    theme: ATOM_ONE_DARK,
    define: defineAtomOneDark,
    withBackground,
  };
})(typeof window !== "undefined" ? window : globalThis);
