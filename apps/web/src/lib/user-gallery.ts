import type { UserAsset } from "@ai-doodle/video-schema";

const GALLERY_KEY = "ai-doodle-user-gallery";

export function loadUserGallery(): UserAsset[] {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as UserAsset[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.src === "string" &&
        typeof item.name === "string",
    );
  } catch {
    return [];
  }
}

export function saveUserGallery(items: UserAsset[]): void {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(items));
}

export function upsertUserGalleryItem(item: UserAsset): UserAsset[] {
  const current = loadUserGallery().filter((entry) => entry.id !== item.id);
  const next = [item, ...current];
  saveUserGallery(next);
  return next;
}

export function removeUserGalleryItem(id: string): UserAsset[] {
  const next = loadUserGallery().filter((entry) => entry.id !== id);
  saveUserGallery(next);
  return next;
}

export function guessUploadType(nameOrSrc: string): "svg" | "image" {
  return /\.svg($|\?)/i.test(nameOrSrc) ? "svg" : "image";
}
