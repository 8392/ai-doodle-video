import type { VideoProject } from "@ai-doodle/video-schema";

export type MusicTrack = {
  id: string;
  name: string;
  src: string;
  volume: number;
};

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "soft",
    name: "轻柔白板",
    src: "/audio/music/soft.wav",
    volume: 0.18,
  },
  {
    id: "documentary",
    name: "纪实讲述",
    src: "/audio/music/documentary.wav",
    volume: 0.16,
  },
  {
    id: "upbeat",
    name: "轻快科普",
    src: "/audio/music/upbeat.wav",
    volume: 0.15,
  },
];

export function findMusicTrack(id: string | undefined): MusicTrack | undefined {
  if (!id) {
    return undefined;
  }
  return MUSIC_TRACKS.find((track) => track.id === id);
}

export function applyMusic(
  project: VideoProject,
  trackId: string | undefined,
): VideoProject {
  if (!trackId) {
    const { music: _removed, ...rest } = project;
    return rest;
  }
  const track = findMusicTrack(trackId);
  if (!track) {
    return project;
  }
  return {
    ...project,
    music: {
      src: track.src,
      startFrame: 0,
      durationInFrames: project.durationInFrames,
      volume: track.volume,
    },
  };
}
