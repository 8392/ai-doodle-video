import { fillFrameStyle } from "../lib/fill-frame";

export function PaperBackground({ color }: { color: string }) {
  return (
    <div
      style={{
        ...fillFrameStyle,
        backgroundColor: color,
        backgroundImage:
          "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(0,0,0,0.03))",
      }}
    />
  );
}
