#!/usr/bin/env bash
# Publishes a cleaned copy of this repo's main branch to the public mirror
# (PlayingArc/gsanchez.me), which the site links to as its source code.
#
# Cleaning, on a fresh clone so this checkout is never touched:
#   - drops .wrangler/ (local Wrangler state, once committed by mistake; it holds local paths)
#   - rewrites the personal Gmail address in commit metadata to the GitHub noreply address
# then scans the result with gitleaks and refuses to push if it finds anything.
#
# The rewrite is deterministic, so rerunning it after new commits on main only adds commits
# on the mirror. Needs git-filter-repo and gitleaks on PATH (or in $TOOLS).
#
#   scripts/publish-mirror.sh            # clean, scan, push
#   DRY_RUN=1 scripts/publish-mirror.sh  # clean and scan only
set -euo pipefail

SRC=${SRC:-git@github.com:PlayingArc/portfolio.git}
DEST=${DEST:-git@github.com:PlayingArc/gsanchez.me.git}
NOREPLY='133719393+PlayingArc@users.noreply.github.com'
PATH="${TOOLS:-/tmp/tools-dl}:$PATH"

for bin in git-filter-repo gitleaks; do
  command -v "$bin" >/dev/null || { echo "missing $bin (put it on PATH or in \$TOOLS)" >&2; exit 1; }
done

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

git clone --quiet --single-branch --branch main "$SRC" "$work/repo"
cd "$work/repo"

cat >"$work/mailmap" <<EOF
<$NOREPLY> <gerardo.sanlpz@gmail.com>
EOF

git filter-repo --quiet --force \
  --path .wrangler/ --invert-paths \
  --mailmap "$work/mailmap"

if git log --all --format='%ae%n%ce' | grep -q 'gerardo.sanlpz'; then
  echo "personal email still in history; not pushing" >&2
  exit 1
fi
gitleaks git --no-banner --redact --log-opts=--all .

if [[ -n ${DRY_RUN:-} ]]; then
  echo "clean: $(git rev-list --count HEAD) commits, head $(git rev-parse --short HEAD) (dry run, not pushed)"
  exit 0
fi

git push --force "$DEST" main:main
echo "published $(git rev-parse --short HEAD) to $DEST"
