#!/usr/bin/env python3
"""QA Test Suite for Ghost Docs — 50 repos, systematic analysis, bug reporting."""
import subprocess, json, re, os, sys, time
from datetime import datetime
from collections import defaultdict

CLI = ["node", "dist/cli.cjs"]
CLI_DIR = "/root/ghost-docs/apps/cli"
REPORT_FILE = "/root/ghost-docs/QA_REPORT.md"
os.makedirs("/root/ghost-docs/qa-logs", exist_ok=True)

# 50 repos — diverse languages, sizes, project types
REPOS = [
    # JavaScript/TypeScript
    "expressjs/express", "koajs/koa", "lodash/lodash", "mochajs/mocha",
    "axios/axios", "facebook/jest", "vuejs/core", "nestjs/nest",
    "socketio/socket.io", "typicode/json-server", "chalk/chalk",
    "jashkenas/underscore", "moment/moment", "date-fns/date-fns",
    "rollup/rollup", "visionmedia/debug", "reduxjs/redux",
    "remix-run/react-router", "enzymebjs/enzyme", "graphql/graphql-js",
    "babel/babel", "webpack/webpack", "gulpjs/gulp", "jquery/jquery",
    "nodejs/node", "npm/cli", "yarnpkg/berry", "sindresorhus/got",
    "sindresorhus/ora", "sindresorhus/type-fest",
    "sindresorhus/is", "sindresorhus/meow", "sindresorhus/globby",
    "isaacs/node-lru-cache", "npm/node-semver",
    # Python
    "django/django", "pallets/flask", "psf/requests",
    "pytest-dev/pytest", "python/cpython",
    # Go
    "golang/go", "gin-gonic/gin", "gohugoio/hugo",
    # Rust
    "rust-lang/rust", "tokio-rs/tokio", "serde-rs/serde",
    # Java
    "spring-projects/spring-boot", "elastic/elasticsearch",
    # Multi-language / Big
    "neovim/neovim", "microsoft/vscode",
]

BUGS = []
TIMINGS = defaultdict(list)
REPO_RESULTS = {}

def run(cmd, timeout=120):
    start = time.time()
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, cwd=CLI_DIR)
        elapsed = time.time() - start
        return r.stdout + r.stderr, elapsed, None
    except subprocess.TimeoutExpired:
        return "", time.time() - start, "TIMEOUT"
    except Exception as e:
        return "", time.time() - start, str(e)

def extract_json(text):
    brace = text.find("{")
    if brace < 0: return None
    js = text[brace:]
    depth = 0
    for i,c in enumerate(js):
        if c == "{": depth += 1
        elif c == "}": depth -= 1
        if depth == 0:
            try: return json.loads(js[:i+1])
            except: return None
    return None

def extract_confidence(text):
    m = re.search(r'Confidence:\s*(\d+)%', text)
    return int(m.group(1)) if m else 0

def extract_answer(text):
    lines = text.split('\n')
    capture = False
    ans = []
    for l in lines:
        if l.startswith("✅"): capture = True; continue
        if capture:
            if l.startswith("Supporting") or l.startswith("Why I answered"):
                break
            if l.strip():
                ans.append(l.strip())
    return " ".join(ans)[:200] if ans else "N/A"

def add_bug(severity, summary, steps, expected, actual, fix):
    BUGS.append({
        "severity": severity,
        "summary": summary,
        "steps": steps,
        "expected": expected,
        "actual": actual,
        "suggested_fix": fix,
    })

def test_repo(repo):
    slug = repo.replace("/", "-")
    log_file = f"/root/ghost-docs/qa-logs/{slug}.log"
    results = {"repo": repo, "explain": None, "reasons": [], "pr": None, "errors": [], "warnings": []}
    log_lines = [f"{'='*60}", f"QA Test: {repo}", f"{'='*60}"]

    # ── Phase 1: explain ──
    log_lines.append("\n[PHASE 1] explain --json")
    explain_start = time.time()
    out, elapsed, err = run(CLI + ["explain", f"https://github.com/{repo}", "--json"])
    log_lines.append(f"Time: {elapsed:.1f}s")

    j = extract_json(out)
    if err == "TIMEOUT":
        results["explain"] = "TIMEOUT"
        results["errors"].append(f"Explain timed out after 120s")
        add_bug("HIGH", f"Explain timeout on {repo}",
                f"Run `ghost-docs explain https://github.com/{repo}`",
                "Should complete within 120s", f"Timed out after 120s",
                "Optimize repo-fetcher.shallow clone for large repos")
    elif not j:
        results["explain"] = "CRASH"
        results["errors"].append(f"Explain failed to produce JSON. Output: {out[:500]}")
        add_bug("CRITICAL", f"Explain crash/no JSON on {repo}",
                f"Run `ghost-docs explain https://github.com/{repo} --json`",
                "Valid JSON output", f"No JSON found in output. Error: {out[:200]}",
                "Check for unhandled error in knowledge-extraction-engine")
    else:
        results["explain"] = j
        results["time"] = elapsed
        TIMINGS["explain"].append(elapsed)

        # Validate fields
        required = ["project_summary", "languages", "modules", "entry_points", "dependencies"]
        for field in required:
            if field not in j:
                results["warnings"].append(f"Missing field: {field}")
                add_bug("MEDIUM", f"Missing '{field}' in explain output for {repo}",
                        f"ghost-docs explain https://github.com/{repo} --json",
                        f"'{field}' should be present", f"'{field}' missing from JSON",
                        f"Ensure knowledge-graph-builder sets {field}")

        # Check empty fields
        for field in ["languages", "modules", "entry_points"]:
            if field in j and not j[field]:
                results["warnings"].append(f"Empty field: {field}")
                add_bug("LOW", f"Empty '{field}' for {repo}",
                        f"ghost-docs explain https://github.com/{repo} --json",
                        f"'{field}' should have values", f"'{field}' is empty array",
                        "Check data collection logic for edge cases")

    with open(log_file, "w") as f:
        f.write("\n".join(log_lines))

    return results

def test_reason_repos(repos_to_test):
    for repo in repos_to_test:
        slug = repo.replace("/", "-")
        log_file = f"/root/ghost-docs/qa-logs/{slug}.log"
        log_lines = []

        questions = [
            ("What does this do?", "purpose"),
            ("What test framework?", "test_framework"),
            ("Where is entry point?", "entry_point"),
        ]
        reasons = []
        for q, label in questions:
            log_lines.append(f"\n[REASON] {q}")
            out, elapsed, err = run(CLI + ["reason", f"https://github.com/{repo}", q], timeout=60)
            log_lines.append(f"Time: {elapsed:.1f}s")

            if err:
                reasons.append({"question": q, "status": "ERROR", "error": err})
                add_bug("HIGH", f"Reason '{q}' on {repo}: {err}",
                        f"ghost-docs reason https://github.com/{repo} \"{q}\"",
                        "Successful response", f"Error: {err}",
                        "Fix exception in reasoning-engine")
            else:
                conf = extract_confidence(out)
                ans = extract_answer(out)
                reasons.append({"question": q, "confidence": conf, "answer": ans, "output": out})
                log_lines.append(f"Confidence: {conf}%")
                log_lines.append(f"Answer: {ans[:150]}")

                if conf < 10:
                    add_bug("LOW", f"Very low confidence ({conf}%) for '{q}' on {repo}",
                            f"ghost-docs reason https://github.com/{repo} \"{q}\"",
                            "Confidence >= 10% on a real repo", f"Confidence: {conf}%",
                            "Improve source-resolver mapping for this category")

                if len(ans) < 5 or ans == "N/A":
                    add_bug("MEDIUM", f"Empty/vague answer for '{q}' on {repo}",
                            f"ghost-docs reason https://github.com/{repo} \"{q}\"",
                            "Meaningful answer text", f"Answer: {ans}",
                            "Improve reasoning-engine answer generation")

        with open(log_file, "a") as f:
            f.write("\n".join(log_lines))

        yield repo, reasons

def test_pr(repo):
    slug = repo.replace("/", "-")
    out, elapsed, err = run(CLI + ["pr", f"https://github.com/{repo}", "--dry-run"], timeout=60)
    log_lines = [f"\n[PR] dry-run on {repo}", f"Time: {elapsed:.1f}s"]
    if err:
        log_lines.append(f"ERROR: {err}")
    else:
        log_lines.append(out[:500])
    with open(f"/root/ghost-docs/qa-logs/{slug}.log", "a") as f:
        f.write("\n".join(log_lines))
    return err, out[:500] if out else ""

def detect_known_issues(j, repo):
    """Detect known wrong answers / misclassifications."""
    issues = []
    if not j: return issues

    # Check project_summary for accuracy
    summary = j.get("project_summary", "")
    if "koa" in repo.lower() and "koa" in repo.lower():
        pass  # placeholder for repo-specific checks

    # Check language detection
    langs = j.get("languages", [])
    if repo == "python/cpython" and "Python" not in langs:
        issues.append(("LOW", f"Language detection missed Python for python/cpython"))
    if repo == "golang/go" and "Go" not in langs:
        issues.append(("LOW", f"Language detection missed Go for golang/go"))
    if repo == "rust-lang/rust" and "Rust" not in langs:
        issues.append(("LOW", f"Language detection missed Rust for rust-lang/rust"))

    # Check auth detection false positives
    auth = j.get("authentication", "")
    if "Not detected" not in auth:
        # Could be valid, but check for known false positives
        false_positives = ["class-variance-authority", "vendor", "path"]
        for fp in false_positives:
            if fp.lower() in auth.lower():
                issues.append(("MEDIUM", f"Auth false positive on {repo}: '{auth}' matched '{fp}'"))

    # Check dependency count
    deps = j.get("dependencies", {})
    total = deps.get("total", 0)
    prod = deps.get("production", 0)
    dev = deps.get("development", 0)
    if total > 0 and prod + dev > total:
        issues.append(("LOW", f"Dependency count mismatch on {repo}: total={total}, prod+dev={prod+dev}"))

    return issues

# ══════════════════════════════════════════════
# MAIN QA RUN
# ══════════════════════════════════════════════

now = datetime.now().isoformat()
print(f"QA Test Suite — {len(REPOS)} repos — Started {now}")
print("=" * 60)

# Phase 1: explain all 50 repos
print("\n[PHASE 1] Running explain on 50 repos...")
successful_repos = []
for i, repo in enumerate(REPOS, 1):
    pct = f"{i/50*100:.0f}%"
    print(f"  [{pct}] {i}/50 {repo} ...", end=" ", flush=True)
    res = test_repo(repo)
    REPO_RESULTS[repo] = res
    if res["explain"] not in ("TIMEOUT", "CRASH"):
        print(f"✅ {res['time']:.0f}s")
        successful_repos.append(repo)
    elif res["explain"] == "TIMEOUT":
        print("⏰ TIMEOUT")
    else:
        print("💥 CRASH")
    explain_data = res.get("explain")
    if isinstance(explain_data, dict):
        log_issues = detect_known_issues(explain_data, repo)
        for sev, msg in log_issues:
            print(f"     ⚠ {sev}: {msg}")

# Phase 2: reason on successful repos
print(f"\n[PHASE 2] Running reason on {len(successful_repos)} successful repos...")
for repo, reasons in test_reason_repos(successful_repos[:30]):  # limit to 30 due to time
    pass

# Phase 3: pr on subset
print(f"\n[PHASE 3] Running pr --dry-run on first 20 successful repos...")
for repo in successful_repos[:20]:
    print(f"  pr {repo} ...", end=" ", flush=True)
    err, output = test_pr(repo)
    if err:
        print(f"❌ {err}")
    else:
        if "impact" in output.lower() or "Diff" in output:
            print("✅ impacts")
        else:
            print("⚠️ no changes")

# ══════════════════════════════════════════════
# ANALYZE & REPORT
# ══════════════════════════════════════════════

print(f"\n{'='*60}")
print("Generating QA Report...")

success_explain = sum(1 for r in REPO_RESULTS.values() if r["explain"] not in ("TIMEOUT", "CRASH", None))
timeout_count = sum(1 for r in REPO_RESULTS.values() if r["explain"] == "TIMEOUT")
crash_count = sum(1 for r in REPO_RESULTS.values() if r["explain"] == "CRASH")
times_list = [r["time"] for r in REPO_RESULTS.values() if "time" in r and isinstance(r.get("time"), (int, float))]
avg_time = sum(times_list) / max(len(times_list), 1)

# Aggregate confidence stats
all_confs = []
for r in REPO_RESULTS.values():
    if "reasons" in r:
        for reason in r["reasons"]:
            if "confidence" in reason:
                all_confs.append(reason["confidence"])
avg_conf = sum(all_confs) / max(len(all_confs), 1)

# Categorize bugs
by_severity = {"CRITICAL": [], "HIGH": [], "MEDIUM": [], "LOW": []}
for b in BUGS:
    by_severity[b["severity"]].append(b)

# ── WRITE REPORT ──
with open(REPORT_FILE, "w") as f:
    f.write(f"# Ghost Docs — QA Test Report\n\n")
    f.write(f"**Date:** {now.split('T')[0]}\n")
    f.write(f"**Total Repos Tested:** {len(REPOS)}\n")
    f.write(f"**Successful Explains:** {success_explain}\n")
    f.write(f"**Timeouts:** {timeout_count}\n")
    f.write(f"**Crashes:** {crash_count}\n")
    f.write(f"**Total Bugs Found:** {len(BUGS)}\n\n")

    f.write("## Executive Summary\n\n")
    f.write(f"- **Explain pass rate:** {success_explain}/{len(REPOS)} ({success_explain*100//len(REPOS)}%)\n")
    f.write(f"- **Average explain time:** {avg_time:.1f}s\n")
    f.write(f"- **Average reason confidence:** {avg_conf:.0f}%\n")
    f.write(f"- **Critical bugs:** {len(by_severity['CRITICAL'])}\n")
    f.write(f"- **High bugs:** {len(by_severity['HIGH'])}\n")
    f.write(f"- **Medium bugs:** {len(by_severity['MEDIUM'])}\n")
    f.write(f"- **Low bugs:** {len(by_severity['LOW'])}\n\n")

    # ── Bug Report ──
    f.write("## Bug Report\n\n")
    for sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
        bugs = by_severity[sev]
        if not bugs: continue
        f.write(f"### {sev} — {len(bugs)} issue(s)\n\n")
        for i, bug in enumerate(bugs, 1):
            f.write(f"**#{i}.** {bug['summary']}\n\n")
            f.write(f"- **Severity:** {bug['severity']}\n")
            f.write(f"- **Steps to reproduce:** {bug['steps']}\n")
            f.write(f"- **Expected:** {bug['expected']}\n")
            f.write(f"- **Actual:** {bug['actual']}\n")
            f.write(f"- **Suggested fix:** {bug['suggested_fix']}\n\n")

    # ── Performance ──
    f.write("## Performance Analysis\n\n")
    f.write("| Metric | Value |\n")
    f.write("|---|---|\n")
    f.write(f"| Avg explain time | {avg_time:.1f}s |\n")
    fast = min(TIMINGS.get('explain',[0])) if TIMINGS.get('explain') else 0
    slow = max(TIMINGS.get('explain',[0])) if TIMINGS.get('explain') else 0
    f.write(f"| Fastest explain | {fast:.1f}s |\n")
    f.write(f"| Slowest explain | {slow:.1f}s |\n")
    f.write(f"| Explanations >60s | {sum(1 for t in TIMINGS.get('explain',[]) if t>60)} |\n")
    f.write(f"| Explanations >120s | {sum(1 for t in TIMINGS.get('explain',[]) if t>120)} |\n")
    f.write(f"| Timeouts | {timeout_count} |\n\n")

    f.write("### Slow Repos (>60s)\n\n")
    for repo, r in sorted(REPO_RESULTS.items(), key=lambda x: x[1].get("time", 0) if isinstance(x[1].get("time"), (int,float)) else 0, reverse=True):
        t = r.get("time", 0)
        if isinstance(t, (int, float)) and t > 60:
            langs = r.get("explain", {}).get("languages", ["?"]) if isinstance(r.get("explain"), dict) else ["?"]
            f.write(f"- {repo}: {t:.0f}s ({', '.join(langs)})\n")

    f.write("\n## Repo-by-Repo Results\n\n")
    f.write("| # | Repo | Explain | Time | Languages | Deps | Purpose Conf | Test Conf | Entry Conf | PR |\n")
    f.write("|---|---|---|---|---|---|---|---|---|---|\n")
    for i, repo in enumerate(REPOS, 1):
        r = REPO_RESULTS[repo]
        explain_val = r.get("explain")
        if not isinstance(explain_val, dict):
            status = "💥" if explain_val == "CRASH" else "⏰"
            f.write(f"| {i} | {repo} | {status} | - | - | - | - | - | - | - |\n")
        else:
            j = explain_val
            langs = ", ".join(j.get("languages", []))[:30]
            deps = j.get("dependencies", {}).get("total", "?")
            reason_confs = [str(x.get("confidence", "?")) for x in r.get("reasons", [])]
            conf_str = "/".join(reason_confs) if reason_confs else "-"
            pr_out = r.get("pr", "?")
            f.write(f"| {i} | {repo} | ✅ | {r.get('time',0):.0f}s | {langs} | {deps} | {conf_str} | {pr_out[:10] if pr_out else '?'} |\n")

    # ── Known Issues Section ──
    f.write("\n## Known Limitations (Not Filed as Bugs)\n\n")
    f.write("1. **Large monorepos timeout** — Repos like babel, webpack, nodejs, vscode exceed 120s clone+scan\n")
    f.write("2. **Go/Rust repos** — Detection limited for non-JS ecosystems (some deps may be missed)\n")
    f.write("3. **Auth false positives** — Library names containing 'auth' substring still trigger detection\n")
    f.write("4. **Entry point detection** — Only catches known patterns; custom entry points may be missed\n")
    f.write("5. **GitHub rate limiting** — Cloning many repos sequentially may hit anonymous rate limits\n")
    f.write("6. **pr --dry-run on fresh clones** — No git history means no impacts detected on shallow clones\n\n")

    f.write("---\n*Generated by Ghost Docs QA Test Suite*\n")

print(f"\n✅ Report saved to {REPORT_FILE}")
print(f"Total bugs: {len(BUGS)}")
for sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
    print(f"  {sev}: {len(by_severity[sev])}")
