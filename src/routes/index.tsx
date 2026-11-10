import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Hud, TitleScreen } from "@/game/ui/hud";
import { useGame } from "@/game/store";

export const Route = createFileRoute("/")({ component: Home });

type SceneModule = typeof import("@/game/world/scene");
let sceneRequest: Promise<SceneModule> | undefined;
function loadScene() {
  return (sceneRequest ??= import("@/game/world/scene"));
}

function Home() {
  const playing = useGame((s) => s.playing);
  const persist = useGame((s) => s.persist);
  const [Canvas, setCanvas] = useState<SceneModule["GameCanvas"] | null>(null);
  const [worldReady, setWorldReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const onWorldReady = useCallback(() => setWorldReady(true), []);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") persist();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", persist);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", persist);
    };
  }, [persist]);

  useEffect(() => {
    if (!playing) {
      // Give the title its first paint before fetching the optional 3D module.
      const timer = window.setTimeout(() => void loadScene().catch(() => {}), 700);
      return () => window.clearTimeout(timer);
    }
    let mounted = true;
    loadScene().then(
      (scene) => {
        if (mounted) setCanvas(() => scene.GameCanvas);
      },
      () => {
        if (mounted) setLoadFailed(true);
      },
    );
    return () => {
      mounted = false;
    };
  }, [playing]);

  if (!playing) return <TitleScreen />;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      {Canvas && <Canvas onReady={onWorldReady} />}
      {!worldReady && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center px-6 pb-16">
          <div className="rounded-lg border border-border bg-bg-panel px-6 py-4 text-center">
            {loadFailed ? (
              <div role="alert" className="pointer-events-auto">
                <p>The camp could not load.</p>
                <button
                  type="button"
                  className="mt-2 text-accent underline"
                  onClick={() => location.reload()}
                >
                  Reload the game
                </button>
              </div>
            ) : (
              <p role="status" data-camp-loading className="font-display text-sm text-fg">
                Setting up the camp…
              </p>
            )}
          </div>
        </div>
      )}
      {worldReady && <Hud />}
    </div>
  );
}
