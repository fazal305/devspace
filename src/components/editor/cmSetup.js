import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { xml } from "@codemirror/lang-xml";
import { sql } from "@codemirror/lang-sql";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { EditorView } from "@codemirror/view";

const LANGUAGE_EXTENSIONS = {
  javascript: () => javascript(),
  jsx: () => javascript({ jsx: true }),
  html: () => html(),
  css: () => css(),
  json: () => json(),
  markdown: () => markdown(),
  xml: () => xml(),
  sql: () => sql(),
};

export function getLanguageExtension(languageId) {
  const factory = LANGUAGE_EXTENSIONS[languageId];
  return factory ? [factory()] : [];
}

// A CodeMirror theme built entirely from our design tokens, so it follows
// light/dark/system switching automatically without rebuilding the editor.
export function createEditorTheme() {
  return EditorView.theme({
    "&": {
      color: "var(--color-text)",
      backgroundColor: "var(--color-surface)",
      height: "100%",
      fontSize: "var(--font-size-md)",
    },
    ".cm-content": {
      fontFamily: "var(--font-mono)",
      caretColor: "var(--color-primary)",
      padding: "var(--space-3) 0",
    },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--color-primary)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "var(--color-primary-muted)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--color-surface)",
      color: "var(--color-text-faint)",
      border: "none",
      borderRight: "1px solid var(--color-border)",
    },
    ".cm-activeLine": { backgroundColor: "var(--color-surface-sunken)" },
    ".cm-activeLineGutter": { backgroundColor: "var(--color-surface-sunken)", color: "var(--color-text-muted)" },
    ".cm-matchingBracket, .cm-nonmatchingBracket": {
      backgroundColor: "var(--color-primary-muted)",
      outline: "1px solid var(--color-primary)",
    },
    ".cm-searchMatch": { backgroundColor: "var(--color-warning-muted)" },
    ".cm-searchMatch.cm-searchMatch-selected": { backgroundColor: "var(--color-warning)" },
    "&.cm-editor.cm-focused": { outline: "none" },
  });
}

const highlightStyle = HighlightStyle.define([
  { tag: t.comment, color: "var(--color-text-faint)", fontStyle: "italic" },
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword], color: "var(--color-primary)" },
  { tag: [t.string, t.special(t.string)], color: "var(--color-success)" },
  { tag: [t.number, t.bool, t.null], color: "var(--color-warning)" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--color-primary)" },
  { tag: [t.definition(t.variableName), t.definition(t.propertyName)], color: "var(--color-text)" },
  { tag: t.propertyName, color: "var(--color-text)" },
  { tag: t.typeName, color: "var(--color-primary)" },
  { tag: t.tagName, color: "var(--color-primary)" },
  { tag: t.attributeName, color: "var(--color-warning)" },
  { tag: t.angleBracket, color: "var(--color-text-muted)" },
  { tag: t.invalid, color: "var(--color-danger)" },
]);

export function createSyntaxHighlighting() {
  return syntaxHighlighting(highlightStyle);
}
