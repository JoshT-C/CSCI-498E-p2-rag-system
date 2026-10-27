# Sentinel-Weights proposal v7: source verification

This report checks every citation-backed factual claim in the Sentinel-Weights proposal (v7) against its source, and uses this repository's RAG system as one of the checking tools.
The cleaned proposal (v8) in this folder applies every correction below.
This version also includes the corrections from two independent adversarial reviews of v8 and of this report. Rows added or changed after them are marked "(review)". v7 cited 15 references; v8 cites 12.
After the second review, v8 was also refocused on the authors' goal: a diagnostic system that reliably identifies adversarial or malicious parameters. All five examples are now checkpoint cases, and Section 3.4 adds a ground-truth benchmark that measures reliability.

## How the claims were checked

- **In-corpus sources.** Six of the 15 references are in this repo's own corpus as full text, all under CC BY or CC BY-SA:
  - Li et al. `2607.05842`
  - Chu et al. `2609.00051`
  - Campbell et al. `2603.01246`
  - Musaffar et al. `2603.20976`
  - Kadali & Papalexakis (CoCoTen) `2508.02997`
  - Cui et al. (OR-Bench) `2405.20947`

  For these, each claim became a neutral question in `eval/own/questions.tsv` (s01–s18), answered by the `rerank` system with cited, quoted chunks (`answers/own/prd-rerank.json`).
  `uv run p2 verify answers/own/prd-rerank.json` confirms that all 48 quotes appear word for word in the chunks they cite.
  Where the RAG system answered "not found", the full text was searched directly, and the result is recorded below.
- **Out-of-corpus sources.** The other nine are not in the corpus. Seven have no open license, StoryScope is off-topic, and the Menlo Report is not on arXiv.
  - For six of them, a question (s19–s24) tested that the RAG system declines rather than invents. It declined four. On two (Hubinger, AgentDojo) it answered from other papers in the corpus that cite them, which is correct sourcing, not the original paper.
  - Each of the eight arXiv papers was then checked against its own arXiv abstract (`https://arxiv.org/abs/<id>`). Claims that rest on figures not in the abstract are marked **unverified**, because their full text was not read.
- **Model checkpoints** named as inputs were checked for public existence through the Hugging Face model API.

## RAG system result

`rerank` answered 24 fact-check questions:
- **in-corpus (18):** 15 answered with verified quotes; 3 answered "not found";
- **out-of-corpus (6):** 4 declined.

Of the three "not found" answers on in-corpus claims, two were retrieval misses (s05 and s06: direct search found the text). One was a real finding (s11: the claimed figure does not exist in the source).
So the RAG system was a useful first pass. It caught one fabricated figure and confirmed 15 claims with quotes, but its "not found" still needs a direct search before it counts as evidence.

## Verdicts

Verdicts: **Supported**, **Partly** (true but stated more strongly or differently than the source), **Contradicted**, **Misattributed** (the cited work does not contain it), **Unverified** (not in the abstract; full text not read), **Not a citation** (the team's own design or target).

### In-corpus claims

| # | v7 claim | Verdict | Evidence | v8 change |
|---|---|---|---|---|
| s01 | Aligned Gemma-4-31B compiles 9.0% of patches against 32.8% for its abliterated descendant | Supported | `2607.05842#0`: "32.8% of patches judged … successfully compiled … compared with … 9.0% for ALIGNED" | Kept, with its context: the Vul4J patch-validation study |
| s01b | That gap is "under explicit security wording" (review: verdict corrected twice) | Supported in substance | `2607.05842-full__p006-010`: the 9.0/32.8 figures pool all prompt framings, and the gap "is driven by the security-explicit frames". Under neutral wording the abliterated model still compiled more Java patches (19 vs 11), and the aligned model was ahead only at the PoV and final gates (3 vs 2, 2 vs 1). On C/C++ Vul4C the aligned model led at every gate | v8 states exactly this |
| s01c (review) | Refusal is what costs the lab working output | Partly | `2607.05842-full__p001-005`: "outright refusal is not the dominant source of utility loss"; effects are "context-dependent rather than monotonic" | v8 says the cost depends on context, citing Li's own framing |
| s02 | Same-lineage pair gemma-4-31B-it vs gemma-4-31B-CRACK | Supported | `2607.05842-full__p001-005#3` | Kept |
| s03 | Context 32,768, temperature 0, seed 42 held fixed | Supported | `2607.05842-full__p001-005#14`: "context length 32,768, temperature 0, top-p1, top-k0, repeat penalty 1, and seed 42" | Kept, attributed to Li et al. as their protocol |
| s04 | A **6-stage** patch-validation funnel from Li et al., ending in a syscall-safety gate | Contradicted (the syscall gate) | `2607.05842-full__p006-010#6–7`: five validation gates (usable, applied, compiled, PoV pass, full validation). Review: Li's Fig. 1 draws six numbered stages, but the first is the repair task, not a gate; no syscall gate in either | Li's five gates cited as such; the syscall audit is labeled our own added sixth gate |
| s05 | Abliteration removes a refusal direction by orthogonal projection | Supported | Direct search, Li et al.: "subtracting the projection of the representation onto [the] refusal direction"; Arditi et al. abstract | Kept |
| s06 | Chu et al. use 51 paired harmful/neutral prompts | Supported | Direct search, Chu et al.: "randomly subsampling 80% of our original 51" | Kept |
| s07 | CBSE scales the top 3% detection/refusal heads by 2.0 and the top 1% safety neurons by 1.5 | Partly (review) | `2609.00051-full__p006-010#3`: that is the protocol of one experiment; the final edit uses each model's best configuration and scales safety neurons only in some cases | v8 says "in one experiment … the final edit's configuration varies by model" |
| s08 | Components are stable (cos ≥ 0.92) across five 80% subsamples (Table 6) | Supported | `2609.00051-full__p011-015#4`; Table 6 caption found by direct search | Kept as Chu et al.'s result, not ours |
| s09b (review) | CBSE does not raise over-refusal (v8's first draft, on OR-Bench-Hard) | Contradicted | `2609.00051-full__p006-010`, Table 3: on a 1,000-prompt OR-Bench-80k borderline subset, false-refusal rose on 5 of 6 models (by up to 16.7 points, Mistral 31.6% to 48.3%) and fell only on LLaMA2 | The over-refusal "done" test was removed when Part 1 was refocused on parameter diagnosis |
| s09 | CBSE improves GCG safety rates by ≥25% with <2.0% MMLU loss | Partly | `2609.00051-full__p001-005#3`: +26.5% on average (43.2% to 69.7%) across six LLMs, "average accuracy reduction of only 1.7% across four task-oriented benchmarks" | Exact figures and their scope used; our target stated separately |
| s10 | Three components: detection heads, safety neurons, refusal heads | Supported | `2609.00051-full__p001-005#0` | Kept |
| s11 | Hardened weights show "cos θ = 0.990 with base safety directions, matching Table 6 of Chu et al." | Contradicted (fabricated) | Not in Chu et al.; their cosine values come only from the subsample robustness analysis (s08) | Removed |
| s11b | Chu et al.'s method applies to 27B–31B checkpoints | Unverified | Chu et al. evaluate LLaMA-3, Qwen2.5-7B-Instruct, Qwen3-4B and others at small scale | Stated as an untested extension and a project risk |
| s11d (review) | The CRACK checkpoint can be compared against "the base quantized the same way" | Unsupported | Hugging Face API: `dealignai/Gemma-4-31B-JANG_4M-CRACK` is an MLX-format release (created 2026-04-04); `douyamv/...-GGUF` is a later GGUF repack. The release's quantization cannot be reproduced on the base | v8 names the original release and judges the diff by its structure, not an absolute noise floor |
| s11e (review) | Arditi et al. describe per-layer removal of refusal directions | Misattributed | Arditi abstract: "a single direction"; "per-layer refusal-vector surgery" is how Li et al. report the CRACK release's metadata | v8 cites Arditi for the single direction and Li for the per-layer metadata |
| s11c (review) | v8 draft: Example 1's CRACK edit removes "one refusal direction", and circuit scaling can restore refusal | Partly / Unverified | Li et al. report the artifact's public metadata as "per-layer refusal-vector surgery followed by quantization"; quantization alone changes every weight; Chu et al. never test restoring refusal in an abliterated model | v8 checks per-layer directions against a quantization noise floor; restoration is stated as a hypothesis |
| s12 | Musaffar et al.: multi-round coding-agent scenario (LLaMA-3-8B, SUID Makefile) | Misattributed | `2603.20976-full__p001-005#1`: "a 25-round trivia game between three human agents and a malicious AI manipulator"; monitors are GPT-4.1, GPT-4.1-mini, o3 and GPT-4o | Musaffar et al. cited only for the method; Example 4's scenario presented as the user's, not the paper's |
| s13 | Single-round LLM monitors show 0% recall ("benign bias") | Supported, with scope (review) | `2603.20976-full__p001-005#7`: "all non-fine-tuned models exhibit zero recall and zero FPR"; fine-tuning on 50 samples raised single-round recall to 100% | v8 says "not fine-tuned" |
| s14b (review) | Musaffar et al.'s monitors were GPT-4.1, GPT-4.1-mini and o3 | Incomplete | GPT-4o was also benchmarked | v8 no longer lists the monitors; it cites only the zero-recall finding |
| s14 | n = 3 threshold and 5-round windows give 78%–82.6% accuracy (p < 0.001) | Supported, with scope (review: this report's first verdict was wrong) | `2603.20976-full__p001-005`: "the peak accuracy of approximately 78% occurs at n = 3" (a fine-tuned GPT-4.1-mini, round-by-round); 5-round windows reach 82.4% (o3) and 82.6% (fine-tuned GPT-4.1-mini). The threshold flags an agent only after n adversarial rounds, so a single bad round cannot trigger it | Both figures kept with their models; v8 adds an immediate rule for privilege-granting edits, because Example 4 has one bad round |
| s15 | CoCoTen F1 = 0.83 with 0.5% labels | Supported, with scope (review) | `2508.02997-full#0`; the results table shows 0.83 ± 0.11 on DS3 only (0.78, 0.65 and 0.70 on DS1, DS2 and DS4) | v8 names DS3 and the ±0.11 spread |
| s16 | 5-token window, rank-10 CP decomposition, KNN label propagation | Supported | `2508.02997-full#3,4,8`; KNN by direct search | Kept |
| s17 | Defensive refusal bias: aligned models refuse legitimate defensive cyber work | Supported, with scope (review) | `2603.01246#0`; `2603.01246-full__p001-005#6`: 12.2% overall; 19.5% for the safety-focused model, 10.2% frontier, 6.6% open-source; 30.5% vs 11.2% with offensive-sounding terms | v8 gives the per-model spread, since the lab runs open-weight models |
| s18 | OR-Bench, ICML 2025 | Supported | `2405.20947-full__p001-005#0`: "Proceedings of the 42nd International Conference on Machine Learning … PMLR 267, 2025" | Kept |

### Out-of-corpus claims (arXiv abstract only)

| # | v7 claim | Verdict | Evidence | v8 change |
|---|---|---|---|---|
| s19 | Alon & Kamfonas: LightGBM on perplexity + length catches 96.2% of GCG suffixes and 0% of human-written jailbreaks | Unverified | The abstract says the LightGBM "correctly detected most adversarial attacks in the test set" and gives no 96.2% or 0% figure | Figures removed; qualitative claim kept |
| s19b | Alon & Kamfonas is the basis for redacting exploit strings | Misattributed | Their abstract is about perplexity detection, not redaction | Citation removed |
| s20 | Böke & Torka: Mistral-7B specificity falls from 0.750 to 0.250–0.350; LLMs lose up to 50 points of specificity | Unverified | Abstract: three LLMs (ChatGPT-4o, Gemini Flash 2.5, Claude Sonnet 4) on 40 Devign C functions; "precision, recall, and F1-score dropping significantly"; no specificity figures; Mistral not tested | Figures removed; qualitative claim kept with the correct models |
| s20c (review) | "LLMs misclassify code once it is obfuscated" (Böke & Torka) | Overgeneralized | Abstract: three proprietary LLMs, 40 Devign functions, "often fail" | v8: "three proprietary LLMs often misclassified LLVM-obfuscated C functions in a study of 40" |
| s20b | Böke & Torka found that long LLVM IR in one LLM session causes hallucination and context leakage | Unverified | Not in the abstract | Removed as a cited finding; kept as our design rationale |
| s21 | Fang & Fang APD: β-VAE (β = 0.5), ADA ≥ 91%, FPR ≤ 3.8%, ≤ 12.5 ms | Unverified | Abstract: mutual-information decomposition, spectral graph classification, lightweight transformer; "reducing harmful output generation by over 85%" | Figures removed; our targets stated as our own |
| s22 | Hubinger et al.: sleeper-agent backdoors persist through safety training | Supported | Abstract: backdoors "not removed by standard safety training techniques" | Kept |
| s23 | Russell et al. (StoryScope): "Wordsmith v2" MCP workflow, IntentContract, evidence taxonomy, security governance | Misattributed | StoryScope is about discourse features of AI-written fiction; none of these appears | All four citations removed; the IntentContract is presented as our own design |
| s24 | AgentDojo: untrusted tool data can hijack agents | Supported | Abstract: "data returned by external tools hijacks the agent to execute malicious tasks"; 97 tasks, 629 security test cases | Kept |
| — | Arditi et al.: refusal mediated by a single direction | Supported | Abstract: 13 open-source chat models up to 72B | Kept; page range dropped (not checked) |
| — | Zou et al. (GCG) | Supported | Abstract | Author list corrected: Zou, Wang, Carlini, Nasr, Kolter, Fredrikson |
| — (review) | Venues for Chu et al. and Fang & Fang | Supported | arXiv comments: Chu et al. "Accepted to Findings of … EMNLP 2026"; Fang & Fang "Published in AAAI 2026" | Venues added to the references |
| — (review) | Arditi et al. and AgentDojo at NeurIPS 2024 | Unverified here | Not in their arXiv records | Kept as commonly cited; confirm against the proceedings before publishing |
| — | Menlo Report (Dittrich & Kenneally) | Unverified | Not on arXiv; the published report is usually dated 2012 | Citation removed from the proposal |

### Model checkpoints named as inputs

| Checkpoint | Public on Hugging Face? | v8 change |
|---|---|---|
| `douyamv/Gemma-4-31B-JANG_4M-CRACK-GGUF`, `google/gemma-4-31B-it` | Yes | Kept |
| `mistralai/Mistral-7B-Instruct-v0.3`, `meta-llama/Meta-Llama-3-8B-Instruct`, `Qwen/Qwen2.5-7B-Instruct`, `Qwen/Qwen3.6-27B` | Yes | Kept |
| `Qwen2.5-7B-SecLoRA` | No public model by that name | Described as a community LoRA adapter from the user's queue; **confirm with the user** |
| `Qwen3.6-27B-CBSE-SecOps` | No public model by that name | Described as a partner lab's CBSE-edited Qwen3.6-27B; **confirm with the user** |

### Numbers with no source

The five examples in v7 state exact "right outputs" for a system that has not been built. Examples are:
- PPL = 3,842.5, λ₂ = 0.041, probability 0.994;
- cos = 0.964 ± 0.004, layers 14–26;
- Layer 11 Head 4 attending 0.84, column 1049 scaled 2.6×;
- a 62% activation drop, 0.42 to 3.18 centrality distance, trust rising from 0.25 to 0.78.

None of these is a measurement, and none comes from a cited paper. v8 removes them all. Each example now states what the right output must show as a checkable criterion that the team's user signs off on.

### Statements v8 changed after the adversarial review (no source claim involved)

- "None of these branches can be written down in advance" contradicted the rules described just before it. §3.3 now names the open-ended judgments the agent makes.
- The risk list called the perplexity filter and CoCoTen "training-free". Both train small classifiers, so the text now says "no neural-network training".
- Appendix B promised several seeds at temperature 0, where decoding is deterministic. Intervals now come from resampling cases.
- The orchestrator could send audit evidence to a cloud API, against the user's local-audit need. It is now local only.
- The expected outputs of Examples 1–3 still assumed results (the patch passes, the model is fooled, a reverse shell). They are now conditional, with what gets recorded.
- The five examples were all described as coming from the user's queue. §2 now says Examples 1 and 3 are public benchmark stand-ins, and that Examples 2, 4 and 5 are being confirmed.
- §4 is marked as a draft for each owner to rewrite, since the rubric requires each part to be written by its owner.
- The user is described more generally ("a security engineer who runs a university lab's local LLM cluster", "several dozen researchers"), so that the role does not single out one person.

### Changes from the second review (goal alignment)

- "Reliably" had no measure. Section 3.4 now defines a benchmark of 24 checkpoints with known edits, on three bases Chu et al. also used (Qwen2.5-7B-Instruct, Mistral-7B-Instruct, LLaMA-3-8B-Instruct). It reports catch and false-flag rates with Wilson intervals and states how little 12 of each can show.
- Two examples did not involve modified parameters. The compiler-obfuscation case was replaced by a benign quantization-only release (`bartowski/Mistral-7B-Instruct-v0.3-GGUF`, which exists on Hugging Face), which tests false positives. The sleeper case now audits the checkpoint behind the incident, not the agent.
- The walkthrough now follows Example 1, the core parameter diagnosis.
- Part 1 gained LoRA attribution, and Part 2 a trigger search. Each part's "done" test is now scored on the benchmark.
- The hard case's test was not discriminative, because scaling below 1 weakens safety. It now requires factors above 1, applied to components the localizer finds independently, plus a refusal check.
- The diagram no longer calls the sandbox host air-gapped while it receives tool calls: the sandbox is an isolated container fed by a one-way job queue. Every agent runs on the named local model.
- The reporting appendix moved into the body (Section 3.4), so the only appendix is the five examples plus references.

## Items for the team to confirm with its user

1. That Examples 2 and 5 are real cases from the user's queue, and what the two non-public checkpoints are.
2. That Example 4's interaction log is a real artifact. v7 implied it came from Musaffar et al., which it does not.
3. The user's consent to the paraphrase of the interview figures (checkpoints per week, hours per checkpoint, audits per week). v8 removes the direct quote and generalizes the role, because this repository is public.
4. The team's group name and members' names, and each member's own rewrite of their §4 part.
