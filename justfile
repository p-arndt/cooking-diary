# Cooking Diary. The web app runs on pnpm scripts (see package.json); the Android app
# has its own recipes in mobile/justfile. `just mobile` lists them, `just mobile release`
# builds the signed Play bundle. Inside mobile/ the `mobile` prefix is not needed.
#
# Shared recipes (image, up/down, version, release, …) live in .just/, copied from
# ~/coding/just-common. Edit them there and run `just sync-common`. Note that
# `just release` here cuts a stamp release (bump, commit, tag, push).

mod mobile

import '.just/common.just'
import '.just/docker.just'
import '.just/release.just'

IMAGE := "cooking-diary"

# Start the dev server (http://127.0.0.1:5173)
dev:
    pnpm dev

# Type-check with svelte-check
check:
    pnpm check

# Run the unit tests once
test:
    pnpm test:unit --run

# Everything CI would run: type check, lint, unit tests
ci: check
    pnpm lint
    pnpm test:unit --run
