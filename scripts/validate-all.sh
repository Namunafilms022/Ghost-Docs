#!/usr/bin/env bash
set -e

CLI="node dist/cli.cjs"
OUTDIR="validation"
mkdir -p "$OUTDIR"

DATE=$(date +%F)
REPOS=(
  "expressjs/express"
  "koajs/koa"
  "lodash/lodash"
  "mochajs/mocha"
  "axios/axios"
  "prettier/prettier"
  "sindresorhus/got"
  "facebook/jest"
  "vuejs/core"
  "nestjs/nest"
  "socketio/socket.io"
  "typicode/json-server"
  "chalk/chalk"
  "commander-js/commander.js"
  "jashkenas/underscore"
  "moment/moment"
  "date-fns/date-fns"
  "rollup/rollup"
  "prisma/prisma"
  "enzymebjs/enzyme"
  "visionmedia/debug"
  "remix-run/react-router"
  "reduxjs/redux"
  "grafana/k6"
)

run_validation() {
  local repo="$1"
  local slug="${repo//\//-}"
  local outfile="$OUTDIR/$slug.md"

  echo "━━━ Validating $repo ━━━"

  local explain_out
  explain_out=$(timeout 60 $CLI explain "https://github.com/$repo" --json 2>/dev/null || echo '{"error":"timeout"}')

  local has_error=false
  local explain_status="✅"
  local explain_note=""
  local purpose=""
  local purpose_conf=""
  local auth_note=""
  local auth_conf=""
  local db_note=""
  local db_conf=""
  local entry_note=""
  local frameworks=""
  local deps_count=""
  local pr_status="✅"
  local pr_note=""

  if echo "$explain_out" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('project_summary',''))" 2>/dev/null; then
    purpose=$(echo "$explain_out" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('project_summary','N/A'))" 2>/dev/null || echo "N/A")
    languages=$(echo "$explain_out" | python3 -c "import sys,json; d=json.load(sys.stdin); print(', '.join(d.get('languages',[])))" 2>/dev/null || echo "N/A")
    deps_count=$(echo "$explain_out" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('dependencies',{}).get('total','?'))" 2>/dev/null || echo "?")
    entry_note=$(echo "$explain_out" | python3 -c "import sys,json; d=json.load(sys.stdin); eps=d.get('entry_points',[]); print(', '.join([e['path'] for e in eps[:3]]) if eps else 'none')" 2>/dev/null || echo "N/A")
    auth_note=$(echo "$explain_out" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('authentication','N/A'))" 2>/dev/null || echo "N/A")
    db_note=$(echo "$explain_out" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('database','N/A'))" 2>/dev/null || echo "N/A")
    frameworks=$(echo "$explain_out" | python3 -c "import sys,json; d=json.load(sys.stdin); fw=d.get('modules',[]); print(', '.join([m['name'] for m in fw[:5]]) if fw else 'N/A')" 2>/dev/null || echo "N/A")

    if echo "$purpose" | grep -qi "error"; then
      explain_status="❌"
      explain_note="Error"
      has_error=true
    else
      explain_note="$languages, $deps_count deps"
    fi
  else
    explain_status="❌"
    explain_note="Failed to parse"
    has_error=true
  fi

  local reason1_status="✅"
  local reason1_note=""
  local reason2_status="✅"
  local reason2_note=""
  local reason3_status="✅"
  local reason3_note=""

  if [ "$has_error" = false ]; then
    local r1
    r1=$(timeout 30 $CLI reason "https://github.com/$repo" "What does this do?" 2>/dev/null || echo '{"error":"timeout"}')
    local r1_conf
    r1_conf=$(echo "$r1" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d.get('confidence',0))" 2>/dev/null || echo "0")
    local r1_ans
    r1_ans=$(echo "$r1" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); ans=d.get('answer','').split('.')[0]; print(ans[:80])" 2>/dev/null || echo "N/A")
    if [ "$(echo "$r1_conf" | cut -d. -f1)" -ge 70 ] 2>/dev/null; then
      reason1_status="✅"
    elif [ "$(echo "$r1_conf" | cut -d. -f1)" -ge 30 ] 2>/dev/null; then
      reason1_status="⚠️"
    else
      reason1_status="❌"
    fi
    reason1_note="${r1_conf}% — ${r1_ans}"

    local r2
    r2=$(timeout 30 $CLI reason "https://github.com/$repo" "What test framework?" 2>/dev/null || echo '{"error":"timeout"}')
    local r2_conf
    r2_conf=$(echo "$r2" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d.get('confidence',0))" 2>/dev/null || echo "0")
    local r2_ans
    r2_ans=$(echo "$r2" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); ans=d.get('answer','').split('.')[0]; print(ans[:80])" 2>/dev/null || echo "N/A")
    if [ "$(echo "$r2_conf" | cut -d. -f1)" -ge 70 ] 2>/dev/null; then
      reason2_status="✅"
    elif [ "$(echo "$r2_conf" | cut -d. -f1)" -ge 30 ] 2>/dev/null; then
      reason2_status="⚠️"
    else
      reason2_status="❌"
    fi
    reason2_note="${r2_conf}% — ${r2_ans}"

    local r3
    r3=$(timeout 30 $CLI reason "https://github.com/$repo" "Where is entry point?" 2>/dev/null || echo '{"error":"timeout"}')
    local r3_conf
    r3_conf=$(echo "$r3" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d.get('confidence',0))" 2>/dev/null || echo "0")
    local r3_ans
    r3_ans=$(echo "$r3" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); ans=d.get('answer','').split('.')[0]; print(ans[:80])" 2>/dev/null || echo "N/A")
    if [ "$(echo "$r3_conf" | cut -d. -f1)" -ge 70 ] 2>/dev/null; then
      reason3_status="✅"
    elif [ "$(echo "$r3_conf" | cut -d. -f1)" -ge 30 ] 2>/dev/null; then
      reason3_status="⚠️"
    else
      reason3_status="❌"
    fi
    reason3_note="${r3_conf}% — ${r3_ans}"

    local pr_out
    pr_out=$(timeout 30 $CLI pr "https://github.com/$repo" --dry-run 2>/dev/null || echo '{"error":"timeout"}')
    if echo "$pr_out" | python3 -c "import sys; print('impact' in sys.stdin.read().lower())" 2>/dev/null; then
      pr_status="✅"
      pr_note="Impacts detected"
    else
      pr_status="⚠️"
      pr_note="No impacts (no recent changes)"
    fi
  fi

  cat > "$outfile" << REPOFILE
# Validation: ${repo#*/}

**Repo:** \`$repo\`
**Date:** $DATE

## Results

| Command | Status | Notes |
|---|---|---|
| \`explain\` | $explain_status | $explain_note |
| \`reason "What does this do?"\` | $reason1_status | $reason1_note |
| \`reason "What test framework?"\` | $reason2_status | $reason2_note |
| \`reason "Where is entry point?"\` | $reason3_status | $reason3_note |
| \`pr --dry-run\` | $pr_status | $pr_note |

## Details

- **Languages:** $languages
- **Modules:** $frameworks
- **Entry Points:** $entry_note
- **Auth:** $auth_note
- **Database:** $db_note
- **Dependencies:** $deps_count

REPOFILE

  echo "✓ Saved $outfile"
}

for repo in "${REPOS[@]}"; do
  run_validation "$repo"
done

echo ""
echo "━━━ All validations complete ━━━"
echo "Files saved to $OUTDIR/"
ls -1 "$OUTDIR"/*.md
