# Contributing

Thanks for contributing.

## Rules
1) **No private data.**
   Only submit stats that are publicly visible in-game (e.g., roster-visible fields).
2) **No automation / scraping code** in PRs unless explicitly requested by the maintainer.
3) Keep changes focused: one PR = one feature/fix/patch set.

## Roster Patch Contributions
Preferred format for roster updates is a patch file:
- `patches/<TAG>/YYYY-MM-DD_<yourname>.csv`

Suggested CSV columns:
- `gid,tag,name,alias,tc,power,mystic,notes`

Example:
```csv
gid,tag,name,alias,tc,power,mystic,notes
54369814,VAL,Void Von Victor,,TG5,182.1m,1113,
