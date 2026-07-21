#!/usr/bin/env python3
import subprocess
import json
import sys
import os
import re
from datetime import date

CLI = ["node", "dist/cli.cjs"]
OUTDIR = "validation"
os.makedirs(OUTDIR, exist_ok=True)
TODAY = date.today().isoformat()

REPOS = [
    "expressjs/express",
    "koajs/koa",
    "lodash/lodash",
    "mochajs/mocha",
    "axios/axios",
    "prettier/prettier",
    "sindresorhus/got",
    "facebook/jest",
    "vuejs/core",
    "nestjs/nest",
    "socketio/socket.io",
    "typicode/json-server",
    "chalk/chalk",
    "commander-js/commander.js",
    "jashkenas/underscore",
    "moment/moment",
    "date-fns/date-fns",
    "rollup/rollup",
    "prisma/prisma",
    "enzymebjs/enzyme",
    "visionmedia/debug",
    "remix-run/react-router",
    "reduxjs/redux",
    "grafana/k6",
]

def run_cmd(cmd, timeout=90):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, cwd="/root/ghost-docs/apps/cli")
        return r.stdout + r.stderr
    except subprocess.TimeoutExpired:
        return "TIMEOUT"
    except Exception as e:
        return f"ERROR: {e}"

def extract_json(output):
    brace = output.find("{")
    if brace < 0:
        return None
    json_str = output[brace:]
    depth = 0
    for i, c in enumerate(json_str):
        if c == "{": depth += 1
        elif c == "}": depth -= 1
        if depth == 0:
            try:
                return json.loads(json_str[:i+1])
            except json.JSONDecodeError:
                return None
    return None

def extract_reason_data(output):
    conf_match = re.search(r'Confidence:\s*(\d+)%', output)
    confidence = int(conf_match.group(1)) if conf_match else 0

    lines = output.split("\n")
    answer_lines = []
    in_answer = False
    for line in lines:
        if line.startswith("Supporting files:") or line.startswith("Supporting modules:") or line.startswith("Why I answered"):
            break
        if in_answer:
            answer_lines.append(line)
        if line.startswith("✅"):
            in_answer = True

    answer = " ".join(a.strip() for a in answer_lines if a.strip())[:100] if answer_lines else "N/A"
    return confidence, answer

def validate_repo(repo):
    name = repo.split("/")[1]
    slug = repo.replace("/", "-")
    outfile = os.path.join(OUTDIR, f"{slug}.md")
    print(f"\n{'='*60}")
    print(f"Validating: {repo}")
    print(f"{'='*60}")

    data = {}

    print("  [1/5] explain --json ...", end=" ", flush=True)
    out = run_cmd(CLI + ["explain", f"https://github.com/{repo}", "--json"])
    j = extract_json(out)
    if j:
        print("OK")
        data["explain"] = j
        data["explain_status"] = "✅"
        langs = ", ".join(j.get("languages", []))
        deps = j.get("dependencies", {}).get("total", "?")
        data["explain_note"] = f"{langs}, {deps} deps"
        data["languages"] = langs
        data["modules"] = ", ".join(m["name"] for m in j.get("modules", [])[:5])
        data["entry_points"] = ", ".join(e["path"] for e in j.get("entry_points", [])[:3])
        data["auth"] = j.get("authentication", "N/A")
        data["db"] = j.get("database", "N/A")
        data["deps_count"] = str(deps)
    else:
        print("FAIL")
        data["explain_status"] = "❌"
        data["explain_note"] = "Explain failed"
        for k in ["languages","modules","entry_points","auth","db","deps_count"]:
            data[k] = "N/A"

    has_error = data["explain_status"] == "❌"

    for qnum, (q, label) in enumerate([
        ("What does this do?", "purpose"),
        ("What test framework?", "test_framework"),
        ("Where is entry point?", "entry"),
    ], 2):
        print(f"  [{qnum}/5] reason '{q}' ...", end=" ", flush=True)
        if has_error:
            print("SKIP")
            data[f"reason_{label}_status"] = "❌"
            data[f"reason_{label}_note"] = "Skipped (explain failed)"
        else:
            out = run_cmd(CLI + ["reason", f"https://github.com/{repo}", q], timeout=60)
            if out == "TIMEOUT":
                print("TIMEOUT")
                data[f"reason_{label}_status"] = "⚠️"
                data[f"reason_{label}_note"] = "Timed out"
            elif "Error" in out[:100]:
                print("FAIL")
                data[f"reason_{label}_status"] = "❌"
                data[f"reason_{label}_note"] = f"Error"
            else:
                conf, ans = extract_reason_data(out)
                print(f"OK ({conf}%)")
                if conf >= 70:
                    data[f"reason_{label}_status"] = "✅"
                elif conf >= 30:
                    data[f"reason_{label}_status"] = "⚠️"
                else:
                    data[f"reason_{label}_status"] = "❌"
                data[f"reason_{label}_note"] = f"{conf}% — {ans[:80]}"

    print("  [5/5] pr --dry-run ...", end=" ", flush=True)
    if has_error:
        print("SKIP")
        data["pr_status"] = "❌"
        data["pr_note"] = "Skipped (explain failed)"
    else:
        out = run_cmd(CLI + ["pr", f"https://github.com/{repo}", "--dry-run"], timeout=60)
        if "impact" in out.lower() or "Diff" in out or "patch" in out.lower():
            print("OK (impacts detected)")
            data["pr_status"] = "✅"
            data["pr_note"] = "Impacts detected"
        elif "no documentation" in out.lower():
            print("OK (no changes)")
            data["pr_status"] = "⚠️"
            data["pr_note"] = "No documentation changes needed"
        elif out == "TIMEOUT":
            print("TIMEOUT")
            data["pr_status"] = "⚠️"
            data["pr_note"] = "Timed out"
        else:
            print("OK (no impacts)")
            data["pr_status"] = "⚠️"
            data["pr_note"] = "No impacts (fresh clone)"

    with open(outfile, "w") as f:
        f.write(f"# Validation: {name}\n\n")
        f.write(f"**Repo:** `{repo}`\n")
        f.write(f"**Date:** {TODAY}\n\n")
        f.write("## Results\n\n")
        f.write("| Command | Status | Notes |\n")
        f.write("|---|---|---|\n")
        f.write(f"| `explain` | {data['explain_status']} | {data['explain_note']} |\n")
        f.write(f"| `reason \"What does this do?\"` | {data['reason_purpose_status']} | {data['reason_purpose_note']} |\n")
        f.write(f"| `reason \"What test framework?\"` | {data['reason_test_framework_status']} | {data['reason_test_framework_note']} |\n")
        f.write(f"| `reason \"Where is entry point?\"` | {data['reason_entry_status']} | {data['reason_entry_note']} |\n")
        f.write(f"| `pr --dry-run` | {data['pr_status']} | {data['pr_note']} |\n")
        f.write("\n## Details\n\n")
        f.write(f"- **Languages:** {data['languages']}\n")
        f.write(f"- **Modules:** {data['modules']}\n")
        f.write(f"- **Entry Points:** {data['entry_points']}\n")
        f.write(f"- **Auth:** {data['auth']}\n")
        f.write(f"- **Database:** {data['db']}\n")
        f.write(f"- **Dependencies:** {data['deps_count']}\n")

    print(f"  ✓ Saved {outfile}")

if __name__ == "__main__":
    for repo in REPOS:
        validate_repo(repo)
    print(f"\n{'='*60}")
    print(f"All validations complete! {len(REPOS)} files in {OUTDIR}/")
    print(f"{'='*60}")
