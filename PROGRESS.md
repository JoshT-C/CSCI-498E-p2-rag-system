# P2 progress tracker

Working checklist for this project (README.md is the brief). Owner: **[C]** Claude Code builds or runs it, **[YOU]** the student writes or decides it.
All work is on the `dev` branch; `main` gets it by a merge the student makes.

## Stage 1 - shared corpus (30 CFR)
- [x] [C] `dense` (bge-small-en-v1.5), `hybrid` (RRF k=60 of bm25 + dense), `rerank` (Claude reorders hybrid's top 20)
- [x] [C] runs of all four systems on practice (20) and test (40), rerank traces committed
- [x] [C] cited answers with rerank: 8/8 verified, 4/4 declined
- [x] [YOU] EVAL.md sections 1 and 2

## Stage 2 - own corpus (LLM security, the Sentinel-Weights PRD topics)
- [x] [C] 918 openly licensed arXiv abstracts + 19 full-text parts of 6 PRD references = 937 documents, ~332k tokens
- [x] [YOU] license review: 0 fail, 3 flags reviewed with quotes; online check matched all 937
- [x] [YOU] DECISIONS.md prompt 1, committed before any own-corpus score
- [x] [YOU] 12 hand queries; [C] 22 claude queries drafted
- [x] [YOU] relevance rule and 84 judgments (6 added after an independent review)
- [x] [C] own runs of all four systems, scored
- [x] [YOU] ablation hypothesis, committed before the run; [C] `dense_potion` run and scored

## Stretch - option 3 (cost and latency)
- [x] [C] `rerank_c10` on shared practice with its trace; `stretch-cost` table
- [x] [YOU] EVAL.md section 8, the five things

## Analysis and writing
- [x] [YOU] EVAL.md sections 3 to 8, DECISIONS.md prompts 2 to 5
- [x] [C] independent adversarial review; its findings resolved
- [ ] [YOU] the 5-10 minute video and the Canvas post

## Submission
- [x] [C] `uv run p2 check --final` clean on `dev`
- [ ] [YOU] merge `dev` into `main`, confirm CI is green on `main`, post the repo URL
