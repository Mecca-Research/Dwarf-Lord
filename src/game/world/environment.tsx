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
  OrePile,
  PlankDebris,
  Rubble,
  Sack,
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

      <Dorm x={-11} z={-5} rot={0.12} condition={dorm?.condition ?? 0.18} />
      <Forge x={10} z={-7} rot={-0.2} condition={forge?.condition ?? 0.22} />
      <Office x={12.5} z={1.5} rot={0} />
      <Chair x={11.25} z={3.08} rot={0.35} />
      <StorageShed x={17} z={8} rot={0.4} condition={storage?.condition ?? 0.12} />
      <CanvasTent x={-6} z={7} rot={0.3} />
      <CanvasTent x={-3} z={10} rot={-0.5} scale={0.88} />
      <Kitchen x={2} z={6.5} />
      <MineCart x={4} z={-16} rot={0.6} condition={cart?.condition ?? 0.15} />
      <FloodedShaft x={14} z={-22} />
      <MineAdit x={8} z={-28} />

      {/* Camp clutter — lived-in density */}
      <Crate x={-1.2} z={3.4} s={0.75} />
      <Crate x={-0.5} z={4.1} y={0.72} s={0.55} rot={0.3} />
      <Crate x={5.4} z={4.8} s={0.65} rot={0.7} />
      <Crate x={8.6} z={4.8} s={0.8} />
      <Crate x={-8.8} z={6.2} s={0.7} rot={-0.2} />
      <Crate x={7.2} z={-3.2} s={0.6} rot={0.5} />
      <Barrel x={-9.4} z={4.8} />
      <Barrel x={6.4} z={5.5} lying />
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
    </group>
  );
}
