<h1 align="center">better splitwise</h1>

<p align="center">
  <strong>the small, opinionated splitwise i actually wanted to use.</strong>
</p>

<p align="center">
  a minimal companion for your splitwise account: scan a receipt, assign items to
  people, and push one correct expense — in seconds. splitwise stays the ledger;
  this is just a faster, quieter way to feed it.
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

<p align="center">
  <em>the header is a placeholder — a real demo lands here soon.</em>
</p>

## the idea

splitwise is the right place to keep who-owes-whom. it is not the right place to
_enter_ a messy group dinner: itemizing by hand is slow, and "split equally" is
quietly wrong the moment one person skipped the cocktails.

**better splitwise** is the front end i wanted for it. it talks to splitwise
through the public api, so every expense you create is a real splitwise expense
your friends already see — no second ledger, no migration, nothing to convince
anyone to install. it just makes the _entering_ fast and the _math_ right.

it's deliberately small. it does the few things i do constantly, does them in as
few taps as possible, and leaves everything else to splitwise. "better" here means
**better for the way i split bills** — not objectively better, not feature-complete.
(yes, the icon says BS. it's a parody of the splitwise house, and it's also _better
splitwise_. both things are true.)

## how a split works

1. **scan** — point the camera at a receipt (or pick a photo). on-device, the image
   is downscaled and sent to your own Gemini key, which reads it back as structured
   items, tax, tip and fees.
2. **review** — fix anything the scan got wrong; receipts are messy and you stay in
   control.
3. **who's in** — pick a group or a friend; attendees pre-fill from the group.
4. **assign** — items start unassigned; tap an item, then tap who shared it — or
   **everyone** / **just me** to go fast, and clear a line back to unassigned anytime.
5. **confirm** — see each person's share broken down (subtotal + their cut of tax,
   tip and fees), then push. it lands in splitwise as one expense with correct
   per-person paid/owed shares and a readable itemization comment.

changed the split later? open any itemized expense and tap **edit split** — better
splitwise rebuilds the items, people and fees from that comment, so you can
re-assign and save without starting from a photo again.

prefer to type it in? the **add** flow does the same split math without a receipt,
and **settle up** records a payment in a tap.

splits are **correct by construction** — every fee is allocated to the last cent and
each person's shares always sum back to the total. no leftover pennies, ever.

## why it's better (for me)

- **minimal & mine** — a handful of screens that do exactly what i want and nothing
  i don't. opinionated on purpose.
- **receipts in seconds** — the slowest part of splitting becomes a photo.
- **per-item precision** — assign each line to the right people instead of pretending
  dinner was equal.
- **stateless & private** — your splitwise and Gemini keys live on your device;
  the app keeps no account or database of its own, so splitwise is the only
  backend. each split's line items ride along in the expense's splitwise comment
  (splitwise doesn't store them itself), so they travel with the expense, show
  back as a rich breakdown you can reopen and re-split anytime, and survive a
  reinstall — nothing to lose.

## surfaces

- **mobile** (the main app) — iOS and Android, built with Expo. this is where the
  receipt scanning lives.
- **web** — a companion for the bigger screen (manage groups and expenses); no
  scanning, since receipts are a phone thing.

## the monorepo

a turborepo of small, testable pieces. the logic packages are plain typescript and
framework-free, so the same split runs identically on mobile, on web, and in tests.

| package | what it does |
| --- | --- |
| [`apps/mobile`](apps/mobile) | the Expo app — expo router, nativewind, react query |
| [`apps/web`](apps/web) | the web companion — tanstack start + vite + nitro, tailwind |
| [`@repo/split-core`](packages/split-core) | the split engine: per-item, weighted, exact fee allocation (zod-validated) |
| [`@repo/splitwise`](packages/splitwise) | a thin splitwise api client + adapters (expense / settle / group / balances) |
| [`@repo/ocr`](packages/ocr) | provider-agnostic receipt extraction; a Gemini structured-output adapter |
| [`@repo/ui`](packages/ui) | shared components |

## run it yourself

not on the stores yet — for now you build from source.

**prerequisites:** [Bun](https://bun.sh) `1.3+`. for the mobile app you'll also want
the [Expo](https://docs.expo.dev) toolchain and an iOS simulator or Android emulator
(or the Expo Go app on a real device).

```bash
git clone https://github.com/jassuwu/better-splitwise.git
cd better-splitwise
bun install

bun run dev:mobile   # the Expo app
# or
bun run dev:web      # the web companion
```

then, inside the app, add your keys once — they're stored in the device keychain, not
in any file:

- **splitwise api key** — create one under [your apps on
  splitwise](https://secure.splitwise.com/apps) and paste it on first launch. this is
  what lets the app read and write your real splitwise data.
- **Gemini api key** (optional, for receipt scanning) — grab one from [Google AI
  Studio](https://aistudio.google.com/app/apikey) and paste it in the **you** tab.
  without it, everything except the scanner still works.

## commands

```bash
bun run dev          # everything, via turborepo
bun run dev:mobile   # just the Expo app
bun run dev:web      # just the web companion
bun run test         # all tests
bun run test:core    # just the logic packages (split-core, splitwise, ocr, db)
bun run lint         # lint
bun run tc           # type-check
bun run format       # prettier
cd apps/mobile && bun run icons   # regenerate every brand icon from one source mark
```

## brand

the mark is a friendly parody of the splitwise app icon — the same faceted "gem"
house, with two changes: the greens become lime, and the lone _S_ becomes _BS_
(better splitwise). the wordmark is **Comic Code Bold**. one source svg in
[`apps/mobile/scripts/build-icons.ts`](apps/mobile/scripts/build-icons.ts) generates
the entire Expo and web icon set.

---

<div align="center">

an unofficial client · not affiliated with, or endorsed by, Splitwise, Inc. · [MIT](LICENSE)

</div>
