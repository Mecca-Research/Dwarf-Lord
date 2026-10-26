/** Prefix public URLs so GitHub Pages (`/Dwarf-Lord/`) and the live preview (`/`) both resolve. */
export function asset(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  // Preview images/data may use an immutable public source URL. ES modules
  // stay in the deployed build so the server supplies their JavaScript MIME type.
  const base =
    !/\.(?:mjs|js)(?:[?#]|$)/.test(path) && import.meta.env.VITE_PUBLIC_ASSET_BASE
      ? import.meta.env.VITE_PUBLIC_ASSET_BASE
      : import.meta.env.BASE_URL;
  if (base !== "/" && path.startsWith(base)) return path;
  return `${base}${path.replace(/^\//, "")}`;
}
