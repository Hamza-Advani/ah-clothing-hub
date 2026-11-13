import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AH Clothing Hub",
    short_name: "AH Clothing",
    description: "AH Clothing Hub — online clothing store in Pakistan. Cash on Delivery nationwide.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#141414",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
