export function PaperBackground({ color }: { color: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: color,
        backgroundImage: [
          "radial-gradient(rgba(0,0,0,0.045) 0.7px, transparent 0.7px)",
          "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(0,0,0,0.03))",
        ].join(","),
        backgroundSize: "14px 14px, 100% 100%",
      }}
    />
  );
}
