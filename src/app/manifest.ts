import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Neon Binaural Studio",
    short_name: "Neon Studio",
    description:
      "Install Neon Binaural Studio to mix custom binaural beats, track sessions, and stay in flow on any device.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/nbs-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icons/nbs-icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Quick Session",
        url: "/?preset=quick",
        description: "Start a focused 15 minute binaural session.",
      },
      {
        name: "Soundscapes",
        url: "/?view=soundscapes",
        description: "Jump straight to curated soundscapes.",
      },
    ],
    categories: ["health", "productivity", "music"],
  };
}
