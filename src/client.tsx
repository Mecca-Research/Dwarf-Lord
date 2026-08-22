import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

/**
 * GitHub Pages serves a static shell, so hydration will mismatch and recover.
 * Swallow those recoverable errors so the title screen still mounts.
 */
startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
    {
      onRecoverableError: (error) => {
        const msg = error instanceof Error ? error.message : String(error);
        if (/hydrat/i.test(msg)) return;
        console.error(error);
      },
    },
  );
});
