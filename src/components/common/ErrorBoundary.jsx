import { Component } from "react";
import styles from "./ErrorBoundary.module.css";
import { Button } from "./Button";

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Developer-facing detail stays in the console; the UI shows a plain message.
    console.error("DevSpace crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className={styles.wrapper} role="alert">
        <p className={styles.title}>Something went wrong</p>
        <p className={styles.description}>
          DevSpace hit an unexpected error. Your projects are safe in local storage — reloading usually resolves this.
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Reload DevSpace
        </Button>
      </div>
    );
  }
}
