# Leonida Platinum — GTA 6 Trophy Guide & Tracker

An offline static web app that guides and tracks all **55 PlayStation 5 trophies** of
Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden). Built for the
[make.fun competition “Build the best GTA 6 trophy guide”](https://make.fun/bounty/gta6-trophy-guide-01).

- **Reward:** [$250 · 50 places paid](https://make.fun/bounty/gta6-trophy-guide-01)
- **Deadline:** [21 Nov 2026, 11:00 UTC](https://make.fun/bounty/gta6-trophy-guide-01)
- **Competition:** [gta6-trophy-guide-01 on make.fun](https://make.fun)

## What it does

- **Checklist** — every trophy with its official name, description and grade, a checkbox,
  kind / missable / counter chips, and a detail pane with a guide written in our own words.
  Every numbered step carries inline source citations ([1], [2], …).
- **Audit bar** — on every tab, computed from the real data: 55 official · 1P 2G 6S 46B ·
  28 hidden · 55/55 guides cite a source · 126/126 steps cited · 11 sources read
  20 Nov 2026 · 1 possibly missable · 2 watch · 8 unconfirmed · 22 single-source · 6 disagree.
- **Sources panel** — every source actually read, numbered, with its title, URL, read date
  and how many of the 55 guides cite it.
- **Source matrix** — a 55 × 11 table: which sources cite each trophy's guide, with a
  "cited by X of 55" total row, computed from the guide data, scrollable on a phone.
- **Roadmap** — 5 stages to the platinum, each with a progress bar and checklist.
- **Missables** — the possibly-missable trophy, the watch list, the unconfirmed steps and
  the places where the sources disagree, each with its basis shown.
- **Next up** — a smart planner: possibly-missable first, then the earliest unfinished
  story stage, then the counters nearest completion.
- **Save & Export** — progress, counters and notes saved in the browser (localStorage),
  exportable to a file and importable back, with an export preview and import status.
- **Spoiler setting** — hides story trophy names and descriptions until earned (on by default).

## Honesty notes

- Missable flags come only from the official descriptions, with the basis shown.
  “Possibly missable” is a separate flag for the one trophy (Positive Mental Attitude)
  where the sources disagree about whether a Chapter 1 moment is required.
- Steps the guides have not confirmed are labelled **Unconfirmed**; steps where the
  guides disagree say so and show both versions. No location or step is invented.
- Platinum time estimates disagree across the sources (about 200 hours per PowerPyx /
  KeenGamer, up to 300+ hours per Push Square) — the guide says so instead of picking one.

## Run it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

Open `app/index.html` in desktop Chrome with the network off — it loads only its own
files. No library, no build step, no network request at run time.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the kit's vendored `buildDossier`.

## License

MIT — see [LICENSE](LICENSE).
