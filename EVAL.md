# Evaluation report

This is the report on what you built and what the numbers let you claim.
Two kinds of text live here.

The tables between a `p2:begin` comment line and its matching `p2:end` comment line are written by `uv run p2 score` from your committed run files and answers files.
Please do not edit anything between those two lines, because `uv run p2 check` recomputes them and fails when they differ.
A table that says no runs or answers exist yet is waiting for data; run `uv run p2 score` after you commit the files it needs.

Everything else is yours.
Each prompt ends with a marker line that you replace with your own writing; `uv run p2 check --final` fails while one is left.
Write what you measured, including what did not work.
What I read for is whether each claim matches its interval, not whether the result is good news.

Words used below: recall@10, MRR@10 and nDCG@10 are the three scores, each averaged over the queries of a set; step 7 of stage 1 in the README defines them, and lecture 14 goes deeper.
A paired interval is the 95% interval of the mean difference between two systems on the same queries, found by resampling the queries 10,000 times.
When an interval includes zero, the gold set cannot tell the two systems apart, and the right words are "not distinguishable on this gold set".
The minimum detectable difference is the smallest gap this many queries could reliably show, so a difference below it is invisible to this gold set, not absent.

---

## 1. Stage 1 - the shared corpus (30 CFR Chapter I)

### What you built

For each of `dense`, `hybrid` and `rerank`, one or two sentences: the embedding model, how documents were chunked, what was fused and how, how many candidates the reranker saw, and anything you changed from the 12 and 13 lab code.

`bm25` and `dense` split each document into 300-word chunks that overlap by 50 words (`[chunking]` in `p2.toml`), and a document scores as high as its best chunk.
`bm25` is the provided keyword baseline (`k1 = 0.9`, `b = 0.4`, the `"codes"` tokenizer, which keeps section numbers such as `75.403` whole).
`dense` (`p2/retrievers/dense.py`) turns every chunk and every query into a vector with the `BAAI/bge-small-en-v1.5` embedding model and ranks chunks by cosine similarity.
`hybrid` (`p2/retrievers/hybrid.py`) merges the full document rankings of `bm25` and `dense` with reciprocal rank fusion: each document scores the sum of 1 / (60 + its rank) in each list.
`rerank` (`p2/retrievers/rerank.py`) takes `hybrid`'s top 20 documents, shows Claude (Sonnet, the `sonnet` setting in `p2.toml`) the first 300 words of each document, and asks for them back in order from most to least relevant; if the reply is not a valid ordering of all 20, it keeps `hybrid`'s order. Because it sees only each document's first 300 words, it can miss relevant text further into a long document.

### Practice queries (20)

Scores per system.

<!-- p2:begin shared-practice -->
| System | Recall@10 | MRR@10 | nDCG@10 |
| --- | ---: | ---: | ---: |
| bm25 | 0.625 | 0.507 | 0.518 |
| dense | 0.558 | 0.562 | 0.480 |
| hybrid | 0.592 | 0.471 | 0.443 |
| rerank | 0.733 | 0.800 | 0.743 |
| rerank_c10 | 0.592 | 0.664 | 0.586 |

20 judged queries; nDCG uses binary labels; a random ranking of the 2,484 documents would get recall@10 near 0.004.
<!-- p2:end shared-practice -->

The same scores per query class.

<!-- p2:begin shared-practice-classes -->
| System | Metric | identifier (n=7) | paraphrase (n=7) | mixed (n=6) |
| --- | --- | ---: | ---: | ---: |
| bm25 | Recall@10 | 1.000 | 0.000 | 0.917 |
| bm25 | MRR@10 | 0.810 | 0.000 | 0.746 |
| bm25 | nDCG@10 | 0.857 | 0.000 | 0.728 |
| dense | Recall@10 | 0.214 | 0.595 | 0.917 |
| dense | MRR@10 | 0.333 | 0.714 | 0.653 |
| dense | nDCG@10 | 0.211 | 0.593 | 0.661 |
| hybrid | Recall@10 | 0.500 | 0.405 | 0.917 |
| hybrid | MRR@10 | 0.514 | 0.152 | 0.792 |
| hybrid | nDCG@10 | 0.397 | 0.202 | 0.779 |
| rerank | Recall@10 | 0.643 | 0.595 | 1.000 |
| rerank | MRR@10 | 0.714 | 0.714 | 1.000 |
| rerank | nDCG@10 | 0.641 | 0.626 | 1.000 |
| rerank_c10 | Recall@10 | 0.500 | 0.405 | 0.917 |
| rerank_c10 | MRR@10 | 0.468 | 0.571 | 1.000 |
| rerank_c10 | nDCG@10 | 0.431 | 0.440 | 0.936 |
<!-- p2:end shared-practice-classes -->

Differences between every pair of systems, each with its paired interval and the minimum detectable difference.

<!-- p2:begin shared-practice-pairs -->
| Comparison | Metric | Mean difference | 95% interval | MDD | Reading |
| --- | --- | ---: | ---: | ---: | --- |
| dense minus bm25 | Recall@10 | -0.067 | [-0.350, +0.225] | 0.415 | not distinguishable |
| dense minus bm25 | MRR@10 | +0.055 | [-0.225, +0.343] | 0.412 | not distinguishable |
| dense minus bm25 | nDCG@10 | -0.039 | [-0.302, +0.231] | 0.385 | not distinguishable |
| hybrid minus bm25 | Recall@10 | -0.033 | [-0.250, +0.192] | 0.324 | not distinguishable |
| hybrid minus bm25 | MRR@10 | -0.037 | [-0.178, +0.083] | 0.192 | not distinguishable |
| hybrid minus bm25 | nDCG@10 | -0.075 | [-0.238, +0.075] | 0.228 | not distinguishable |
| hybrid minus dense | Recall@10 | +0.033 | [-0.125, +0.192] | 0.231 | not distinguishable |
| hybrid minus dense | MRR@10 | -0.092 | [-0.306, +0.109] | 0.301 | not distinguishable |
| hybrid minus dense | nDCG@10 | -0.036 | [-0.200, +0.113] | 0.227 | not distinguishable |
| rerank minus bm25 | Recall@10 | +0.108 | [-0.133, +0.350] | 0.351 | not distinguishable |
| rerank minus bm25 | MRR@10 | +0.293 | [+0.043, +0.533] | 0.353 | rerank higher |
| rerank minus bm25 | nDCG@10 | +0.225 | [-0.011, +0.451] | 0.336 | not distinguishable |
| rerank minus dense | Recall@10 | +0.175 | [+0.033, +0.333] | 0.221 | rerank higher |
| rerank minus dense | MRR@10 | +0.237 | [+0.083, +0.408] | 0.239 | rerank higher |
| rerank minus dense | nDCG@10 | +0.264 | [+0.128, +0.413] | 0.210 | rerank higher |
| rerank minus hybrid | Recall@10 | +0.142 | [+0.050, +0.258] | 0.160 | rerank higher |
| rerank minus hybrid | MRR@10 | +0.329 | [+0.164, +0.504] | 0.247 | rerank higher |
| rerank minus hybrid | nDCG@10 | +0.300 | [+0.176, +0.430] | 0.186 | rerank higher |
| rerank_c10 minus bm25 | Recall@10 | -0.033 | [-0.250, +0.192] | 0.324 | not distinguishable |
| rerank_c10 minus bm25 | MRR@10 | +0.157 | [-0.129, +0.427] | 0.400 | not distinguishable |
| rerank_c10 minus bm25 | nDCG@10 | +0.067 | [-0.185, +0.310] | 0.356 | not distinguishable |
| rerank_c10 minus dense | Recall@10 | +0.033 | [-0.125, +0.192] | 0.231 | not distinguishable |
| rerank_c10 minus dense | MRR@10 | +0.101 | [-0.111, +0.304] | 0.305 | not distinguishable |
| rerank_c10 minus dense | nDCG@10 | +0.106 | [-0.071, +0.276] | 0.253 | not distinguishable |
| rerank_c10 minus hybrid | Recall@10 | +0.000 | [+0.000, +0.000] | - | identical on every query |
| rerank_c10 minus hybrid | MRR@10 | +0.193 | [-0.008, +0.391] | 0.288 | not distinguishable |
| rerank_c10 minus hybrid | nDCG@10 | +0.142 | [+0.020, +0.267] | 0.178 | rerank_c10 higher |
| rerank_c10 minus rerank | Recall@10 | -0.142 | [-0.258, -0.050] | 0.160 | rerank higher |
| rerank_c10 minus rerank | MRR@10 | -0.136 | [-0.286, +0.000] | 0.209 | not distinguishable |
| rerank_c10 minus rerank | nDCG@10 | -0.158 | [-0.279, -0.054] | 0.163 | rerank higher |

The interval is a paired bootstrap (10,000 resamples of the queries); MDD is the smallest difference this many queries detect 80% of the time. Two systems that score the same on every query have no interval to speak of, so their MDD is shown as -.
<!-- p2:end shared-practice-pairs -->

The 40 test queries have no answer key in this repo.
Your test run files are scored by the course and the score comes back to you as feedback, so nothing goes here for them.

### What the intervals let you claim

Which differences are distinguishable from zero and which are not?
What is the minimum detectable difference at 20 queries, and what does that say about any gap smaller than it?
Which claim from lecture 12 or 13 did your numbers support, and which did they leave open?

On the 20 practice queries (`shared-practice-pairs`), `bm25`, `dense` and `hybrid` are **not distinguishable on this gold set**: every interval between those three crosses zero.
For example, on nDCG@10, `dense` minus `bm25` is -0.039 [-0.302, +0.231], `hybrid` minus `bm25` is -0.075 [-0.238, +0.075], and `hybrid` minus `dense` is -0.036 [-0.200, +0.113].
With only 20 queries, the minimum detectable difference (MDD) for those pairs is 0.192 to 0.415, so gaps of 3 to 9 points like these are far too small for this gold set to see.

`rerank` (0.800 MRR@10, 0.743 nDCG@10, 0.733 Recall@10) is **reliably better** than both `dense` and `hybrid` on all three metrics; for example, on nDCG@10 it is +0.264 [+0.128, +0.413] over `dense` and +0.300 [+0.176, +0.430] over `hybrid`.
Against `bm25` it is reliably better on MRR@10 (+0.293 [+0.043, +0.533]), but its nDCG@10 lead (+0.225 [-0.011, +0.451]) and its Recall@10 lead (+0.108 [-0.133, +0.350]) are not distinguishable.
Giving the reranker 20 candidates instead of 10 matters: `rerank` beats `rerank_c10` on Recall@10 (+0.142 [+0.050, +0.258]) and nDCG@10 (+0.158 [+0.054, +0.279]), because a relevant section at ranks 11 to 20 of `hybrid` never reaches `rerank_c10` at all.

This is in line with what lectures 12 and 13 claimed, with one caution: the per-class numbers are means over only 6 or 7 queries, with no interval. On those class means, keyword search did best on exact identifier lookups (`bm25` Recall@10 1.000 on the 7 identifier queries, against 0.214 for `dense`) and embeddings did far better than keyword search on reworded questions (`bm25` scores 0.000 on all 7 paraphrase queries, `dense` 0.595 Recall@10, with `rerank` level with `dense` there on Recall@10 and MRR@10). The reranker's gain over `dense` and `hybrid` is the one claim here with intervals behind it.
It leaves open whether `hybrid` beats either of its two parts, because 20 queries cannot separate gaps that small.

---

## 2. Stage 1 - cited answers on the 12 shared questions

<!-- p2:begin answers -->
| Label | System | Verified (in) | 95% interval | not_found (in) | Declined (out) | 95% interval | Quotes found |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| rerank | rerank | 8 of 8 (100%) | [0.676, 1.000] | 0 of 8 (0%) | 4 of 4 (100%) | [0.510, 1.000] | 12 of 12 |
<!-- p2:end answers -->

Which system answered, and why that one?
What did you change in `prompts/answer.txt`, if anything, and did the verified share or the declined share move?

Then read three in-corpus answers that `uv run p2 verify` passed.
For each one, open the cited chunk and say whether the quote really supports the claim next to it.
The check proves a quote is a real piece of the chunk and cannot prove that it supports the claim, so this reading is the part only you can do.

I answered with `rerank` (it reranks `hybrid`'s top 20 and passes the top 5 chunks to the answer step) because it had the best Recall@10 (0.733), MRR@10 (0.800) and nDCG@10 (0.743) on the practice queries, which gives the answer step the best chance of having the right section among its 5 chunks.
I left `prompts/answer.txt` unchanged (`prompt_sha256` 4418806497c799a1): it tells the model to answer only from the chunks, to give a chunk id and a word-for-word quote for every claim, and to set `not_found` when the chunks do not answer the question.
The result (`answers/shared/rerank.json`) was 8 of 8 in-corpus answers verified (95% interval [0.676, 1.000], none marked `not_found`), 4 of 4 out-of-corpus questions declined ([0.510, 1.000]), and 12 of 12 quotes found in the chunks they cite.

**Three-answer audit.** I opened the cited chunk for each of these and checked whether the quote really supports the claim.

1. **a01** (minutes to call MSHA after a fatal accident). The answer was "Within 15 minutes ... once it knows or should know that an accident involving a death has occurred." It cites `cfr30-50.10#0` with two quotes: "The operator shall immediately contact MSHA at once without delay and within 15 minutes at the toll-free number, 1-800-746-1553, once the operator knows or should know that an accident has occurred involving:" and "(a) A death of an individual at the mine;". The section lists the accidents that the 15-minute rule applies to, and item (a) is a death at the mine, so the quotes support the claim.
2. **a02** (minimum incombustible content of combined dust with no methane). The answer was "not less than 80 percent where no methane is present. Methane raises that figure." It cites `cfr30-75.403#0`: "maintained in such quantities that the incombustible content of the combined coal dust, rock dust, and other dust shall be not less than 80 percent." and "Where methane is present in any ventilating current, the percent of incombustible content of such combined dust shall be increased 0.4 percent for each 0.1 percent of methane." Section 75.403 states exactly this: 80 percent is the base rule, and it rises only when methane is present.
3. **a03** (how long a self-rescue device must protect a miner). The answer was "The device must be adequate to protect the person for 1 hour or longer." It cites `cfr30-75.1714#0`: "an approved self-rescue device or devices which is adequate to protect such person for 1 hour or longer." Section 75.1714 requires the operator to give every underground miner such a device, so the quote supports the claim directly.

---

## 3. Stage 2 - your corpus and your gold set

### The corpus

What is it, where did it come from, how many documents and how many megabytes, and what is the license basis for publishing it?
Name the one or two documents you were least sure about and what you decided.
Say which of the allowed sources in the brief it comes from.

My corpus (`corpora/own/`) is about LLM security, the topics of my Sentinel-Weights PRD: refusal removal ("abliteration") and safety circuits, jailbreak and adversarial-prompt detection, backdoors and sleeper models, LLM malware and code obfuscation, vulnerability detection and repair, and prompt injection.
It comes from the brief's allowed source of openly licensed arXiv papers.
`scripts/fetch_arxiv.py` searched arXiv by topic and kept only papers whose own license is CC BY, CC BY-SA or CC0, which gave 960 abstracts; I set aside 42 that had no security or repair keyword, which left 918. A keyword filter is coarse, so a few off-topic abstracts remain (for example `2510.02567`, on additive manufacturing).
To those I added 19 full-text documents from 6 openly licensed papers that my PRD cites (OR-Bench `2405.20947`, CoCoTen `2508.02997`, `2603.01246`, `2603.20976`, `2607.05842` and `2609.00051`), split into 5-page parts except CoCoTen, which is short enough to stay one whole document; one 82-word leftover part was dropped.
Seven other papers the PRD cites could not go in: six carry only arXiv's default license, which does not allow redistribution, and one (Alon and Kamfonas) is CC BY-NC-SA, which the brief does not allow. I also left out one CC0 reference that is off-topic.
In all, the corpus has 937 documents, 1.9 MB of text, about 236,874 words (about 331,623 estimated tokens).
Every document is CC BY 4.0, CC BY-SA 4.0 or CC0 1.0, and `uv run p2 license --online` confirmed all 937 against arXiv's own records with no mismatches (`LICENSES.md`).

The three documents I was least sure about were the ones the license check flagged.
`2405.20947-full__p001-005` (OR-Bench) has an ICML line, "Copyright 2025 by the author(s)", and `2508.02997-full` (CoCoTen) has an ACM line, "© 2025 Copyright held by the owner/author(s)"; in both, the authors hold the copyright, and arXiv lists the paper as CC BY 4.0 (CoCoTen's own text also says "This work is licensed under a Creative Commons Attribution 4.0 International License").
`2603.20976-full__p006-010` was flagged because "Springer" appears, but only inside a reference to another paper, and arXiv lists this paper as CC BY 4.0.
I kept all three and recorded the quote and the source for each in the `notes` column of `corpora/own/manifest.tsv`, which `LICENSES.md` repeats.

### The gold set

How many queries, how many with origin `hand` and how many with origin `claude`, and which query classes did you use and why?
How did you decide that a document is relevant: write your relevance rule in two or three sentences, the way the brief does for the shared corpus.
How did you find candidates (the systems' top 10, a keyword search, reading), and did you read every document before you labeled it?
Your labels are binary (`rel` 1) unless you say otherwise: if you use graded labels, declare the scale here, for example 2 means the document answers the query fully and 1 means it helps.

Relevance rule: Relevance is judged on two things. 1. Semantic value: how much the document contributes to answering the user's query. 2. Logical value: how accurately the document answers the user's question; a document that is on topic but does not actually answer the question has no value.

Labels are binary: a document is relevant (`rel` 1) only when it has both semantic value and logical value.

The gold set (`eval/own/queries.tsv`, `eval/own/qrels.txt`) has 34 queries, 12 that I wrote (`hand`) and 22 that Claude drafted (`claude`), with 94 relevance judgments.
I used three classes so that the per-class scores test different kinds of search:
- `identifier` (11 queries: 4 hand, 7 claude) name a specific tool, dataset or benchmark, such as XSTest, OR-Bench, TrojLLM, ZeroLeak or K-ASTRO;
- `mixed` (11 queries: 4 hand, 7 claude) combine technical terms with an ordinary question, such as which attention heads control safety, or bit-flip attacks during training;
- `paraphrase` (12 queries: 4 hand, 8 claude) describe an attack or defense in everyday words without the paper's own term, such as "turning off a model's tendency to say no by editing one internal direction".

To find candidates, `scripts/candidates.py` pooled the top 10 of `bm25`, `dense` and `hybrid` with the top 10 of a plain keyword search into one review sheet, and I read every candidate before labeling it.
When a paper appears both as its abstract and as full-text parts, I judged each document on its own text.
Over two rounds of independent review of the gold set, I re-judged eight queries (c08, c13, c15, c16, c17, c20, c21 and c22) and added 16 relevant documents that I had first missed, to seven of them (c13 stayed as it was), which took the gold set from 78 to 94 judgments.
In the second round I judged each candidate on the document alone, whichever system had found it.
Many of my `hand` queries reuse much of their target paper's title: in somewhere between 4 and 8 of the 12 (depending on how the overlap is counted), at least 60% of the title's content words appear in the query (for example `h03` and PoisonPrompt), so they are close to known-item lookups. Whether that helped `bm25` on them, this gold set cannot tell: `bm25`'s lead over `dense` was lower on the hand queries, but the interval of that difference includes zero (see `own-origins` in section 4).
All four systems score 1.000 MRR@10 on the 11 identifier queries, so that third of the gold set cannot tell the systems apart.

---

## 4. Stage 2 - results on your corpus

Scores per system on your gold set.

<!-- p2:begin own -->
| System | Recall@10 | MRR@10 | nDCG@10 |
| --- | ---: | ---: | ---: |
| bm25 | 0.738 | 0.772 | 0.722 |
| dense | 0.795 | 0.873 | 0.798 |
| hybrid | 0.833 | 0.847 | 0.805 |
| rerank | 0.890 | 0.956 | 0.892 |
| ablation/dense_potion | 0.757 | 0.806 | 0.728 |

34 judged queries; nDCG uses binary labels; a random ranking of the 937 documents would get recall@10 near 0.011.
<!-- p2:end own -->

The same scores per query class.

<!-- p2:begin own-classes -->
| System | Metric | identifier (n=11) | mixed (n=11) | paraphrase (n=12) |
| --- | --- | ---: | ---: | ---: |
| bm25 | Recall@10 | 1.000 | 0.832 | 0.412 |
| bm25 | MRR@10 | 1.000 | 0.886 | 0.457 |
| bm25 | nDCG@10 | 1.000 | 0.824 | 0.374 |
| dense | Recall@10 | 1.000 | 0.827 | 0.579 |
| dense | MRR@10 | 1.000 | 0.924 | 0.708 |
| dense | nDCG@10 | 0.997 | 0.826 | 0.589 |
| hybrid | Recall@10 | 1.000 | 0.845 | 0.670 |
| hybrid | MRR@10 | 1.000 | 0.932 | 0.628 |
| hybrid | nDCG@10 | 1.000 | 0.850 | 0.584 |
| rerank | Recall@10 | 1.000 | 0.917 | 0.764 |
| rerank | MRR@10 | 1.000 | 0.955 | 0.917 |
| rerank | nDCG@10 | 1.000 | 0.902 | 0.783 |
| ablation/dense_potion | Recall@10 | 0.987 | 0.802 | 0.504 |
| ablation/dense_potion | MRR@10 | 1.000 | 0.882 | 0.559 |
| ablation/dense_potion | nDCG@10 | 0.989 | 0.771 | 0.450 |
<!-- p2:end own-classes -->

The same scores for the queries you wrote yourself (`hand`) and the ones a model drafted (`claude`), with the difference between the two groups and its interval.
Once both groups have queries, the table also says whether `bm25`'s lead over `dense` differs between them, and what share of each query's content words its best relevant document contains, which is stretch option 6.

<!-- p2:begin own-origins -->
| System | Metric | hand (n=12) | claude (n=22) | hand minus claude | 95% interval | Reading |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| bm25 | Recall@10 | 0.875 | 0.664 | +0.211 | [-0.028, +0.430] | not distinguishable |
| bm25 | MRR@10 | 0.850 | 0.729 | +0.121 | [-0.147, +0.367] | not distinguishable |
| bm25 | nDCG@10 | 0.853 | 0.651 | +0.202 | [-0.055, +0.441] | not distinguishable |
| dense | Recall@10 | 0.958 | 0.707 | +0.252 | [+0.083, +0.422] | hand higher |
| dense | MRR@10 | 1.000 | 0.803 | +0.197 | [+0.068, +0.356] | hand higher |
| dense | nDCG@10 | 0.965 | 0.706 | +0.259 | [+0.109, +0.413] | hand higher |
| hybrid | Recall@10 | 1.000 | 0.742 | +0.258 | [+0.115, +0.417] | hand higher |
| hybrid | MRR@10 | 0.958 | 0.786 | +0.173 | [+0.008, +0.347] | hand higher |
| hybrid | nDCG@10 | 0.955 | 0.723 | +0.232 | [+0.079, +0.398] | hand higher |
| rerank | Recall@10 | 1.000 | 0.829 | +0.171 | [+0.060, +0.304] | hand higher |
| rerank | MRR@10 | 1.000 | 0.932 | +0.068 | [+0.000, +0.182] | not distinguishable |
| rerank | nDCG@10 | 0.999 | 0.833 | +0.166 | [+0.066, +0.286] | hand higher |
| ablation/dense_potion | Recall@10 | 0.875 | 0.692 | +0.183 | [-0.024, +0.386] | not distinguishable |
| ablation/dense_potion | MRR@10 | 0.871 | 0.771 | +0.100 | [-0.133, +0.328] | not distinguishable |
| ablation/dense_potion | nDCG@10 | 0.822 | 0.677 | +0.144 | [-0.064, +0.350] | not distinguishable |

The hand and claude queries are different queries, so the interval of hand minus claude comes from resampling the queries within each group (10,000 times), not from pairing them.

Do model-written queries favor keyword search? bm25's lead over dense (bm25 minus dense, per query) on the claude queries and on the hand queries, and claude minus hand:

| Metric | Lead on claude | Lead on hand | Claude minus hand | 95% interval | Reading |
| --- | ---: | ---: | ---: | ---: | --- |
| Recall@10 | -0.043 | -0.083 | +0.041 | [-0.106, +0.241] | not distinguishable |
| MRR@10 | -0.074 | -0.150 | +0.076 | [-0.125, +0.311] | not distinguishable |
| nDCG@10 | -0.056 | -0.112 | +0.056 | [-0.094, +0.256] | not distinguishable |

Mean content-word overlap, the share of a query's content words found in its best relevant document: hand 0.79 (12 queries), claude 0.76 (22 queries).

Stretch option 6 asks for at least 20 judged queries of each origin; here there are 12 hand and 22 claude.
<!-- p2:end own-origins -->

Differences between every pair of systems.

<!-- p2:begin own-pairs -->
| Comparison | Metric | Mean difference | 95% interval | MDD | Reading |
| --- | --- | ---: | ---: | ---: | --- |
| dense minus bm25 | Recall@10 | +0.057 | [-0.013, +0.141] | 0.113 | not distinguishable |
| dense minus bm25 | MRR@10 | +0.101 | [+0.008, +0.206] | 0.146 | dense higher |
| dense minus bm25 | nDCG@10 | +0.076 | [+0.008, +0.157] | 0.111 | dense higher |
| hybrid minus bm25 | Recall@10 | +0.095 | [+0.032, +0.174] | 0.104 | hybrid higher |
| hybrid minus bm25 | MRR@10 | +0.075 | [+0.020, +0.141] | 0.090 | hybrid higher |
| hybrid minus bm25 | nDCG@10 | +0.083 | [+0.030, +0.144] | 0.084 | hybrid higher |
| hybrid minus dense | Recall@10 | +0.038 | [-0.012, +0.093] | 0.076 | not distinguishable |
| hybrid minus dense | MRR@10 | -0.026 | [-0.092, +0.029] | 0.090 | not distinguishable |
| hybrid minus dense | nDCG@10 | +0.007 | [-0.040, +0.052] | 0.066 | not distinguishable |
| rerank minus bm25 | Recall@10 | +0.151 | [+0.073, +0.238] | 0.121 | rerank higher |
| rerank minus bm25 | MRR@10 | +0.184 | [+0.072, +0.311] | 0.173 | rerank higher |
| rerank minus bm25 | nDCG@10 | +0.170 | [+0.084, +0.264] | 0.132 | rerank higher |
| rerank minus dense | Recall@10 | +0.094 | [+0.027, +0.167] | 0.101 | rerank higher |
| rerank minus dense | MRR@10 | +0.083 | [+0.015, +0.167] | 0.107 | rerank higher |
| rerank minus dense | nDCG@10 | +0.094 | [+0.042, +0.156] | 0.082 | rerank higher |
| rerank minus hybrid | Recall@10 | +0.056 | [+0.015, +0.107] | 0.066 | rerank higher |
| rerank minus hybrid | MRR@10 | +0.109 | [+0.029, +0.203] | 0.125 | rerank higher |
| rerank minus hybrid | nDCG@10 | +0.087 | [+0.041, +0.142] | 0.072 | rerank higher |
| ablation/dense_potion minus bm25 | Recall@10 | +0.018 | [-0.067, +0.113] | 0.130 | not distinguishable |
| ablation/dense_potion minus bm25 | MRR@10 | +0.034 | [-0.041, +0.109] | 0.107 | not distinguishable |
| ablation/dense_potion minus bm25 | nDCG@10 | +0.006 | [-0.065, +0.073] | 0.101 | not distinguishable |
| ablation/dense_potion minus dense | Recall@10 | -0.039 | [-0.105, +0.020] | 0.093 | not distinguishable |
| ablation/dense_potion minus dense | MRR@10 | -0.066 | [-0.163, +0.018] | 0.134 | not distinguishable |
| ablation/dense_potion minus dense | nDCG@10 | -0.069 | [-0.142, -0.004] | 0.104 | dense higher |
| ablation/dense_potion minus hybrid | Recall@10 | -0.077 | [-0.155, -0.001] | 0.111 | hybrid higher |
| ablation/dense_potion minus hybrid | MRR@10 | -0.040 | [-0.100, +0.003] | 0.076 | not distinguishable |
| ablation/dense_potion minus hybrid | nDCG@10 | -0.076 | [-0.140, -0.018] | 0.089 | hybrid higher |
| ablation/dense_potion minus rerank | Recall@10 | -0.133 | [-0.222, -0.045] | 0.128 | rerank higher |
| ablation/dense_potion minus rerank | MRR@10 | -0.150 | [-0.267, -0.049] | 0.160 | rerank higher |
| ablation/dense_potion minus rerank | nDCG@10 | -0.163 | [-0.247, -0.086] | 0.118 | rerank higher |

The interval is a paired bootstrap (10,000 resamples of the queries); MDD is the smallest difference this many queries detect 80% of the time.
<!-- p2:end own-pairs -->

Which differences are distinguishable and which are not, at your gold-set size?
Do the `hand` queries and the `claude` queries tell the same story?
Did your prediction in `DECISIONS.md` prompt 1 hold?

On my 34 queries (`own-pairs`), `dense` (0.873 MRR@10, 0.798 nDCG@10) is **reliably better than `bm25`** (0.772 MRR@10, 0.722 nDCG@10) on MRR@10 (+0.101 [+0.008, +0.206], MDD 0.146) and nDCG@10 (+0.076 [+0.008, +0.157], MDD 0.111), but not distinguishable on Recall@10 (+0.057 [-0.013, +0.141]).
`hybrid` (0.833 Recall@10, 0.847 MRR@10, 0.805 nDCG@10) is reliably better than `bm25` on all three metrics, for example +0.075 [+0.020, +0.141] on MRR@10.
`hybrid` and `dense` are **not distinguishable** on any metric (MRR@10 -0.026 [-0.092, +0.029]; nDCG@10 +0.007 [-0.040, +0.052], MDD 0.066).
`rerank` (0.890 Recall@10, 0.956 MRR@10, 0.892 nDCG@10) is **reliably better than all three** on every metric; over `hybrid` it is +0.056 [+0.015, +0.107] on Recall@10, +0.109 [+0.029, +0.203] on MRR@10 and +0.087 [+0.041, +0.142] on nDCG@10.
The MRR@10 lead over `hybrid` depends on my re-judging: with my original 78 judgments, `rerank` minus `hybrid` on MRR@10 was +0.071 [-0.007, +0.162], not distinguishable. In the first round of re-judging, five of the six documents I added were ones `rerank` itself had ranked in its top 5, so that round was not blind to the systems; in the second round I judged candidates that the other systems had also found (seven of the ten added documents were also in the top 10 of `bm25`, `dense` or `hybrid`), but nine of the ten were in `rerank`'s own top 10, so that round also came mostly from documents `rerank` ranked high. This result should be read with that in mind.

On the `hand` and `claude` queries separately, every system has a higher mean on my `hand` queries.
That gap is distinguishable for `dense` and `hybrid` on all three metrics and for `rerank` on Recall@10 and nDCG@10 (for example +0.166 [+0.066, +0.286] nDCG@10 for `rerank`), but not for `bm25`, and not for `rerank` on MRR@10 (+0.068 [+0.000, +0.182]).
My queries share slightly more words with their target documents (content-word overlap 0.79 against 0.76).
`bm25`'s lead over `dense` is negative in both groups (-0.056 nDCG@10 on the claude queries, -0.112 on the hand queries), and the difference between the groups (+0.056 [-0.094, +0.256]) is not distinguishable, so this gold set cannot tell whether who wrote the queries changes the comparison.

So **my prediction in `DECISIONS.md` prompt 1 was wrong** on this gold set: I expected `bm25` to win because security papers use very specific terms, and it came last.
The class means suggest why, though they are means over 11 or 12 queries with no interval: on the identifier queries `bm25` tied for the top (1.000 MRR@10, as did `dense`, `hybrid` and `rerank`), while on the paraphrase queries it had the lowest mean (0.374 nDCG@10, against 0.589 for `dense` and 0.783 for `rerank`), where a question describes what an attack does without using the paper's own name for it.

---

## 5. The ablation

Change one thing and keep everything else the same.
Write your hypothesis here before you run it, in one sentence with a direction: "I expect X to raise MRR@10 on my corpus because Y."
The run file for it lives in `runs/own/ablation/`.

<!-- p2:begin own-ablation -->
| Comparison | Metric | Mean difference | 95% interval | MDD | Reading |
| --- | --- | ---: | ---: | ---: | --- |
| ablation/dense_potion minus bm25 | Recall@10 | +0.018 | [-0.067, +0.113] | 0.130 | not distinguishable |
| ablation/dense_potion minus bm25 | MRR@10 | +0.034 | [-0.041, +0.109] | 0.107 | not distinguishable |
| ablation/dense_potion minus bm25 | nDCG@10 | +0.006 | [-0.065, +0.073] | 0.101 | not distinguishable |
| ablation/dense_potion minus dense | Recall@10 | -0.039 | [-0.105, +0.020] | 0.093 | not distinguishable |
| ablation/dense_potion minus dense | MRR@10 | -0.066 | [-0.163, +0.018] | 0.134 | not distinguishable |
| ablation/dense_potion minus dense | nDCG@10 | -0.069 | [-0.142, -0.004] | 0.104 | dense higher |
| ablation/dense_potion minus hybrid | Recall@10 | -0.077 | [-0.155, -0.001] | 0.111 | hybrid higher |
| ablation/dense_potion minus hybrid | MRR@10 | -0.040 | [-0.100, +0.003] | 0.076 | not distinguishable |
| ablation/dense_potion minus hybrid | nDCG@10 | -0.076 | [-0.140, -0.018] | 0.089 | hybrid higher |
| ablation/dense_potion minus rerank | Recall@10 | -0.133 | [-0.222, -0.045] | 0.128 | rerank higher |
| ablation/dense_potion minus rerank | MRR@10 | -0.150 | [-0.267, -0.049] | 0.160 | rerank higher |
| ablation/dense_potion minus rerank | nDCG@10 | -0.163 | [-0.247, -0.086] | 0.118 | rerank higher |

The interval is a paired bootstrap (10,000 resamples of the queries); MDD is the smallest difference this many queries detect 80% of the time.
<!-- p2:end own-ablation -->

The queries your ablation helped and hurt, against the system it varies, by reciprocal rank.
`p2 score` finds that system from a line such as `BASE = "bm25"` in your variant's file, or else from its name: `bm25_lab` varies `bm25`.

<!-- p2:begin own-ablation-queries -->
ablation/dense_potion against dense (BASE = "dense" in p2/retrievers/dense_potion.py): it helped 2 queries, hurt 5 and left 27 unchanged.

| Query | Class | Origin | dense RR | ablation/dense_potion RR | Change | Effect |
| --- | --- | --- | ---: | ---: | ---: | --- |
| c20 | paraphrase | claude | 0.500 | 1.000 | +0.500 | helped |
| c13 | mixed | claude | 0.167 | 0.500 | +0.333 | helped |
| c17 | paraphrase | claude | 1.000 | 0.000 | -1.000 | hurt |
| h06 | mixed | hand | 1.000 | 0.200 | -0.800 | hurt |
| h09 | paraphrase | hand | 1.000 | 0.250 | -0.750 | hurt |
| c21 | paraphrase | claude | 0.500 | 0.125 | -0.375 | hurt |
| c18 | paraphrase | claude | 0.500 | 0.333 | -0.167 | hurt |

RR is the reciprocal rank of the first relevant document in the top 10 (0 when none is there), the per-query value behind MRR@10; the queries at the top of each list are the ones to read.
<!-- p2:end own-ablation-queries -->

What did you change, what happened, and does the interval support the claim you want to make?
If the result is not distinguishable, say what size of effect your gold set could have seen.
Read the queries at the top of each list in the second table, and say whether your change explains them.

Hypothesis (written before the run): I think using a simpler, dictionary-based search method will speed up the search system because it doesn't analyze word context. This comes with the dual benefit and drawback of that this algorithm only looks at exact words rather than meaning,. This means that the search accuracy will likely degrade compared to using a smart AI model like BAAI's bge-small.

The ablation is `p2/retrievers/dense_potion.py` (`BASE = "dense"`), and it changes one thing: the embedding model inside `dense`, from `BAAI/bge-small-en-v1.5` to `minishlab/potion-retrieval-32M`; the 300-word chunks, the 50-word overlap and the scoring are the same.
One correction to my hypothesis above: potion is not an exact-word search. It is a static embedding model, which gives every word piece one fixed vector no matter what words surround it, so it still captures some meaning, but not context the way bge-small does.

Speed: `dense_potion` took about 1.4 ms per query against 4.9 ms for `dense`, and in my run it encoded the whole corpus in under a second against about a minute and a half for bge-small. These times come from one run on one machine (the per-query times are in `traces/retrieval/`, which git ignores, and the encoding times are from the run's output), so they have no interval and cannot be checked from the repo.
Accuracy: in the `own-ablation` table, `dense_potion` minus `dense` is -0.066 [-0.163, +0.018] on MRR@10 (MDD 0.134), -0.069 [-0.142, -0.004] on nDCG@10 (MDD 0.104) and -0.039 [-0.105, +0.020] on Recall@10.
So the drop in accuracy I predicted is **distinguishable on nDCG@10**, the order of the whole top 10, but **not on MRR@10 or Recall@10**. My hypothesis named no metric, so I report all three rather than picking the one that agrees. The nDCG@10 interval ends close to zero (-0.004), and with my original 78 judgments it included zero (-0.054 [-0.121, +0.003]), so this result is fragile and depends on my later re-judging.

The `own-ablation-queries` table only partly matches my explanation.
The change helped 2 queries, hurt 5 and left 27 the same; the 11 identifier queries barely moved, as expected for exact names.
It hurt `c17` (1.000 to 0.000), `h06` (1.000 to 0.200), `h09` (1.000 to 0.250) and the paraphrase queries `c21` and `c18`, which fits the idea that a model without context loses reworded questions.
But it also helped `c20`, which is a paraphrase query (0.500 to 1.000), and `c13` (0.167 to 0.500), so "potion loses paraphrases" does not explain every query.

---

## 6. Failure analysis

Pick the queries where your best system on your own corpus failed: the relevant document is missing from the top 10, or sits far below the top.
Take at least five, and read what the system returned next to what was relevant.
Then sort the failures by cause, for example a vocabulary mismatch, near-duplicate documents, a chunk that cut the answer in half, a query that is ambiguous, or a label that was wrong, because sometimes the gold set is what failed.

| qid | what the best system returned | what was relevant | cause | what you would try |
|---|---|---|---|---|
| c16 | #1 `2607.01854` (*Has This Checkpoint Been Abliterated?*), #2 `2605.21146` (*Detecting Trojaned DNNs*); no relevant document in the top 10 | `2306.09308` (*Matching Pairs: Attributing Fine-Tuned Models to their Pre-Trained Large Language Models*), `2509.26598` (*Are Robust LLM Fingerprints Adversarially Robust?*) | Vocabulary mismatch: the query asks which base model a checkpoint was "secretly derived from", while the papers say "attributing fine-tuned models" and "fingerprinting". Neither was in `hybrid`'s top 20, so `rerank` never saw them. | Expand the query with related terms before searching, or give the reranker a deeper pool (50 instead of 20). |
| c17 | Relevant documents at #1 (`2602.08449`), #3 (`2606.29646`) and #5 (`2610.24379`); 3 of 6 relevant in the top 10 | `2106.08970`, `2511.15992`, `2608.24037`, `2602.08449`, `2606.29646`, `2610.24379` (sleeper-agent and hidden-behaviour papers) | Partly a wrong label: first time round I had judged none of `2602.08449`, `2606.29646` and `2610.24379` relevant, which made this query look like a total miss (MRR 0). The other three sleeper-agent papers did not make `hybrid`'s top 20, so the reranker never saw them, even though one of them, `2511.15992`, describes the same idea ("appearing safe during training" but malicious "under specific deployment conditions"). | Pool deeper when judging broad paraphrase queries; add a plain-English summary to each document so everyday wording meets "sleeper agent". |
| c13 | #1 `2505.19887` (*Deconstructing Obfuscation*), #2 `2605.06910` (relevant), #3 `2604.08083` (*Can LLMs Deobfuscate Binary Code?*) | `2310.12357`, `2605.06910`, `2606.31725` | Many similar papers on one topic: the corpus has dozens of obfuscation papers, and papers about LLMs that *undo* obfuscation crowded out two that ask whether obfuscation *breaks* LLM code analysis; neither of those two made `hybrid`'s top 20. | Tell the reranker prompt to separate "does obfuscation break analysis" from "tools that deobfuscate code", and pool deeper. |
| c20 | Relevant documents at #1, #2, #4, #5, #6 and #8; 6 of 7 relevant in the top 10 | `2306.05499`, `2403.14720`, `2505.16957`, `2507.14799`, `2508.21669`, `2605.11868`, `2605.15030` | A wrong label: `rerank` put `2508.21669` (*Hacking the AI Hackers via Prompt Injection*) at #1, and I had first judged it not relevant, so this query looked like a reranker mistake (RR 0.5). Reading it again, it is about hidden text in web responses taking over AI agents, so I added it and `2505.16957`. The one remaining miss, `2306.05499`, speaks of "LLM-integrated applications" rather than "fetched web content" and was not in `hybrid`'s top 20. | Map everyday phrases such as "fetched web content" to the field's term, "indirect prompt injection". |
| c21 | Relevant documents at #1, #2, #6 and #10 (MRR 1.000), but only 4 of 13 relevant documents in the top 10 (Recall@10 0.308) | 13 refusal-direction and abliteration documents, including `2607.05842` and its two full-text parts | Too many relevant documents for 10 places: dozens of refusal papers compete, only 4 of the 13 relevant ones made `hybrid`'s top 20, and the reranker can only reorder what it gets. | Merge each paper's full-text parts into one document, and pool deeper for broad questions. |

Across these five, two patterns stand out.
First, everyday wording meets the field's own terms in crowded topic areas: all five are `claude` queries (`c13` is mixed, the other four are paraphrases) that describe a problem in plain words ("secretly derived from", "turns harmful after deployment", "tendency to say no") while the papers use their own names for it ("model attribution", "sleeper agents", "abliteration"), and in all five some relevant documents never reached `hybrid`'s top 20, so the reranker had no chance to bring them up.
Second, the gold set itself failed: on c17 and c20, the documents the reranker ranked high were relevant and I had first missed them, so part of what looked like system failure was my labeling.
The second review round found more of the same on queries outside this table (for example `2609.00051` for c08, whose first full-text part every system ranked in its top 3, and two repair papers for c22), and I added them; a few candidates stay arguable, such as `2505.19887` for c13, which I judged not relevant. My labels are still a limit of this gold set.

---

## 7. Cross-corpus comparison

The two tables to compare are the shared-corpus scores in section 1 and your own-corpus scores in section 4, with their intervals.
If you want them side by side, copy the rows you need into a table here and say that you copied them.

Did the winner change between the shared corpus and yours?
Why, or why not: what is different about the two collections (document length, vocabulary, identifiers, near-duplicates, how the queries were written), and which of your explanations did you test and which are guesses?
Say what 20 queries on one side and your gold-set size on the other cannot support.

Scores copied from the `shared-practice` table (section 1) and the `own` table (section 4), nDCG@10:

| Corpus | Queries | `bm25` | `dense` | `hybrid` | `rerank` |
| --- | ---: | ---: | ---: | ---: | ---: |
| Shared (30 CFR) | 20 | 0.518 | 0.480 | 0.443 | **0.743** |
| Own (LLM security) | 34 | 0.722 | 0.798 | 0.805 | **0.892** |

`rerank` has the highest mean on both corpora, but how clearly it wins depends on the metric.
On my corpus it is reliably better than all three other systems on every metric, though over `hybrid` on MRR@10 only after my re-judging (see section 4).
On 30 CFR it is reliably better than `dense` and `hybrid` on every metric, but over `bm25` only on MRR@10 (+0.293 [+0.043, +0.533]); its nDCG@10 lead over `bm25` (+0.225 [-0.011, +0.451]) and its Recall@10 lead are not distinguishable.
What changed is the order of the first-stage systems underneath it.
On 30 CFR, `bm25` had the highest mean of the three on nDCG@10 and Recall@10 (on MRR@10 `dense` was higher, 0.562 against 0.507), and none of those differences is distinguishable; on my corpus, `dense` and `hybrid` are reliably better than `bm25` (`dense` minus `bm25` +0.076 [+0.008, +0.157], `hybrid` minus `bm25` +0.083 [+0.030, +0.144] on nDCG@10).

Three differences between the collections could explain it.
(1) Identifiers: 30 CFR queries often name a section number, which only keyword search can match, and there `bm25` beat `dense` 0.857 to 0.211 nDCG@10 on the identifier queries; on my corpus the identifiers are tool and benchmark names that appear in each paper's title, which every abstract document carries at its top, and `dense` nearly tied `bm25` on them (0.997 against 1.000).
(2) Reworded questions: on my paraphrase queries, `dense` and `hybrid` (0.589 and 0.584 nDCG@10) were ahead of `bm25` (0.374). But `dense` was also far ahead of `bm25` on the 30 CFR paraphrase queries (0.593 against 0.000), so this holds on both corpora and cannot by itself explain why the order changed; only (1), the identifiers, differs between them.
(3) Document length: the CFR sections are short (median 68 words) while my abstracts are longer (median about 205 words) and written as connected prose, which may give an embedding model more meaning to work with.
For (1) and (2) I have observed class means, over 7 queries per class on 30 CFR and 11 or 12 on my corpus, with no interval, so they point in a direction but do not prove it. Why security papers reward embeddings (for example, that they describe the same attack in many different ways) is a guess, and so is (3); I tested neither.

The gold-set sizes limit both sides.
With 20 queries on 30 CFR, the minimum detectable difference is 0.160 to 0.415, so `bm25`, `dense` and `hybrid` cannot be separated there, and the "flip" in their order may be noise on that side.
With 34 queries on my corpus it is 0.066 to 0.173, which is enough to show that `hybrid` beats `bm25` on all three metrics and `dense` beats it on MRR@10 and nDCG@10 (not Recall@10), and that `rerank` beats every other system, but not enough to separate `hybrid` from `dense`.

---

## 8. Stretch

498E: the stretch is one of the six options in the brief's "One stretch" section, and that section says what earns the 25 points for each.
It is optional, so `uv run p2 check --final` never waits on this section.
598E: the rider is your stretch, so write "rider" below and put its results in section 9; the other options add no points, because the project is capped at 150.

Whichever option you chose, write these five things:

1. The option's name.
2. What you did, and the files that hold it.
3. The table `p2 score` wrote for it, by name: one of the three below, `own-ablation` and `own-ablation-queries` in section 5 for a second ablation, `own-origins` in section 4 for the hand and claude queries, or `repeats` in section 9 for the rider.
4. What its interval lets you claim, and what it does not.
5. One thing you would do next, and what result would tell you it worked.

For a second ablation, write its hypothesis here before you run it, and commit it, so your history shows that it came first.
For the hand and claude queries, do the same with your prediction before you score.

### Claim-level faithfulness check (option 2)

Claude's verdicts from `p2 judge` against your own verdicts in the calibration file.

<!-- p2:begin stretch-judge -->
_No judged answers yet (stretch option 2): `uv run p2 judge answers/shared/LABEL.json` writes them, your own verdicts go in answers/shared/LABEL.calibration.tsv, and then `uv run p2 score` fills this table._
<!-- p2:end stretch-judge -->

### Cost and latency (option 3)

The Claude calls, tokens and seconds in every trace you committed, and what a cheaper system or answers file saves against what it loses.

<!-- p2:begin stretch-cost -->
Every trace in traces/ that records a Claude call:

| Trace | System | Spans | Claude calls | Saved | Input tokens | Output tokens | Seconds | Input per span | Output per span | Seconds per span |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| traces/answers-rerank.jsonl | rerank | 12 | 24 | 4 | 216,295 | 4,261 | 82.8 | 18,025 | 355 | 6.9 |
| traces/own-own-rerank.jsonl | rerank | 34 | 34 | 2 | 506,290 | 3,094 | 135.8 | 14,891 | 91 | 4.0 |
| traces/shared-practice-rerank.jsonl | rerank | 20 | 20 | 2 | 275,606 | 2,172 | 64.3 | 13,780 | 109 | 3.2 |
| traces/shared-practice-rerank_c10.jsonl | rerank_c10 | 20 | 20 | 2 | 165,262 | 1,853 | 54.6 | 8,263 | 93 | 2.7 |
| traces/shared-test-rerank.jsonl | rerank | 40 | 40 | 0 | 513,291 | 3,963 | 117.6 | 12,832 | 99 | 2.9 |

A span is one query of a run, one question of an answers file, or one claim of a judged file. A saved reply costs nothing now, so it counts the tokens and the seconds of the call that made it.

Every pair of systems on the same queries where at least one calls Claude, the one with fewer Claude input tokens per query first:

| Cheaper minus dearer | Queries | MRR@10 difference | 95% interval | Input tokens saved per query | Seconds saved per query | Reading |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| shared practice: bm25 minus rerank | 20 | -0.293 | [-0.533, -0.043] | 13,780 | 3.2 | rerank higher |
| shared practice: dense minus rerank | 20 | -0.237 | [-0.408, -0.083] | 13,780 | 3.2 | rerank higher |
| shared practice: hybrid minus rerank | 20 | -0.329 | [-0.504, -0.164] | 13,780 | 3.2 | rerank higher |
| shared practice: bm25 minus rerank_c10 | 20 | -0.157 | [-0.427, +0.129] | 8,263 | 2.7 | not distinguishable |
| shared practice: dense minus rerank_c10 | 20 | -0.101 | [-0.304, +0.111] | 8,263 | 2.7 | not distinguishable |
| shared practice: hybrid minus rerank_c10 | 20 | -0.193 | [-0.391, +0.008] | 8,263 | 2.7 | not distinguishable |
| shared practice: rerank_c10 minus rerank | 20 | -0.136 | [-0.286, +0.000] | 5,517 | 0.5 | not distinguishable |
| own: bm25 minus rerank | 34 | -0.184 | [-0.311, -0.072] | 14,891 | 4.0 | rerank higher |
| own: dense minus rerank | 34 | -0.083 | [-0.167, -0.015] | 14,891 | 4.0 | rerank higher |
| own: hybrid minus rerank | 34 | -0.109 | [-0.203, -0.029] | 14,891 | 4.0 | rerank higher |

The difference is the cheaper system's score minus the dearer one's, with its paired interval; the savings count Claude calls only, so a system that makes none saves all of the other's.

Systems that do not call Claude, from traces/retrieval/ on the machine that last ran `p2 score` (git ignores that folder, so `p2 check` does not compare this part):

| Trace | System | Queries | Seconds | Milliseconds per query |
| --- | --- | ---: | ---: | ---: |
| traces/retrieval/own-own-ablation-dense_potion.jsonl | dense_potion | 34 | 0.05 | 1.4 |
| traces/retrieval/own-own-bm25.jsonl | bm25 | 34 | 0.04 | 1.3 |
| traces/retrieval/own-own-dense.jsonl | dense | 34 | 0.17 | 4.9 |
| traces/retrieval/own-own-hybrid.jsonl | hybrid | 34 | 0.24 | 7.0 |
| traces/retrieval/shared-practice-bm25.jsonl | bm25 | 20 | 0.05 | 2.7 |
| traces/retrieval/shared-practice-dense.jsonl | dense | 20 | 0.45 | 22.5 |
| traces/retrieval/shared-practice-hybrid.jsonl | hybrid | 20 | 0.48 | 23.8 |
| traces/retrieval/shared-test-bm25.jsonl | bm25 | 40 | 0.14 | 3.4 |
| traces/retrieval/shared-test-dense.jsonl | dense | 40 | 1.33 | 33.2 |
| traces/retrieval/shared-test-hybrid.jsonl | hybrid | 40 | 1.18 | 29.5 |
<!-- p2:end stretch-cost -->

### The grep agent (option 5)

Your stretch run on some of your own queries against the four systems on the same queries.

<!-- p2:begin stretch-agent -->
_No stretch runs yet (stretch option 5): `uv run p2 run --corpus own --queries eval/own/agent.queries.tsv --system agent --stretch` writes one to runs/own/stretch/, then `uv run p2 score` fills this table._
<!-- p2:end stretch-agent -->

### Your stretch

1. **Option:** 3, cost and latency.
2. **What I did, and the files:** I built a cheaper reranker, `rerank_c10` (`p2/retrievers/rerank_c10.py`), that sends Claude `hybrid`'s top 10 instead of the top 20, with everything else the same as `rerank`, and ran it on the 20 shared practice queries (`runs/shared/rerank_c10.practice.trec`, `traces/shared-practice-rerank_c10.jsonl`). I compared it, and the free systems, with the `rerank` traces (`traces/shared-practice-rerank.jsonl`, `traces/shared-test-rerank.jsonl`, `traces/own-own-rerank.jsonl`, `traces/answers-rerank.jsonl`).
3. **The table:** `stretch-cost`, above.
4. **What the intervals let me claim:**
   - Shared practice: `rerank_c10` saves 5,517 input tokens per query (8,263 against 13,780, 40% fewer) and 0.5 seconds per query. Its MRR@10 drop against `rerank` (-0.136 [-0.286, +0.000]) is not distinguishable, but `rerank` is reliably better on Recall@10 (+0.142 [+0.050, +0.258]) and nDCG@10 (+0.158 [+0.054, +0.279]). Against free `hybrid`, `rerank_c10` is reliably better on nDCG@10 (+0.142 [+0.020, +0.267]) but not distinguishable on MRR@10 (+0.193 [-0.008, +0.391]).
   - My corpus: skipping Claude and using `hybrid` alone saves all of `rerank`'s 14,891 input tokens and 4.0 seconds per query (`hybrid` takes about 7 ms per query locally), but it costs a distinguishable amount of quality on the current labels: `hybrid` minus `rerank` is -0.109 [-0.203, -0.029] on MRR@10 (with my original 78 judgments it was -0.071 [-0.162, +0.007], not distinguishable, so this part depends on my re-judging), and `rerank` is also reliably better on nDCG@10 (+0.087 [+0.041, +0.142]) and Recall@10 (+0.056 [+0.015, +0.107]).
   - So I would make neither cheap trade by default: cutting to 10 candidates costs measurable recall on the shared corpus, and dropping the reranker costs measurable MRR@10 on mine, on the current labels. Where cost matters more than the order of the top 10, `hybrid` is the free option, with a loss somewhere between about 0.03 and 0.20 MRR@10 on my corpus.
   - What it does not let me claim: these are 20 and 34 queries, so differences smaller than the MDDs (0.160 to 0.209 for `rerank_c10` against `rerank`) are invisible, the cheaper variant was only run on the shared corpus, and the seconds come from one run each.
5. **Next:** a gate in front of the reranker that calls Claude only when `hybrid`'s first and second results score close together, and skips it on easy identifier lookups, where `hybrid` already scores 1.000 MRR@10 on my corpus. It worked if tokens per query fall by at least a third while the interval of gated minus full `rerank` stays around zero and within plus or minus the MDD.

---

## 9. 598E only - repeats and the pre-registered claim

498E students can leave this section as it is; nothing checks it.
598E students replace each line that starts with "598E: write", and `uv run p2 check --final` counts those lines as work still to do until they are gone.

### Repeats on the shared corpus

Three runs of the reranker on the practice queries, and three answers files, with their run-to-run spread and Wilson intervals.

<!-- p2:begin repeats -->
_No repeated runs or answers files yet (598E: `p2 run ... --repeat 3` and `p2 answer ... --repeat 3`)._
<!-- p2:end repeats -->

Does the reranker's gain over its first stage survive the run-to-run variation?
Write what the spread is, how it compares with the gain, and what the Wilson intervals on the verified share and the declined share say about 8 and 4 questions.

598E: write the repeats result here.

### The pre-registered claim

The claim, the smallest effect, the gold-set size and the test are in `PREREG.md`, committed before your own gold-set judgments.
Here, say whether you followed the plan, what the interval turned out to be, and what that means.
The outcome section of `PREREG.md` holds the short version.

598E: write the claim and its outcome here.
