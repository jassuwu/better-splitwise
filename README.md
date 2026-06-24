<h1 align="center">better splitwise</h1>

<p align="center">
  <strong>the small, opinionated splitwise i actually wanted to use.</strong>
</p>

<p align="center">
  scan a receipt, assign items to people, push one correct expense — in seconds.
  splitwise stays the ledger; this is a faster, quieter way to feed it.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square"></a>
  <img alt="Built with Expo + React Native" src="https://img.shields.io/badge/built%20with-Expo%20%2B%20React%20Native-000020?style=flat-square&logo=expo&logoColor=white">
  <img alt="Platforms: iOS, Android, Web" src="https://img.shields.io/badge/platforms-iOS%20%C2%B7%20Android%20%C2%B7%20Web-555?style=flat-square">
  <img alt="Works with Splitwise" src="https://img.shields.io/badge/works%20with-Splitwise-1cc29f?style=flat-square">
</p>

<p align="center">
  <picture>
    <source media="(prefers-reduced-motion: reduce)" srcset="docs/assets/readme/better-splitwise-header-poster.png">
    <img alt="better splitwise — scan a receipt, split it right, push it to Splitwise in seconds." src="docs/assets/readme/better-splitwise-header.gif" width="900">
  </picture>
</p>

<p align="center"><em>the header is a placeholder — a real demo lands here soon.</em></p>

## the idea

splitwise is the right place to keep who-owes-whom — and the wrong place to _enter_ a
messy group dinner, where itemizing by hand is slow and "split equally" is quietly wrong
the moment someone skips the cocktails.

so this is just the front end i wanted for it. it talks to the splitwise api, so every
expense it creates is a real splitwise expense your friends already see — no second
ledger, nothing for anyone else to install. it's deliberately small: the few things i do
constantly, in as few taps as possible. "better" means better for _how i split bills_ —
not objectively. (and yes, the icon says BS. both readings intended.)

## how a split works

scan → review → assign → push, in seconds:

1. **scan** — snap or pick a receipt; your own Gemini key reads it back (on-device) as items, tax, tip and fees.
2. **review** — fix anything the scan got wrong.
3. **who's in** — pick a group or friend; attendees pre-fill.
4. **assign** — tap an item, tap who shared it; **everyone** / **just me** for speed.
5. **confirm** — see each person's breakdown, then push: one real splitwise expense with correct paid/owed shares and an itemized comment.

prefer typing? **add** does the same math without a receipt, and **settle up** is one tap.
changed your mind later? open any itemized expense and **edit split** — it rebuilds the
items and people from that comment, no photo needed. every split is **correct by
construction**: fees allocated to the last cent, shares always summing to the total.

## why it's better (for me)

- **minimal & mine** — a handful of screens that do exactly what i want, nothing i don't.
- **receipts in seconds** — the slowest part of splitting becomes a photo.
- **per-item precision** — assign each line to the right people, not a fake equal split.
- **stateless & private** — your splitwise + Gemini keys stay on-device; the app keeps no
  backend of its own. each split's line items ride along in the splitwise comment, so they
  travel with the expense, reopen as a rich breakdown, and survive a reinstall.

## the monorepo

mobile (Expo — where scanning lives) + a web companion, on a turborepo of small,
framework-free packages, so the same split runs identically everywhere.

| package | what it does |
| --- | --- |
| [`apps/mobile`](apps/mobile) | the Expo app — expo router, nativewind, react query |
| [`apps/web`](apps/web) | the web companion — tanstack start + vite, tailwind |
| [`@repo/split-core`](packages/split-core) | the split engine: per-item, weighted, exact fee allocation |
| [`@repo/splitwise`](packages/splitwise) | a thin splitwise api client + adapters |
| [`@repo/ocr`](packages/ocr) | provider-agnostic receipt extraction (Gemini adapter) |

## run it yourself

not on the stores yet — build from source. needs [Bun](https://bun.sh) `1.3+` (plus the
[Expo](https://docs.expo.dev) toolchain + a simulator/emulator for mobile).

```bash
git clone https://github.com/jassuwu/better-splitwise.git
cd better-splitwise && bun install
bun run dev:mobile   # or: bun run dev:web
```

then add your keys once, in-app — stored in the device keychain, never a file: a
**splitwise api key** ([your apps](https://secure.splitwise.com/apps)) to read/write your
data, and, optional for scanning, a **Gemini key** ([AI Studio](https://aistudio.google.com/app/apikey)).
other scripts: `bun run test · tc · lint · format`, and `cd apps/mobile && bun run icons`.

## brand

a faithful parody of the splitwise icon: the same faceted "gem" house, but lime, and the
lone _S_ becomes _BS_ — recreated in **Montserrat**, splitwise's own typeface. one source
svg in [`build-icons.ts`](apps/mobile/scripts/build-icons.ts) builds the whole icon set.

---

<div align="center">

an unofficial client · not affiliated with, or endorsed by, Splitwise, Inc. · [MIT](LICENSE)

</div>
