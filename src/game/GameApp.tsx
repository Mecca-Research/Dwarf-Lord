import { useEffect } from "react";
import { Hud, TitleScreen } from "./ui/hud";
import { useGame } from "./store";
import { GameCanvas } from "./world/scene";

export function GameApp() {
  const playing = useGame((s) => s.playing);
  const persist = useGame((s) => s.persist);

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

  if (!playing) return <TitleScreen />;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      <GameCanvas />
      <Hud />
    </div>
  );
}
