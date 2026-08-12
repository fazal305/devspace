import { useState } from "react";
import { Dialog } from "../common/Dialog";
import { TextField } from "../common/TextField";
import { Button } from "../common/Button";
import { starterProjects } from "../../data/starterProjects";
import { validateProjectName } from "../../utils/validators";
import { projectRepository } from "../../db/repositories/projectRepository";
import { entryRepository } from "../../db/repositories/entryRepository";
import { useNotifications } from "../../context/NotificationContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import styles from "./CreateProjectDialog.module.css";

export function CreateProjectDialog({ open, onClose }) {
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState(starterProjects[0].id);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notify } = useNotifications();
  const { openProject } = useWorkspace();

  function reset() {
    setName("");
    setTemplateId(starterProjects[0].id);
    setError(null);
    setIsSubmitting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateProjectName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const template = starterProjects.find((t) => t.id === templateId);
      const project = await projectRepository.create({ name: name.trim(), template: templateId });
      if (template?.entries?.length) {
        await entryRepository.seedFromTemplate(project.id, template.entries);
      }
      notify(`Project "${project.name}" created`, { type: "success" });
      await openProject(project.id);
      handleClose();
    } catch {
      notify("Couldn't create project — local storage may be unavailable.", { type: "error" });
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="New Project" labelledBy="create-project-title">
      <form onSubmit={handleSubmit} className={styles.form}>
        <TextField
          label="Project name"
          value={name}
          error={error}
          autoFocus
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          placeholder="my-project"
        />

        <fieldset className={styles.templates}>
          <legend className={styles.legend}>Start from</legend>
          {starterProjects.map((template) => (
            <label key={template.id} className={styles.templateOption}>
              <input
                type="radio"
                name="template"
                value={template.id}
                checked={templateId === template.id}
                onChange={() => setTemplateId(template.id)}
              />
              <span>
                <span className={styles.templateName}>{template.name}</span>
                <span className={styles.templateDescription}>{template.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create Project"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
