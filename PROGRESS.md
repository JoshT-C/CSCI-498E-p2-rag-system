# P2 progress tracker

Working checklist for this project (README.md is the brief). Owner: **[C]** Claude Code builds or runs it, **[YOU]** the student writes or decides it, **[C→YOU]** Claude prepares evidence and the student decides.
Every batch of Claude calls is announced with its count, tried on 2 items first, and run in full only after the student says yes.

## Phase 0 - setup
- [x] [C] branch `claude/laughing-volta-shhqep`, `uv sync`, baseline `p2 check` (0 FAIL)
- [x] [C] pushing to `dev` (never main); CI: check the Actions tab

## Phase 1 - shared corpus (30 CFR)
- [x] [C] `dense` (bge-small-en-v1.5, `[dense]` in p2.toml)
- [x] [C] `hybrid` (RRF k=60 of bm25 + dense, full rankings, chunk fusion too)
- [x] [C] `rerank` (Claude reorders hybrid's top 20; falls back to hybrid order on a bad reply)
- [x] [C] `p2 run --all` (bm25, dense, hybrid on practice + test)
- [x] [C] rerank 2-query trial, then 60 calls on practice + test (ask first)
- [x] [C] `p2 score`
- [x] [C] answers: trial `--only a01,a09`, then all 12 with rerank (24 calls, ask first), `p2 verify`
- [ ] [YOU] EVAL.md section 1 prose (systems, what the intervals let you claim)
- [ ] [YOU] EVAL.md section 2 prose (answer choice, your audit of 3 verified answers)

## Phase 2 - own corpus (LLM security, the Sentinel-Weights PRD topics)
- [~] [C] `scripts/fetch_arxiv.py` (running): arXiv abstracts whose paper license is CC BY / CC BY-SA / CC0 -> `../p2-raw/`
- [x] [C] full-text PDFs: 6 openly licensed PRD references (OR-Bench, CoCoTen, Musaffar, Li, Chu, Campbell); 7 others excluded by license
- [ ] [C] `p2 ingest` per license batch; full text with `--part-pages 5`; read INGEST.md
- [ ] [C→YOU] `p2 license` (and `--online`); any FLAG walked through the license-check skill, you decide
- [ ] [YOU] DECISIONS.md prompt 1, committed before the first own-corpus `p2 score`
- [ ] [YOU] at least 10 `hand` queries in `eval/own/queries.tsv`
- [ ] [C] about 22 `claude` queries drafted
- [ ] [C] candidate sheets (top 10 of bm25/dense/hybrid + keyword hits) per query
- [ ] [YOU] relevance judgments (you read each candidate) and the relevance rule in EVAL.md section 3
- [ ] [C] own runs: `p2 run --all`, rerank trial then ~35 calls (ask first), `p2 score`
- [ ] [YOU] ablation choice + hypothesis in EVAL.md section 5, committed before the run
- [ ] [C] ablation system in `p2/retrievers/`, `--ablation` run, `p2 score`

## Phase 3 - stretch option 3 (cost and latency)
- [x] [C] `rerank_c10` (10 candidates) on shared practice, 20 calls (ask first), `p2 score`
- [ ] [YOU] EVAL.md section 8, the five things

## Phase 4 - analysis and writing
- [ ] [C→YOU] at least 5 failures of the best own system laid out; you sort causes in EVAL.md section 6
- [ ] [YOU] EVAL.md sections 3, 4, 7 prose
- [ ] [YOU] DECISIONS.md prompts 2-5
- [ ] [YOU] the 5-10 minute video and the Canvas post

## Phase 5 - submission
- [ ] [C] `uv run p2 check --final` clean, final push
- [ ] [YOU] merge into your default branch / confirm the repo is public
