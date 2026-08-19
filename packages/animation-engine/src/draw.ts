export type DrawPathProgress = {
  pathIndex: number;
  progress: number;
  isActive: boolean;
  isComplete: boolean;
};

export type DrawSequence = {
  pathProgress: number[];
  activePathIndex: number;
  overallProgress: number;
};

/**
 * Splits a 0–1 draw progress across paths, weighted by path length.
 * Paths are drawn sequentially: path 0, then path 1, then path 2.
 */
export function computeDrawSequence(
  overallProgress: number,
  pathLengths: number[],
): DrawSequence {
  if (pathLengths.length === 0) {
    return {
      pathProgress: [],
      activePathIndex: -1,
      overallProgress: 0,
    };
  }

  const clamped = Math.min(1, Math.max(0, overallProgress));
  const total = pathLengths.reduce((sum, length) => sum + Math.max(length, 0), 0);

  if (total <= 0) {
    return {
      pathProgress: pathLengths.map(() => clamped),
      activePathIndex: pathLengths.length - 1,
      overallProgress: clamped,
    };
  }

  const target = clamped * total;
  const pathProgress: number[] = [];
  let remaining = target;
  let activePathIndex = 0;

  for (let i = 0; i < pathLengths.length; i += 1) {
    const length = Math.max(pathLengths[i] ?? 0, 0);
    if (remaining >= length) {
      pathProgress.push(1);
      remaining -= length;
      activePathIndex = i;
    } else if (remaining > 0) {
      pathProgress.push(length === 0 ? 1 : remaining / length);
      activePathIndex = i;
      remaining = 0;
    } else {
      pathProgress.push(0);
    }
  }

  if (clamped >= 1) {
    activePathIndex = pathLengths.length - 1;
  }

  return {
    pathProgress,
    activePathIndex,
    overallProgress: clamped,
  };
}

export function describePathProgress(
  sequence: DrawSequence,
): DrawPathProgress[] {
  return sequence.pathProgress.map((progress, pathIndex) => ({
    pathIndex,
    progress,
    isActive: pathIndex === sequence.activePathIndex && progress < 1,
    isComplete: progress >= 1,
  }));
}
