// better splitwise — launch reel score (warm, low-mid-weighted house in C minor, ~128 BPM, 14 bars).
// The antidote to the early harsh build: sine sub-kick (no harmonics), low-passed sawtooth bass,
// mellow triangle pad capped warm, a sparse mid bell, gentle low-passed perc, one dry minor stab in
// the argument bars. Energy in octaves 1-3. Arc: hook (0-1) → the argument (2-4) → turn/inhale (5-7)
// → assign/held breath (8-9) → the DROP on bar 10 → resolve (11-13).

export function getPattern(c) {
  const { note, s, stack, sine } = c;

  // ---- section masks over 14 bars (index 0..13) ----
  const mIntro = '<1 1 0 0 0 0 0 0 0 0 0 0 0 0>'; // 0-1
  const mPain = '<0 0 1 1 1 0 0 0 0 0 0 0 0 0>'; //   2-4 (the argument)
  const mBuild = '<0 0 0 0 0 1 1 1 1 1 0 0 0 0>'; //  5-9 (turn + assign, four-on-floor)
  const mDrop = '<0 0 0 0 0 0 0 0 0 0 1 0 0 0>'; //   10 (the payoff)
  const mResolve = '<0 0 0 0 0 0 0 0 0 0 0 1 1 1>'; // 11-13
  const mBassGroove = '<0 0 0 0 0 1 1 1 1 1 1 1 1 1>'; // 5-13
  const mStab = '<0 0 1 1 1 0 0 0 0 0 0 0 0 0>'; //    2-4
  const mPerc = '<0 0 0 0 0 1 1 1 1 1 1 0 0 0>'; //    5-10
  const mRiser = '<0 0 0 0 0 0 0 0 0 1 0 0 0 0>'; //   9 (into the drop)
  const mBellResolve = '<0 0 0 0 0 0 0 0 0 0 0 0 1 0>'; // 12
  const mAll = '<1 1 1 1 1 1 1 1 1 1 1 1 1 1>';

  // ---- sub-kick: pure sine, the warm heartbeat ----
  const kickIntro = note('c1 ~ ~ c1').s('sine').decay(0.2).sustain(0).gain(0.78).mask(mIntro);
  const kickPain = note('c1 ~ ~ ~ ~ ~ c1 ~').s('sine').decay(0.18).sustain(0).gain(0.78).mask(mPain);
  const kickBuild = note('c1*4').s('sine').decay(0.17).sustain(0).gain(0.85).mask(mBuild);
  const kickDrop = note('c1 ~ ~ ~').s('sine').decay(0.32).sustain(0).gain(0.92).mask(mDrop);
  const kickOut = note('c1 ~ ~ ~').s('sine').decay(0.28).sustain(0).gain(0.55).mask(mResolve);

  // ---- saw-bass: low-passed, round; root-only in the argument, full groove after ----
  const roots = '<c2 c2 c2 c2 c2 ab1 bb1 g1 ab1 g1 c2 ab1 c2 c2>';
  const bassPain = note(roots).struct('x ~ ~ ~').s('sawtooth').cutoff(440).decay(0.5).sustain(0.5).release(0.2).gain(0.34).mask(mPain);
  const bass = note(roots).struct('x ~ x x ~ x ~ x').s('sawtooth').cutoff(sine.range(440, 1100).slow(10)).decay(0.16).sustain(0.3).release(0.1).gain(0.4).mask(mBassGroove);

  // ---- rhodes-pad: mellow triangle chords, voiced low, warm ceiling, pushed back ----
  const padChords =
    '<[c2,eb3,g3] [c2,eb3,g3] [c2,eb3,g3] [c2,eb3,g3] [c2,eb3,g3] [ab2,c3,eb3] [bb2,d3,f3] [g2,bb2,d3] [ab2,c3,eb3] [g2,bb2,d3] [c2,eb3,g3,c4] [ab2,c3,eb3] [c2,eb3,g3] [c2,eb3,g3]>';
  const pad = note(padChords).s('triangle').attack(0.6).decay(0.4).sustain(0.7).release(1.2).cutoff(1400).hcutoff(180).gain(0.13).room(0.45).size(0.7).mask(mAll);

  // ---- bell hook: sparse mid-register triangle ----
  const bellIntro = note('c4 ~ g4 ~ ~ ~ eb4 ~').s('triangle').attack(0.01).decay(0.5).sustain(0).release(0.6).cutoff(1600).gain(0.11).room(0.4).delay(0.16).delaytime(0.1875).delayfeedback(0.12).mask(mIntro);
  const bellOut = note('c4 ~ ~ ~ ~ ~ g4 ~').s('triangle').attack(0.01).decay(0.6).sustain(0).release(0.8).cutoff(1600).gain(0.1).room(0.4).delay(0.16).delaytime(0.1875).delayfeedback(0.1).mask(mBellResolve);

  // ---- tension-stab: one dry minor square stab, the argument bars only ----
  const stab = note('[c3,eb3]').struct('~ ~ x ~ ~ ~ x ~').s('square').attack(0.004).decay(0.1).sustain(0).release(0.06).cutoff(1300).gain(0.1).mask(mStab);

  // ---- soft-perc: low-passed noise ticks ----
  const perc = s('white').struct('~ x ~ x ~ x ~ x').decay(0.04).sustain(0).cutoff(6500).hcutoff(400).gain(0.17).room(0.15).mask(mPerc);

  // ---- riser into the drop (warm low-passed swell) ----
  const riser = s('white').struct('x').attack(1.6).decay(0).sustain(1).release(0.2).cutoff(1800).hcutoff(300).gain(0.16).mask(mRiser);

  return stack(kickIntro, kickPain, kickBuild, kickDrop, kickOut, bassPain, bass, pad, bellIntro, bellOut, stab, perc, riser);
}

export const SAMPLES = [];
export const USE_WORKLETS = false;
