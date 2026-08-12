const RELATIVE_UNITS = [
  { limit: 60, divisor: 1, unit: "second" },
  { limit: 3600, divisor: 60, unit: "minute" },
  { limit: 86400, divisor: 3600, unit: "hour" },
  { limit: 604800, divisor: 86400, unit: "day" },
  { limit: 2629800, divisor: 604800, unit: "week" },
  { limit: 31557600, divisor: 2629800, unit: "month" },
];

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(isoString) {
  const then = new Date(isoString).getTime();
  const diffSeconds = Math.round((then - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 5) return "just now";

  for (const { limit, divisor, unit } of RELATIVE_UNITS) {
    if (absSeconds < limit) {
      return relativeFormatter.format(Math.round(diffSeconds / divisor), unit);
    }
  }
  return relativeFormatter.format(Math.round(diffSeconds / 31557600), "year");
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unknown";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}
