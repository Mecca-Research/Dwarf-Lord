import { StrictMode, startTransition } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

/** Static Pages output has no rendered app to hydrate. Server-rendered pages
 * retain hydration; real recovery errors must remain visible in that mode.
 */
startTransition(() => {
  const app = <StrictMode><StartClient /></StrictMode>;
  if (document.documentElement.dataset.clientShell === "true") {
    createRoot(document).render(app);
  } else {
    hydrateRoot(document, app, { onRecoverableError: error => console.error(error) });
  }
});
