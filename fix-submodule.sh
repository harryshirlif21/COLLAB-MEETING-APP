#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "${repo_root}"

if [[ ! -d ".github/workflows" ]]; then
  mkdir -p ".github/workflows"
fi

if [[ "$#" -gt 0 ]]; then
  conflicts=("$@")
else
  mapfile -t conflicts < <(git ls-files --stage | awk '$1 == "160000" { print $4 }')
fi

if [[ "${#conflicts[@]}" -eq 0 ]]; then
  echo "No gitlink/submodule entries found in the index."
else
  for folder in "${conflicts[@]}"; do
    echo "Removing submodule-style index tracking for: ${folder}"
    git rm --cached "${folder}"
  done
fi

git add .github/workflows/main.yml
git status --short

git commit -m "Add Medical AI Docker image CI pipeline"
