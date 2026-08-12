import { useEffect, useState } from "react";
import { Dialog } from "../common/Dialog";
import { TextField } from "../common/TextField";
import { Button } from "../common/Button";
import { LANGUAGES } from "../../utils/languageConfig";
import { validateSnippetTitle } from "../../utils/validators";
import { snippetRepository } from "../../db/repositories/snippetRepository";
import { useNotifications } from "../../context/NotificationContext";
import styles from "./SnippetFormDialog.module.css";

const EMPTY_FORM = { title: "", description: "", language: "javascript", tags: "", code: "", favorite: false };

function toFormState(snippet) {
  if (!snippet) return EMPTY_FORM;
  return { ...snippet, tags: snippet.tags.join(", ") };
}

export function SnippetFormDialog({ open, snippet, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const { notify } = useNotifications();
  const isEditing = Boolean(snippet);

  useEffect(() => {
    if (open) {
      setForm(toFormState(snippet));
      setError(null);
    }
  }, [open, snippet]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateSnippetTitle(form.title);
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      language: form.language,
      code: form.code,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      favorite: form.favorite,
    };

    try {
      if (isEditing) {
        await snippetRepository.update(snippet.id, payload);
        notify("Snippet updated", { type: "success" });
      } else {
        await snippetRepository.create(payload);
        notify("Snippet saved", { type: "success" });
      }
      onClose();
    } catch {
      notify("Couldn't save snippet — local storage may be unavailable.", { type: "error" });
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEditing ? "Edit Snippet" : "New Snippet"} labelledBy="snippet-dialog-title">
      <form onSubmit={handleSubmit} className={styles.form}>
        <TextField
          label="Title"
          value={form.title}
          error={error}
          autoFocus
          onChange={(e) => {
            update("title", e.target.value);
            if (error) setError(null);
          }}
        />

        <TextField label="Description" value={form.description} onChange={(e) => update("description", e.target.value)} />

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Language</span>
            <select className={styles.select} value={form.language} onChange={(e) => update("language", e.target.value)}>
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
              <option value="plaintext">Plain text</option>
            </select>
          </label>
          <TextField
            className={styles.tagsField}
            label="Tags (comma separated)"
            value={form.tags}
            onChange={(e) => update("tags", e.target.value)}
            placeholder="react, hooks"
          />
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Code</span>
          <textarea
            className={styles.code}
            value={form.code}
            onChange={(e) => update("code", e.target.value)}
            spellCheck={false}
            rows={8}
          />
        </label>

        <label className={styles.checkboxRow}>
          <input type="checkbox" checked={form.favorite} onChange={(e) => update("favorite", e.target.checked)} />
          Favorite
        </label>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? "Save Changes" : "Create Snippet"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
