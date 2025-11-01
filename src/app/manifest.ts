import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Brain",
    short_name: "Brain",
    description:
      "Install Brain for offline binaural beats, curated soundscapes, and streak-building focus rituals.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/brain-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icons/brain-icon-maskable.svg",
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
