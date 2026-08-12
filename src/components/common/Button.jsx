import styles from "./Button.module.css";

const VARIANT_CLASS = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  danger: styles.danger,
};

export function Button({ variant = "secondary", type = "button", className = "", ...props }) {
  const variantClass = VARIANT_CLASS[variant] ?? styles.secondary;
  return <button type={type} className={`${styles.button} ${variantClass} ${className}`} {...props} />;
}
