import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { asset } from "@/lib/asset";
import appCss from "../styles.css?url";

const APP_NAME = "Dwarf Lord";

function DeferredFonts() {
  useEffect(() => {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href =
      "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&display=swap";
    stylesheet.media = "print";
    stylesheet.onload = () => {
      stylesheet.media = "all";
    };
    document.head.append(stylesheet);
    return () => stylesheet.remove();
  }, []);
  return null;
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#0e0d0b" },
      {
        name: "description",
        content: "You bought a hole in a mountain. Rebuild a ruined dwarf mining colony.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: asset("/favicon.svg") },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: asset("/__grok/manifest.webmanifest") },
      { rel: "apple-touch-icon", href: asset("/__grok/icon-180.png") },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <DeferredFonts />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
