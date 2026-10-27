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
- [x] [C] `scripts/fetch_arxiv.py`: 960 open abstracts harvested; 42 off-topic set aside (no security or repair keyword): arXiv abstracts whose paper license is CC BY / CC BY-SA / CC0 -> `../p2-raw/`
- [x] [C] full-text PDFs: 6 openly licensed PRD references (OR-Bench, CoCoTen, Musaffar, Li, Chu, Campbell); 7 others excluded by license
- [x] [C] ingested: 918 abstracts + 19 full-text parts = 937 docs, ~332k tokens; one 82-word part dropped
- [x] [C→YOU] `p2 license`: 0 fail; 3 flags reviewed by you with quotes; `--online`: arXiv confirms all 937 licenses, 0 mismatches
- [x] [YOU] DECISIONS.md prompt 1, committed before any own-corpus score
- [ ] [YOU] at least 10 `hand` queries in `eval/own/queries.tsv`
- [x] [C] 22 `claude` queries drafted (c01-c22: 7 identifier, 7 mixed, 8 paraphrase)
- [x] [C] `scripts/candidates.py` builds the candidate sheet (bm25, dense, hybrid top 10 + keyword top 10)
- [~] [YOU] relevance rule recorded in EVAL.md section 3 (binary labels: rel 1 only with both semantic and logical value); judgments still to do
- [ ] [C] own runs: `p2 run --all`, rerank trial then ~35 calls (ask first), `p2 score`
- [ ] [YOU] ablation choice + hypothesis in EVAL.md section 5, committed before the run
- [ ] [C] ablation system in `p2/retrievers/`, `--ablation` run, `p2 score`

## Phase 3 - stretch option 3 (cost and latency)
- [x] [C] `rerank_c10` (10 candidates) on shared practice, 20 calls (ask first), `p2 score`
- [ ] [YOU] EVAL.md section 8, the five things

## Phase 4 - analysis and writing
- [ ] [C→YOU] at least 5 failures of the best own system laid out; you sort causes in EVAL.md section 6
- [x] [YOU] EVAL.md prose, all sections (student draft, fact-checked and edited by Claude at the student's request)
- [x] [YOU] DECISIONS.md prompts 2-5 (student draft, fact-checked and edited by Claude at the student's request)
- [ ] [YOU] the 5-10 minute video and the Canvas post

## Phase 5 - submission
- [x] [C] `uv run p2 check --final`: 24 passed, 0 to do, 0 failed
- [ ] [YOU] merge into your default branch / confirm the repo is public
