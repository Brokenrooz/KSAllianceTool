# Kingshot Alliance Tool (KSLookup)

Unofficial desktop tool for tracking alliance rosters and kingdom-wide member rankings for Kingshot.

## Features
- Alliance rosters: TC/TG, Power, Mystic, Notes
- Kingdom leaderboard: aggregates all stored members across alliances + standalone profiles
- “[None] Unassigned” bucket for profiles not assigned to an alliance yet
- Update by Name or GID (GID recommended as the stable identifier)
- English Alias field (always available) for non-English names
- Advanced Profile View (frame/WIP): governor gear + top-3 heroes layout with hover tooltips
- Community roster “patches” (see Contributing; import/export may be expanded over time)

## Getting Started
- Install dependencies: `npm install`
- Run (dev): `npm start`

Notes:
- Do not commit `node_modules/` (use `.gitignore`)
- Data is stored locally on each user’s machine (user cache)

## Data & Fair Use

This tool is designed to store and organize publicly visible in-game information (e.g., roster-visible stats). It does not access private account data, and it does not provide gameplay automation.

Users are responsible for complying with Kingshot’s Terms of Service and any applicable rules.

## Disclaimer

This project is unofficial and is not affiliated with, endorsed by, or sponsored by Century Games (or any related entity). All trademarks and game-related IP belong to their respective owners.

## License (Non-Commercial)

This repository is source-available under a Non-Commercial License:

- You may use, modify, and share it for non-commercial purposes.
- Commercial use, resale, or monetized distribution requires explicit written permission from the author.

See `LICENSE` for details.

## Contributing

Contributions are welcome (UI improvements, bug fixes, and roster “patch” updates). Please read `CONTRIBUTING.md` before opening a PR.

### Roster Patches (Suggested)

If you’re submitting roster additions/updates, prefer adding a patch file (CSV/JSON) instead of directly editing the main data file, to avoid merge conflicts.

Suggested CSV columns:
`gid,tag,name,alias,tc,power,mystic,notes`