/** Prefix public URLs so GitHub Pages (`/Dwarf-Lord/`) and the live preview (`/`) both resolve. */
export function asset(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const base = import.meta.env.BASE_URL;
  if (base !== "/" && path.startsWith(base)) return path;
  return `${base}${path.replace(/^\//, "")}`;
}
