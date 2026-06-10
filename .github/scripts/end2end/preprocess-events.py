#!/usr/bin/env python3
"""
Preprocess kind-logs + cucumber NDJSON into an `events.json` for the CTST dashboard.

Lanes emitted:
- Pod restarts (events): Kubernetes Events with reason in {Killing, Started, BackOff} for component pods
- Operator reconcile bursts (bursts): groups of consecutive 'Reconciling Zenko' lines, enriched with
  reconcile count, error count, top waited-for resources, and top resources that became ready

All times are seconds relative to the testRunStarted origin in the NDJSON.

Usage:
    preprocess-events.py <kind-logs-dir> <report.ndjson> <out-events.json>
"""
import json, re, sys, datetime
from collections import Counter
from pathlib import Path

INTERESTING_REASONS = ("Killing", "Started", "BackOff")
POD_NAMESPACE = "default"  # Zenko stack + operator + DBs all live here

# Operator log message patterns
RECONCILE_MSG = "Reconciling Zenko"
ERROR_MSG = "Reconciler error"
NOT_READY_RE = re.compile(r"^resource (\S+) is not ready yet$")
IS_READY_RE = re.compile(r"^resource (\S+) is ready$")

# A "burst" of operator activity is a run of reconciles with no more than
# BURST_IDLE_S of dead air between them. Bigger value = fewer/wider bursts.
BURST_IDLE_S = 5.0


def parse_iso_to_epoch(s: str) -> float:
    return datetime.datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()


def read_run_window(ndjson_path: Path) -> tuple[float, float]:
    origin = None
    end = None
    with ndjson_path.open() as f:
        for line in f:
            if '"testRunStarted"' in line:
                ts = json.loads(line)["testRunStarted"]["timestamp"]
                origin = ts["seconds"] + ts["nanos"] / 1e9
            elif '"testRunFinished"' in line:
                ts = json.loads(line)["testRunFinished"]["timestamp"]
                end = ts["seconds"] + ts["nanos"] / 1e9
    if origin is None:
        raise RuntimeError("testRunStarted not found in NDJSON")
    return origin, end or (origin + 24 * 3600)


def parse_events_yaml(path: Path):
    events = []
    current = None
    with path.open() as f:
        for line in f:
            stripped = line.rstrip("\n")
            if stripped.startswith("- apiVersion: v1"):
                if current:
                    events.append(current)
                current = {}
                continue
            if current is None:
                continue
            m = re.match(r"^(\s*)(\S+):\s*(.*)$", stripped)
            if not m:
                continue
            indent, key, value = m.group(1), m.group(2), m.group(3)
            depth = len(indent) // 2
            if depth == 1 and key == "involvedObject":
                current.setdefault("involvedObject", {})
                current["_section"] = "involvedObject"
                continue
            if depth == 2 and current.get("_section") == "involvedObject":
                # Allowlist is load-bearing: involvedObject also contains keys like
                # fieldPath / apiVersion / resourceVersion that we don't want to capture.
                if key in ("kind", "name", "namespace"):
                    current["involvedObject"][key] = value.strip("'\"")
                continue
            if depth <= 1:
                current.pop("_section", None)
            if depth == 1 and key in ("reason", "message", "type", "lastTimestamp", "firstTimestamp"):
                # YAML block scalars (e.g. multi-line `message:`) keep only the first line;
                # strip both quote styles since the parser can leave a stray opening quote.
                current[key] = value.strip("'\"")
    if current:
        events.append(current)
    return events


def extract_pod_restart_events(events, origin: float):
    out = []
    for e in events:
        if e.get("reason") not in INTERESTING_REASONS:
            continue
        obj = e.get("involvedObject", {})
        if obj.get("kind") != "Pod" or obj.get("namespace") != POD_NAMESPACE:
            continue
        ts_str = e.get("lastTimestamp") or e.get("firstTimestamp")
        if not ts_str:
            continue
        try:
            t_epoch = parse_iso_to_epoch(ts_str)
        except ValueError:
            continue
        out.append({
            "lane": "pods",
            "tS": round(t_epoch - origin, 3),
            "label": f"{obj.get('name', '?')} · {e['reason']}",
            "message": e.get("message", "")[:200],
        })
    out.sort(key=lambda x: x["tS"])
    return out


def stream_operator_log_entries(logs_dir: Path):
    """Yield (t_epoch, parsed_dict) tuples for every JSON-formatted log line from the operator manager log."""
    json_re = re.compile(r"\{.*\}")
    for lf in (logs_dir / "fluentbit-logs").glob("zenko-operator-*_default_manager-*.log"):
        with lf.open() as f:
            for line in f:
                m = json_re.search(line)
                if not m:
                    continue
                try:
                    obj = json.loads(m.group())
                except json.JSONDecodeError:
                    continue
                ts = obj.get("ts")
                if not ts:
                    continue
                try:
                    t = parse_iso_to_epoch(ts)
                except ValueError:
                    continue
                yield t, obj


def build_reconcile_bursts(logs_dir: Path, origin: float):
    """
    Walk the operator manager log, group reconciles into bursts, and collect per-burst details:
      reconcile count, error count, top "not ready" resources waited on, top "is ready" transitions.

    A burst is a run of log entries where consecutive timestamps differ by ≤ BURST_IDLE_S
    seconds AND at least one Reconciling Zenko was observed in the run.
    """
    entries = sorted(stream_operator_log_entries(logs_dir), key=lambda x: x[0])

    bursts = []
    cur = None         # current accumulator

    def close(b):
        if not b or b["count"] == 0:
            return None
        top_wait = [name for name, _ in b["waited"].most_common(5)]
        top_ready = [name for name, _ in b["ready"].most_common(5)]
        # Drop bursts that only logged "Reconciling Zenko" with no resource activity:
        # those are the operator's ~2-minute periodic heartbeat requeues confirming nothing
        # has changed, not a real cluster event. Keep bursts that had errors though.
        if not top_wait and not top_ready and b["errors"] == 0:
            return None
        return {
            "tS":     round(b["start"] - origin, 3),
            "durS":   round(max(b["last"] - b["start"], 0.001), 3),
            "count":  b["count"],
            "errors": b["errors"],
            "waitedFor":   top_wait,
            "becameReady": top_ready,
        }

    for t, obj in entries:
        msg = obj.get("msg", "")
        is_reconcile = (msg == RECONCILE_MSG)
        is_error     = (msg == ERROR_MSG)
        wait_m = NOT_READY_RE.match(msg)
        ready_m = IS_READY_RE.match(msg)

        # Decide whether this line belongs to the current burst or opens a new one.
        if cur and (t - cur["last"]) > BURST_IDLE_S:
            done = close(cur)
            if done is not None:
                bursts.append(done)
            cur = None

        if cur is None and not is_reconcile:
            continue   # nothing to attach to; wait for next reconcile to open a burst

        if cur is None:
            cur = {"start": t, "last": t, "count": 0, "errors": 0,
                   "waited": Counter(), "ready": Counter()}

        cur["last"] = t
        if is_reconcile: cur["count"] += 1
        if is_error:     cur["errors"] += 1
        if wait_m:       cur["waited"][wait_m.group(1)] += 1
        if ready_m:      cur["ready"][ready_m.group(1)] += 1

    if cur:
        done = close(cur)
        if done is not None:
            bursts.append(done)

    return bursts


def main():
    if len(sys.argv) != 4:
        print(__doc__, file=sys.stderr)
        sys.exit(2)
    kind_logs_dir = Path(sys.argv[1])
    ndjson_path = Path(sys.argv[2])
    out_path = Path(sys.argv[3])

    origin, run_end = read_run_window(ndjson_path)
    window_s = run_end - origin

    events_yaml = parse_events_yaml(kind_logs_dir / "all-events.log")
    pod_events = [e for e in extract_pod_restart_events(events_yaml, origin) if 0 <= e["tS"] <= window_s]

    bursts_all = build_reconcile_bursts(kind_logs_dir, origin)
    bursts = [b for b in bursts_all if b["tS"] + b["durS"] >= 0 and b["tS"] <= window_s]

    out = {
        "originEpoch": origin,
        "lanes": [
            {"id": "pods",              "label": "Pod restarts",         "type": "events"},
            {"id": "reconcile_bursts",  "label": "Operator activity",    "type": "bursts"},
        ],
        "events": pod_events,
        "bursts": {"reconcile_bursts": bursts},
    }
    out_path.write_text(json.dumps(out))
    print(f"origin = {origin}", file=sys.stderr)
    print(f"pod events: {len(pod_events)}", file=sys.stderr)
    print(f"reconcile bursts: {len(bursts)} (largest: {max((b['count'] for b in bursts), default=0)} reconciles)", file=sys.stderr)
    print(f"wrote {out_path} ({out_path.stat().st_size} bytes)", file=sys.stderr)


if __name__ == "__main__":
    main()
