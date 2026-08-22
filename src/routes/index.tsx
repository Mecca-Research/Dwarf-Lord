import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Hud, TitleScreen } from "@/game/ui/hud";
import { useGame } from "@/game/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const playing = useGame((s) => s.playing);
  const persist = useGame((s) => s.persist);
  const [Canvas, setCanvas] = useState<React.ComponentType | null>(null);

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
    if (!playing) return;
    void import("@/game/world/scene").then((m) => setCanvas(() => m.GameCanvas));
  }, [playing]);

  if (!playing) return <TitleScreen />;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      {Canvas ? (
        <Canvas />
      ) : (
        <div className="flex h-full items-end px-6 pb-16">
          <p className="font-display text-sm text-fg-muted">Crossing the outer road…</p>
        </div>
      )}
      <Hud />
    </div>
  );
}
