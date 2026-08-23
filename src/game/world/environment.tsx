import {
  CanvasTent,
  Dorm,
  FloodedShaft,
  Forge,
  Kitchen,
  MineAdit,
  MineCart,
  Office,
  StorageShed,
} from "./buildings";
import {
  Barrel,
  Bucket,
  Chair,
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

export function Environment() {
  const buildings = useGame((s) => s.buildings);
  const dorm = buildings.find((b) => b.id === "dorm");
  const forge = buildings.find((b) => b.id === "forge");
  const cart = buildings.find((b) => b.id === "cart");
  const storage = buildings.find((b) => b.id === "storage");

  return (
    <group>
      <Terrain />
      <PathClutter />

      <Dorm x={-11} z={-5} rot={0.18} condition={dorm?.condition ?? 0.18} />
      <Forge x={10} z={-7} rot={-0.2} condition={forge?.condition ?? 0.22} />
      <Office x={12.5} z={1.5} rot={0} />
      <Chair x={11.25} z={3.08} rot={0.35} />
      <StorageShed x={17} z={8} rot={0.4} condition={storage?.condition ?? 0.12} />
      <CanvasTent x={-6} z={7} rot={0.35} />
      <CanvasTent x={-3.2} z={10.2} rot={-0.55} scale={0.9} />
      <Kitchen x={2} z={6.5} />
      <MineCart x={4} z={-16} rot={0.6} condition={cart?.condition ?? 0.15} />
      <FloodedShaft x={14} z={-22} />
      <MineAdit x={8} z={-28} />

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

      <Crate x={5.4} z={4.8} s={0.65} rot={0.7} />
      <Crate x={8.6} z={4.8} s={0.8} />
      <Crate x={-8.8} z={6.2} s={0.7} rot={-0.2} />
      <Crate x={7.2} z={-3.2} s={0.6} rot={0.5} />
      <Barrel x={-9.4} z={4.8} />
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
    </group>
  );
}
