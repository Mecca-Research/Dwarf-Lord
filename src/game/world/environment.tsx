import { FloodedShaft, Kitchen, MineAdit, MineCart } from "./buildings";
import {
  CampBanner,
  CookShelter,
  ExpeditionTent,
  FieldForge,
  MineYard,
  RuinedBarracks,
  StoresLeanTo,
} from "./camp-buildings";
import { MountainEscarpment, RockyTerraces } from "./mountain-base";
import {
  Barrel,
  Bucket,
  Crate,
  FencePost,
  Hammer,
  LogSeat,
  OrePile,
  Pickaxe,
  PlankDebris,
  Rubble,
  Sack,
  Shovel,
  TorchPost,
  Woodpile,
} from "./kit";

import { PathClutter, Terrain } from "./terrain";
import { useGame } from "../store";
import { SurfaceWorld } from "./world-visibility";

export function Environment() {
  const buildings = useGame((s) => s.buildings);
  const dorm = buildings.find((b) => b.id === "dorm");
  const forge = buildings.find((b) => b.id === "forge");
  const cart = buildings.find((b) => b.id === "cart");
  const storage = buildings.find((b) => b.id === "storage");

  return (
    <SurfaceWorld>
      <Terrain />
      <PathClutter />
      <MountainEscarpment />
      <RockyTerraces />
      <Crate x={-7} z={0} s={0.65} />
      {/* Keep Borrin's desk position clear for seated and standing consultation. */}
      <Crate x={12} z={10.5} s={0.8} />

      <RuinedBarracks x={-11} z={-5} rot={0.18} condition={dorm?.condition ?? 0.18} />
      <FieldForge x={10} z={-7} condition={forge?.condition ?? 0.22} />
      <ExpeditionTent x={12.5} z={1.5} width={6} length={5.7} height={4.5} color="#c7b994" />
      <StoresLeanTo x={17} z={8} rot={0.4} condition={storage?.condition ?? 0.12} />
      <ExpeditionTent x={-9} z={15} rot={-0.15} />
      <ExpeditionTent x={-2} z={17} rot={0.14} width={4.4} length={5.5} height={3.5} />
      <ExpeditionTent
        x={7}
        z={18}
        rot={-0.08}
        width={4.6}
        length={6}
        height={3.8}
        color="#aaa68d"
      />
      <CookShelter />
      <CampBanner x={-16.5} z={6} />
      <CampBanner x={22} z={12} height={4.7} color="#4d5e65" />
      <Kitchen x={2} z={6.5} />
      <MineCart x={4} z={-16} rot={0.6} condition={cart?.condition ?? 0.15} />
      <FloodedShaft x={14} z={-22} />
      <MineAdit x={8} z={-26} />
      <MineYard />

      {/* Fire circle seating */}
      <Crate x={3.45} z={7.55} s={0.78} rot={0.2} />
      <Crate x={3.35} z={5.35} s={0.7} rot={-0.4} />
      <LogSeat x={0.45} z={7.7} rot={0.4} len={1.5} />
      <LogSeat x={0.55} z={5.25} rot={-0.3} len={1.25} />
      <Crate x={-0.2} z={4.6} s={0.62} rot={0.5} />
      <Crate x={-0.15} z={4.95} y={0.68} s={0.5} rot={0.2} />
      <Barrel x={3.9} z={6.35} />
      <Barrel x={4.35} z={6.85} lying />
      <Barrel x={-7.8} z={8.6} />

      <Crate x={5.15} z={4.55} s={0.82} rot={0.25} />
      <Crate x={5.55} z={4.95} s={0.68} rot={0.25} />
      <Crate x={8.65} z={4.65} s={0.9} rot={0.25} />
      <Crate x={-8.7} z={6.15} s={0.78} rot={0.25} />
      <Crate x={7.15} z={8.55} s={0.72} rot={0.25} />
      <Crate x={7.5} z={8.95} s={0.6} rot={0.25} />
      <Crate x={7.2} z={-3.2} s={0.6} rot={0.5} />
      <Barrel x={-11.8} z={6.8} />
      <Barrel x={15.2} z={5.2} />
      <Sack x={4.8} z={5.4} rot={0.4} />
      <Sack x={-7.4} z={5.5} rot={-0.2} />
      <Bucket x={1.1} z={5.4} />
      <Bucket x={11.8} z={-4.5} />
      <Woodpile x={-13.5} z={-1.2} rot={0.3} />
      <Woodpile x={8.2} z={-10.5} rot={-0.5} />
      <OrePile x={15.6} z={5.8} />
      <OrePile x={6.8} z={-14.2} color="iron" />
      <Rubble x={-7.2} z={-8.4} n={7} />
      <Rubble x={12.2} z={-18.5} n={6} />
      <PlankDebris x={6.2} z={-10} rot={1.2} len={2.8} />
      <PlankDebris x={-14.5} z={2.2} rot={-0.4} len={2.2} />
      <TorchPost x={-4.5} z={4.2} />
      <TorchPost x={8.8} z={0.6} />
      <TorchPost x={-0.5} z={-8.5} lit={false} />
      <TorchPost x={5.2} z={-20} />
      <FencePost x={-22} z={13.5} />
      <FencePost x={-18} z={13.2} />
      <FencePost x={-14} z={12.8} />

      {/* Scattered tools like the reference */}
      <Pickaxe x={-8.6} z={1.4} rot={0.6} />
      <Pickaxe x={4.4} z={3.2} rot={-0.4} />
      <Shovel x={-10.2} z={2.6} rot={1.1} />
      <Shovel x={1.8} z={3.4} rot={0.3} />
      <Hammer x={-7.5} z={5.8} rot={0.8} />
      <Pickaxe x={7.4} z={-12.2} rot={2.1} />
    </SurfaceWorld>
  );
}
