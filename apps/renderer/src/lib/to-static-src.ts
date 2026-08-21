import { staticFile } from "remotion";

export function toStaticSrc(src: string): string {
  if (src.startsWith("data:") || src.startsWith("blob:") || /^https?:\/\//i.test(src)) {
    return src;
  }
  const [pathPart, query = ""] = src.split("?");
  const relative = (pathPart ?? src).startsWith("/")
    ? (pathPart ?? src).slice(1)
    : (pathPart ?? src);
  const resolved = staticFile(relative);
  return query ? `${resolved}?${query}` : resolved;
}
