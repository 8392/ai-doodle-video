import { staticFile } from "remotion";

export function toStaticSrc(src: string): string {
  const relative = src.startsWith("/") ? src.slice(1) : src;
  return staticFile(relative);
}
