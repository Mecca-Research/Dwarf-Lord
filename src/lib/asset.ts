/** Prefix public URLs so GitHub Pages (`/Dwarf-Lord/`) and the live preview (`/`) both resolve. */
export function asset(path: string): string {
  if (/^(?:https?:)?\/\//.test(path)) return path;
  const appBase = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  const relative = path.startsWith(appBase) ? path.slice(appBase.length) : path.replace(/^\/+/, "");
  const pathname = relative.split(/[?#]/, 1)[0];
  // Only known public art/data files can use the immutable origin. Host-generated
  // /__grok/* responses, application routes and executable modules stay on appBase.
  const publicFile =
    pathname === "favicon.svg" ||
    /^(?:art|textures|sprites)\/.*\.(?:avif|gif|jpe?g|json|png|svg|webp|woff2?)$/i.test(pathname);
  const base =
    publicFile && import.meta.env.VITE_PUBLIC_ASSET_BASE
      ? import.meta.env.VITE_PUBLIC_ASSET_BASE.replace(/\/?$/, "/")
      : appBase;
  return `${base}${relative}`;
}
