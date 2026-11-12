import { ImageResponse } from "next/og";

export const alt = "AH Clothing Hub — Modern heritage fashion in Pakistan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#141414", color: "#FAF7F2", fontFamily: "Georgia, serif" }}>
        <div style={{ width: 150, height: 150, borderRadius: 999, border: "2px solid #B08D57", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>AH</div>
        <div style={{ marginTop: 36, fontSize: 30, letterSpacing: 18, textTransform: "uppercase", fontFamily: "sans-serif" }}>Clothing Hub</div>
        <div style={{ marginTop: 20, width: 220, height: 2, background: "#B08D57" }} />
        <div style={{ marginTop: 24, fontSize: 34, fontStyle: "italic", color: "#C9C2B8" }}>Modern heritage, made in Pakistan</div>
      </div>
    ),
    size,
  );
}
