/**
 * Mounts axe-core in development mode to log accessibility violations
 * to the browser console. Only loaded in development builds.
 *
 * Usage: call `initAxeDev()` from a client-side effect (e.g., in providers).
 */
export async function initAxeDev(): Promise<void> {
  if (
    typeof window === "undefined" ||
    process.env.NODE_ENV !== "development"
  ) {
    return;
  }

  const React = await import("react");
  const ReactDOM = await import("react-dom");
  const axe = await import("@axe-core/react");

  axe.default(React.default, ReactDOM, 1000);
}
