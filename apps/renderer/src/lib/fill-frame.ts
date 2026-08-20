import type { CSSProperties } from "react";

/** Explicit edges so @remotion/web-renderer can size the layer (it ignores `inset`). */
export const fillFrameStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: "100%",
  height: "100%",
};
