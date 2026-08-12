import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { getLanguageExtension, createEditorTheme, createSyntaxHighlighting } from "./cmSetup";
import { EmptyState } from "../common/EmptyState";
import styles from "./EditorPane.module.css";

export function EditorPane({ entryId, language, content, onChange, onSave }) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const callbacksRef = useRef({ onChange, onSave });
  callbacksRef.current = { onChange, onSave };

  // One EditorView for the pane's lifetime; per-tab switches replace its state.
  useEffect(() => {
    if (!containerRef.current) return undefined;

    const view = new EditorView({
      parent: containerRef.current,
      state: EditorState.create({ doc: "", extensions: [] }),
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        callbacksRef.current.onChange(entryId, update.state.doc.toString());
      }
    });

    const saveKeymap = keymap.of([
      {
        key: "Mod-s",
        preventDefault: true,
        run: (v) => {
          callbacksRef.current.onSave(entryId, v.state.doc.toString());
          return true;
        },
      },
      indentWithTab,
    ]);

    const state = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        saveKeymap,
        getLanguageExtension(language),
        createEditorTheme(),
        createSyntaxHighlighting(),
        updateListener,
        EditorView.lineWrapping,
      ],
    });
    view.setState(state);
    view.focus();
    // Recreated whenever the active file changes — content/language are only
    // read at this point, subsequent typing flows through the update listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  // Content can also change from outside the editor (e.g. a snippet inserted
  // while this file is open). Only push it into the view when it actually
  // differs from the document, so this doesn't fight the update listener
  // above on every keystroke the user makes.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (content !== currentDoc) {
      view.dispatch({ changes: { from: 0, to: currentDoc.length, insert: content } });
    }
  }, [content]);

  if (!entryId) {
    return (
      <EmptyState title="No file open" description="Select a file from the explorer, or create a new one." />
    );
  }

  return <div ref={containerRef} className={styles.pane} />;
}
