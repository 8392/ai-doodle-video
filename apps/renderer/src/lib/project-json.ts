export function unwrapProjectJson(raw: unknown): unknown {
  if (
    raw &&
    typeof raw === "object" &&
    "project" in raw &&
    raw.project &&
    typeof raw.project === "object" &&
    "scenes" in (raw.project as object)
  ) {
    return raw.project;
  }
  return raw;
}
