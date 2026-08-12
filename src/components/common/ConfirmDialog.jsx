import { Dialog } from "./Dialog";
import { Button } from "./Button";
import styles from "./ConfirmDialog.module.css";

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} labelledBy="confirm-dialog-title">
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
