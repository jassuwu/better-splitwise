// The one place tempo and length live.
//
// Both the audio renderer (render-audio.mjs) and the Remotion composition (src/Root.tsx) import this
// file, so the music and the video can never drift. Change a value here, re-render both, done.
//
// Strudel measures time in CYCLES, Remotion in FRAMES. The bridge is: seconds = cycles / cps = frames / fps.
// A "cycle" is one bar. At cps 0.5333 with 4 beats/bar that is ~128 BPM (this reel's tempo).

export const FPS = 30;            // video frames per second
export const CPS = 0.5333;        // Strudel cycles per second  (BPM = CPS * 60 * BEATS_PER_CYCLE) ≈ 128
export const CYCLES = 14;         // how many bars the piece lasts
export const BEATS_PER_CYCLE = 4; // 4/4 time
export const TAIL = 2;            // extra seconds so reverb / delay / long releases aren't cut off

// ---- derived (don't edit) ----
export const BPM = CPS * 60 * BEATS_PER_CYCLE;                  // ≈ 128
export const DURATION_SECONDS = CYCLES / CPS + TAIL;            // ≈ 28.25 (14 bars ≈ 26.25s + 2s tail)
export const DURATION_IN_FRAMES = Math.round(FPS * DURATION_SECONDS); // ≈ 847
export const FRAMES_PER_BEAT = (FPS * 60) / BPM;               // ≈ 14.06  — see MOTION.md for beat→frame math
// derived bar grid: FRAMES_PER_BAR ≈ 56.25 · barFrame(10)=563 (the drop) · barFrame(13)=731 · last content frame ≈ 788
export const FRAMES_PER_BAR = FRAMES_PER_BEAT * BEATS_PER_CYCLE;

// Frame on which beat / bar N begins. Round only at placement to avoid accumulated float drift.
export const beatFrame = (n) => Math.round(n * FRAMES_PER_BEAT);
export const barFrame = (n) => Math.round(n * FRAMES_PER_BAR);
