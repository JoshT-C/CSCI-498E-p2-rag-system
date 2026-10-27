"""Fetch the own corpus: openly licensed arXiv papers on LLM security (the Sentinel-Weights PRD topics).

Stage 1 asks the arXiv search API for candidate ids, one query per PRD topic.
Stage 2 asks arXiv's OAI-PMH service (arXivRaw) for each candidate's title, abstract and license,
pausing 3 seconds between calls as arXiv asks. A paper is kept only when its own license is
CC BY, CC BY-SA or CC0; NC, ND and arXiv's default non-exclusive license are dropped.
Kept abstracts are written as <id>.md ("# title", blank line, abstract) into OUT/abs-<license>/.
With --full ID ..., the PDFs of those ids (if openly licensed) go to OUT/full-<license>/<id>-full.pdf.

Every reply is saved in OUT/meta.json, so the script can stop and start again.

    uv run python scripts/fetch_arxiv.py ../p2-raw
    uv run python scripts/fetch_arxiv.py ../p2-raw --full 2509.16671 2406.11717
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

SEARCH = "https://export.arxiv.org/api/query?{q}"
OAI = "https://oaipmh.arxiv.org/oai?verb=GetRecord&identifier=oai:arXiv.org:{id}&metadataPrefix=arXivRaw"
PDF = "https://arxiv.org/pdf/{id}"
PAUSE = 3.0
CATS = "(cat:cs.CR OR cat:cs.CL OR cat:cs.LG OR cat:cs.AI OR cat:cs.SE)"

# One search per PRD topic; parts 1-3 are the PRD's three subsystems.
TOPICS = {
    # Part 1: mechanistic weight and circuit auditing
    "refusal-direction": 'abs:"refusal direction"',
    "abliteration": 'abs:abliteration OR abs:abliterated OR abs:"refusal ablation"',
    "safety-neurons": 'abs:"safety neurons" OR abs:"safety heads" OR abs:"safety circuit"',
    "steering": 'abs:"activation steering" AND abs:safety',
    "weight-tamper": 'abs:"harmful fine-tuning" OR abs:"safety alignment" AND abs:"fine-tuning attack"',
    "model-supply-chain": 'abs:"model supply chain" OR abs:"malicious models" OR abs:"model hub"',
    # Part 2: input disentanglement and adversarial prompt detection
    "jailbreak-detect": 'abs:jailbreak AND (abs:detection OR abs:detect OR abs:defense)',
    "adversarial-suffix": 'abs:"adversarial suffix" OR abs:GCG',
    "perplexity-filter": 'abs:perplexity AND abs:jailbreak',
    "backdoor-llm": 'abs:backdoor AND (abs:"language model" OR abs:LLM)',
    "sleeper": 'abs:"sleeper agent" OR abs:"trojan" AND abs:LLM',
    "over-refusal": 'abs:"over-refusal" OR abs:"exaggerated safety" OR abs:"overrefusal"',
    "deception-agents": 'abs:deceptive AND abs:agent AND abs:LLM',
    # Part 3: malware, obfuscation, vulnerability repair, agent security
    "llm-malware": 'abs:malware AND (abs:"language model" OR abs:LLM)',
    "obfuscation": 'abs:obfuscation AND (abs:LLVM OR abs:LLM OR abs:"language model")',
    "vuln-detect": 'abs:"vulnerability detection" AND (abs:LLM OR abs:"language model")',
    "vuln-repair": 'abs:"vulnerability repair" OR abs:"patch generation" AND abs:LLM',
    "prompt-injection": 'abs:"prompt injection"',
    "mcp-security": 'abs:"Model Context Protocol" OR abs:"tool poisoning"',
    "red-teaming": 'abs:"red teaming" AND abs:LLM',
}

OPEN = [
    (re.compile(r"creativecommons\.org/publicdomain/zero/1\.0"), "cc0-1.0"),
    (re.compile(r"creativecommons\.org/licenses/by-sa/4\.0"), "cc-by-sa-4.0"),
    (re.compile(r"creativecommons\.org/licenses/by-sa/3\.0"), "cc-by-sa-3.0"),
    (re.compile(r"creativecommons\.org/licenses/by/4\.0"), "cc-by-4.0"),
    (re.compile(r"creativecommons\.org/licenses/by/3\.0"), "cc-by-3.0"),
]


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "p2-rag-coursework (arXiv fetch for a class project)"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception as exc:  # network hiccup or 503: wait and try again
            print(f"  retry {attempt + 1} after {exc}", file=sys.stderr)
            time.sleep(PAUSE * (attempt + 2))
    raise RuntimeError(f"could not fetch {url}")


def search_ids(query: str, max_results: int) -> list[str]:
    q = urllib.parse.urlencode({"search_query": f"({query}) AND {CATS}", "start": 0, "max_results": max_results, "sortBy": "relevance"})
    root = ET.fromstring(get(SEARCH.format(q=q)))
    ns = {"a": "http://www.w3.org/2005/Atom"}
    ids = []
    for entry in root.findall("a:entry", ns):
        m = re.search(r"abs/([^v]+)(v\d+)?$", entry.findtext("a:id", "", ns))
        if m and re.fullmatch(r"\d{4}\.\d{4,5}", m.group(1)):
            ids.append(m.group(1))
    return ids


def oai_record(arxiv_id: str) -> dict:
    root = ET.fromstring(get(OAI.format(id=arxiv_id)))
    raw = next((el for el in root.iter() if el.tag.endswith("arXivRaw")), None)
    if raw is None:
        return {"missing": True}

    def text(tag):
        el = next((e for e in raw if e.tag.endswith(tag)), None)
        return re.sub(r"\s+", " ", el.text).strip() if el is not None and el.text else ""

    return {"title": text("title"), "abstract": text("abstract"), "license": text("license"), "categories": text("categories")}


def license_id(url: str) -> str | None:
    return next((lid for rx, lid in OPEN if rx.search(url or "")), None)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("out", type=Path)
    ap.add_argument("--per-topic", type=int, default=150)
    ap.add_argument("--full", nargs="*", default=[], help="arXiv ids whose PDFs to fetch as full text")
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    meta_path = args.out / "meta.json"
    meta = json.loads(meta_path.read_text()) if meta_path.exists() else {"topics": {}, "records": {}}

    def save():
        meta_path.write_text(json.dumps(meta, indent=1, sort_keys=True))

    if not args.full:
        for name, query in TOPICS.items():
            if name in meta["topics"]:
                continue
            meta["topics"][name] = search_ids(query, args.per_topic)
            print(f"{name}: {len(meta['topics'][name])} ids", flush=True)
            save()
            time.sleep(PAUSE)
    wanted = list(dict.fromkeys(args.full or [i for ids in meta["topics"].values() for i in ids]))
    todo = [i for i in wanted if i not in meta["records"]]
    print(f"{len(wanted)} candidates, {len(todo)} still to look up (~{len(todo) * PAUSE / 60:.0f} min)", flush=True)
    for n, arxiv_id in enumerate(todo, 1):
        meta["records"][arxiv_id] = oai_record(arxiv_id)
        if n % 25 == 0:
            save()
            print(f"  {n}/{len(todo)}", flush=True)
        time.sleep(PAUSE)
    save()

    kept = 0
    for arxiv_id in wanted:
        rec = meta["records"][arxiv_id]
        lid = license_id(rec.get("license", ""))
        if not lid or not rec.get("abstract"):
            continue
        kept += 1
        if args.full:
            target = args.out / f"full-{lid}" / f"{arxiv_id}-full.pdf"
            if not target.exists():
                target.parent.mkdir(exist_ok=True)
                target.write_bytes(get(PDF.format(id=arxiv_id)))
                time.sleep(PAUSE)
        else:
            target = args.out / f"abs-{lid}" / f"{arxiv_id}.md"
            target.parent.mkdir(exist_ok=True)
            target.write_text(f"# {rec['title']}\n\n{rec['abstract']}\n", encoding="utf-8", newline="\n")
    print(f"kept {kept} of {len(wanted)} (open license and an abstract)")


if __name__ == "__main__":
    main()
