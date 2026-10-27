"""Pool relevance candidates for the own gold set, so judging does not lean on one system.

For each query it takes the top 10 of bm25, dense and hybrid, plus the 10 documents that contain the
most of the query's content words (a plain keyword search), and writes one review sheet in Markdown:
each candidate's id, title, which sources found it, and the opening of its text.
The sheet is for reading; the relevance decision is the student's, made after reading the document.

    uv run python scripts/candidates.py OUT.md [--qids c01,h03]
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from p2 import config, corpus as C, retrievers
from p2.runfile import read_queries

STOP = set("a an and are as at be by can do does for from how in into is it its of on or that the this to under using what when which who why with without".split())


def content_words(text: str) -> list[str]:
    return [w for w in dict.fromkeys(re.findall(r"[a-z0-9][a-z0-9-]*", text.lower())) if w not in STOP and len(w) > 2]


def keyword_top(corp, text: str, k: int) -> list[str]:
    words = content_words(text)
    scored = []
    for docid, doc in corp.docs.items():
        low = doc.text.lower()
        hits = sum(1 for w in words if w in low)
        if hits:
            scored.append((-hits, docid))
    return [d for _, d in sorted(scored)[:k]]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("out", type=Path)
    ap.add_argument("--qids", default="")
    ap.add_argument("--words", type=int, default=90, help="words of each document to show")
    args = ap.parse_args()
    cfg = config.load()
    corp = C.load(cfg.root, "own")
    queries, _ = read_queries(cfg.root / "eval" / "own" / "queries.tsv", require_origin=True)
    if args.qids:
        keep = set(args.qids.split(","))
        queries = [q for q in queries if q.qid in keep]
    systems = {name: retrievers.build(name, corp, cfg) for name in ("bm25", "dense", "hybrid")}
    lines = ["# Relevance candidates (own corpus)", "", "Read each candidate, then write `qid 0 docid 1` in eval/own/qrels.txt for the ones you judge relevant.", ""]
    for q in queries:
        found: dict[str, list[str]] = {}
        for name, system in systems.items():
            for rank, (docid, _) in enumerate(system.search(q.text, 10), 1):
                found.setdefault(docid, []).append(f"{name}#{rank}")
        for rank, docid in enumerate(keyword_top(corp, q.text, 10), 1):
            found.setdefault(docid, []).append(f"keyword#{rank}")
        lines += [f"## {q.qid} ({q.cls}, {q.origin}): {q.text}", ""]
        for docid, srcs in sorted(found.items(), key=lambda kv: -len(kv[1])):
            doc = corp.docs[docid]
            body = " ".join(doc.text.split("\n", 1)[-1].split()[: args.words])
            lines += [f"- [ ] `{docid}` **{doc.title}**  ", f"  found by: {', '.join(srcs)}  ", f"  {body} ...", ""]
    args.out.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {args.out} for {len(queries)} queries")


if __name__ == "__main__":
    main()
