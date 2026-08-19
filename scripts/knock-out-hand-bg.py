from collections import deque
from pathlib import Path

from PIL import Image


def is_checkerboard_pixel(r: int, g: int, b: int) -> bool:
    chroma = max(r, g, b) - min(r, g, b)
    return chroma <= 22 and min(r, g, b) >= 200


def knock_out_background(src: Path, dest: Path) -> None:
    image = Image.open(src).convert("RGBA")
    pixels = image.load()
    width, height = image.size
    background: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()

    def consider(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= width or y >= height:
            return
        if (x, y) in background:
            return
        r, g, b, _a = pixels[x, y]
        if is_checkerboard_pixel(r, g, b):
            background.add((x, y))
            queue.append((x, y))

    for x in range(width):
        consider(x, 0)
        consider(x, height - 1)
    for y in range(height):
        consider(0, y)
        consider(width - 1, y)

    while queue:
        x, y = queue.popleft()
        consider(x + 1, y)
        consider(x - 1, y)
        consider(x, y + 1)
        consider(x, y - 1)

    for x, y in background:
        r, g, b, _a = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)

    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, "PNG")
    print(f"{src.name}: removed {len(background)} background pixels -> {dest}")


root = Path(r"e:\github_project\ai-doodle-video")
files = ["hand-right.png", "hand-left.png"]
for name in files:
    source = root / "packages/asset-library/assets/hands" / name
    knock_out_background(source, source)
    knock_out_background(source, root / "public/assets/hands" / name)
