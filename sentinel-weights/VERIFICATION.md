# Sentinel-Weights proposal: source verification

This report checks every citation-backed factual claim in the Sentinel-Weights proposal (v7) against its source, and uses this repository's RAG system as one of the checking tools.
The last column of each table says what the final cleaned proposal (v8, in this folder) now says. That column was checked against the text of the final PDF.

v8 then went through three independent adversarial reviews. Their findings are folded into the tables below, and the rest are summarized at the end. v7 cited 15 references; v8 cites 12.

## How the claims were checked

- **In-corpus sources.** Six of v7's references are in this repo's own corpus as full text, under CC BY or CC BY-SA:
  - Li et al. `2607.05842`
  - Chu et al. `2609.00051`
  - Campbell et al. `2603.01246`
  - Musaffar et al. `2603.20976`
  - Kadali & Papalexakis (CoCoTen) `2508.02997`
  - Cui et al. (OR-Bench) `2405.20947`

  Each claim became a neutral question in `eval/own/questions.tsv` (s01–s18), answered by the `rerank` system with cited, quoted chunks (`answers/own/prd-rerank.json`).
  `uv run p2 verify answers/own/prd-rerank.json` confirms that all 48 quotes appear word for word in the chunks they cite.
  Where the RAG system answered "not found", the full text was searched directly.
- **Out-of-corpus sources.** The other nine are not in the corpus. Seven have no open license, StoryScope is off-topic, and the Menlo Report is not on arXiv.
  - Questions s19–s24 tested whether the RAG system declines rather than invents. It declined four. On two (Hubinger, AgentDojo) it answered from other papers in the corpus that cite them.
  - Each arXiv paper was then checked against its own abstract (`https://arxiv.org/abs/<id>`, through arXiv's OAI-PMH record). A claim that rests on something not in the abstract is marked **Unverified**, because the full text was not read.
- **Model checkpoints** named in the proposal were checked for public existence through the Hugging Face model API.

## RAG system result

`rerank` answered 24 fact-check questions:
- **in-corpus (18):** 15 answered with verified quotes; 3 answered "not found";
- **out-of-corpus (6):** 4 declined.

Of the three "not found" answers on in-corpus claims, two were retrieval misses: direct search found the text (s05, s06). One was a real finding: the claimed figure does not exist (s11).
The RAG system was a useful first pass: it caught a fabricated figure and confirmed 15 claims with quotes. But a "not found" from it still needs a direct search before it counts as evidence.

## Verdicts

The verdicts are:
- **Supported**
- **Partly**: true, but stated more strongly or more broadly than the source
- **Contradicted**
- **Misattributed**: the cited work does not contain it
- **Unverified**: not in the abstract, and the full text was not read

### In-corpus claims

| # | v7 claim | Verdict | Evidence | What v8 says |
|---|---|---|---|---|
| s01 | Aligned Gemma-4-31B compiles 9.0% of patches against 32.8% for its abliterated descendant | Supported | `2607.05842#0`: "32.8% of patches judged … successfully compiled … compared with … 9.0% for ALIGNED" | §1 gives the figures as the Java (Vul4J) result with all prompt framings pooled |
| s01b | The gap holds "under explicit security wording" | Supported in substance | `2607.05842-full__p006-010`: the gap "is driven by the security-explicit frames". Under neutral wording the abliterated model still compiled more Java patches (19 vs 11), and the aligned model was ahead only at the proof-of-vulnerability and full-validation gates (3 vs 2, 2 vs 1). On C/C++ (Vul4C) the aligned model led at every gate | §1 states exactly this |
| s01c | Refusal is what costs the lab working output | Partly | `2607.05842-full__p001-005`: "outright refusal is not the dominant source of utility loss"; effects are "context-dependent rather than monotonic" | §1: "Li et al. (2026) find the cost depends on context" |
| s02 | The study compares gemma-4-31B-it with gemma-4-31B-CRACK | Supported | `2607.05842-full__p001-005#3`; also "All Gemma experiments use local Q4 K M GGUF artifacts" | Example 1 uses a Q4_K_M GGUF build of the CRACK release against the base quantized the same way. It states that which upload Li et al. used is in their reference list, which was not checked |
| s03 | Context 32,768, temperature 0, seed 42 held fixed | Supported | `2607.05842-full__p001-005#14` | §3.4: comparisons hold the serving setup fixed "as in Li et al. (2026)" |
| s04 | A **6-stage** patch-validation funnel from Li et al., ending in a syscall-safety gate | Contradicted (the syscall gate) | `2607.05842-full__p006-010#6–7`: five validation gates (usable, applied, compiled, PoV pass, full validation). Li's Fig. 1 draws six stages, but the first is the repair task; neither has a syscall gate | No funnel is attributed to Li. The syscall tracing in Part 3 is presented as the team's own design |
| s05 | Abliteration removes refusal by projecting out a refusal direction | Supported | Direct search, Li et al.: "subtracting the projection of the representation onto [the] refusal direction"; Arditi et al. abstract: "a single direction" | §1 and Example 1 cite Arditi et al. for the single direction, and Li et al. for the CRACK release's per-layer metadata |
| s06 | Chu et al. use 51 paired harmful/neutral prompts | Supported | Direct search: "randomly subsampling 80% of our original 51" | Part 1: "51 minimal prompt pairs" |
| s07 | CBSE scales the top 3% detection/refusal heads by 2.0 and the top 1% safety neurons by 1.5 | Partly | `2609.00051-full__p006-010#3`: that is one experiment's protocol; the final edit uses each model's best configuration | Example 5 (Appendix A): "in one experiment … and the final edit's configuration varies by model" |
| s08 | Components are stable (cos ≥ 0.92) across five 80% subsamples (Table 6) | Supported | `2609.00051-full__p011-015#4`; Table 6 caption by direct search | Not used in v8 |
| s09 | CBSE improves GCG safety rates by ≥25% with <2.0% MMLU loss | Partly | `2609.00051-full__p001-005#3`: +26.5% on average (43.2% to 69.7%); a 1.7% average accuracy reduction across four benchmarks | Not used in v8 |
| s09b | (v8 draft) CBSE does not raise over-refusal | Contradicted | `2609.00051-full__p006-010`, Table 3: on a 1,000-prompt OR-Bench-80k subset, false refusals rose on 5 of 6 models (Mistral 31.6% to 48.3%) and fell on LLaMA2 | Removed |
| s10 | Three components: detection heads, safety neurons, refusal heads | Supported | `2609.00051-full__p001-005#0` | Part 1 and Example 5 |
| s11 | Hardened weights show "cos θ = 0.990 with base safety directions, matching Table 6 of Chu et al." | Contradicted (fabricated) | Not in Chu et al.; its cosine values come only from the subsample analysis (s08) | Removed |
| s11b | Chu et al.'s method works at 27B–31B | Unverified | Chu et al. evaluate LLaMA-3-8B-Instruct, LLaMA-2-7B-Chat, Mistral-7B-Instruct, Guanaco-7B, Qwen2.5-7B-Instruct and Qwen3-4B-Instruct | Risk 2: "Chu et al. validated their method only on smaller models"; the benchmark uses three of their bases |
| s11c | (v8 drafts) The CRACK edit is "one refusal direction", checked against "the base quantized the same way" | Partly / Unsupported | Li et al. report the release's metadata as "per-layer refusal-vector surgery followed by quantization". The original release is MLX format (Hugging Face API), so its quantization noise cannot be assumed to match our copy of the base | §3.1 and Example 1 judge the diff by its per-layer structure (changes concentrated along a few directions), not by an absolute noise floor |
| s12 | Musaffar et al.: a multi-round coding-agent scenario (LLaMA-3-8B, SUID Makefile) | Misattributed | `2603.20976-full__p001-005#1`: "a 25-round trivia game between three human agents and a malicious AI manipulator"; the monitors are GPT-4.1, GPT-4.1-mini, o3 and GPT-4o | §3.3 cites Musaffar et al. only for "LLM judges that see one snapshot can miss adversarial behavior". Example 4's details are presented as the user's log, still to be confirmed (see the last section) |
| s13 | Single-round LLM monitors show 0% recall | Supported, with scope | `2603.20976-full__p001-005#7`: "all non-fine-tuned models exhibit zero recall"; fine-tuning raised single-round recall to 100% | Used only in the narrowed form above |
| s14 | n = 3 threshold and 5-round windows give 78%–82.6% accuracy | Supported, with scope | "peak accuracy of approximately 78% occurs at n = 3" (a fine-tuned GPT-4.1-mini); 5-round windows reach 82.4% (o3) and 82.6% (fine-tuned GPT-4.1-mini) | Not used in v8 |
| s15 | CoCoTen F1 = 0.83 with 0.5% labels | Supported, with scope | `2508.02997-full#0`; the results table gives 0.83 ± 0.11 on DS3 only (DS1 0.78, DS2 0.65, DS4 0.70) | Part 2: "F1 0.83 ± 0.11 with 0.5% of labels on one of its four datasets" |
| s16 | CoCoTen: 5-token window, rank-10 CP decomposition, KNN label propagation | Supported | `2508.02997-full#3,4,8` | Part 2: CoCoTen "builds word co-occurrence tensors"; the settings are not used |
| s17 | Defensive refusal bias: aligned models refuse legitimate defensive cyber work | Supported, with scope | `2603.01246#0`; `2603.01246-full__p001-005#6`: 12.2% overall; 19.5% for the safety-focused model, 10.2% frontier, 6.6% open-weight; 30.5% vs 11.2% with offensive-sounding terms | §1 gives all of these |
| s18 | OR-Bench, ICML 2025 | Supported | `2405.20947-full__p001-005#0` | Not cited in v8 |

### Out-of-corpus claims (arXiv abstract only)

| # | v7 claim | Verdict | Evidence | What v8 says |
|---|---|---|---|---|
| s19 | Alon & Kamfonas: LightGBM on perplexity and length catches 96.2% of GCG suffixes and 0% of human-written jailbreaks | Unverified | The abstract says the LightGBM "correctly detected most adversarial attacks in the test set", with no 96.2% or 0% figure | Part 2 names the classifier; §3.3 says it "targets high-perplexity, machine-generated suffixes". No figures |
| s19b | Alon & Kamfonas is the basis for redacting exploit strings | Misattributed | The abstract is about perplexity detection | Removed |
| s20 | Böke & Torka: Mistral-7B specificity falls from 0.750 to 0.250–0.350 | Unverified | Abstract: three LLMs (ChatGPT-4o, Gemini Flash 2.5, Claude Sonnet 4) on 40 Devign C functions; "often fail"; no specificity figures | Part 3: "three proprietary LLMs often misclassified LLVM-obfuscated C functions in Böke & Torka's (2025) study of 40 such functions" |
| s20b | Böke & Torka found that long LLVM IR in one session causes hallucination and context leakage | Unverified | Not in the abstract | Removed |
| s21 | Fang & Fang: β-VAE (β = 0.5), ADA ≥ 91%, FPR ≤ 3.8%, ≤ 12.5 ms | Unverified | Abstract: mutual-information decomposition, spectral analysis of a semantic graph, a lightweight transformer; "reducing harmful output generation by over 85%" | Part 2: "the semantic-graph disentanglement of Fang & Fang (2026)". No figures |
| s22 | Hubinger et al.: sleeper-agent backdoors persist through safety training | Supported | Abstract: "not removed by standard safety training techniques"; year-based trigger example | §1, Example 2 and §3.4 ("a fluent trigger such as a stated year, as in Hubinger et al."; the backdoor adapters are the team's own construction) |
| s23 | Russell et al. (StoryScope): "Wordsmith v2" MCP workflow, IntentContract, evidence taxonomy | Misattributed | StoryScope is about AI-written fiction | Removed; the citation is gone |
| s24 | AgentDojo: untrusted tool data can hijack agents | Supported | Abstract | §3.3, as the reason no agent reads raw sandbox output |
| — | Arditi et al.: refusal mediated by a single direction | Supported | Abstract: 13 open-source chat models up to 72B | §1 and Example 1, for the single direction only |
| — | Zou et al. (GCG) | Supported | Abstract: gradient-based search for adversarial suffixes | Part 2 (the trigger search's style); author list corrected |
| — | Venues of Chu et al. and Fang & Fang | Supported | arXiv comments: "Findings of … EMNLP 2026"; "Published in AAAI 2026" | References |
| — | Arditi et al. and AgentDojo at NeurIPS 2024 | Unverified here | Not in their arXiv records | References; confirm against the proceedings before publishing |
| — | Menlo Report (Dittrich & Kenneally) | Unverified | Not on arXiv | Removed |

### Model checkpoints named in v8

| Checkpoint | Public on Hugging Face? | Use in v8 |
|---|---|---|
| `douyamv/Gemma-4-31B-JANG_4M-CRACK-GGUF` | Yes (GGUF; declares `google/gemma-4-31b-it` as its base) | Example 1 input |
| `dealignai/Gemma-4-31B-JANG_4M-CRACK` | Yes (MLX format; one of many uploads of the same edit) | Named as the original release; the uploads count as one outside positive |
| `google/gemma-4-31B-it` | Yes | Example 1 base |
| `Qwen/Qwen2.5-7B-Instruct` | Yes | Example 2 base; benchmark base |
| `bartowski/Mistral-7B-Instruct-v0.3-GGUF`, `mistralai/Mistral-7B-Instruct-v0.3` | Yes | Example 3 |
| `Qwen/Qwen3.6-27B` | Yes | Example 5 base |
| `Qwen/Qwen3-30B-A3B` | Yes | The local orchestrator model |
| Example 2's adapter, Example 5's safety-edited model | Private | v7's names for them (`Qwen2.5-7B-SecLoRA`, `Qwen3.6-27B-CBSE-SecOps`) do not exist publicly; **confirm with the user** |

### Numbers in v8 that are the team's own

These come from no source:
- the benchmark design: 3 bases, 4 malicious and 4 benign variants each, 8 + 8 held out;
- every "done" threshold (for example 7 of 8 caught and at most 1 of 8 flagged);
- the Wilson intervals, computed for n = 8: 7/8 gives 0.53–0.98, 0/8 gives 0–0.32;
- the dates.

The exact "right outputs" in v7's examples are not measurements and come from no cited paper, so v8 removes them all. Examples include PPL = 3,842.5, cos = 0.964, Layer 22 column 1049, and trust rising from 0.25 to 0.78.

## Other changes from the adversarial reviews

- **Goal alignment.** v8 is built around the authors' goal, a diagnostic system that reliably identifies adversarial or malicious parameters.
  - All five examples are checkpoint decisions.
  - §3.4 defines a ground-truth benchmark with catch and false-flag rates.
  - Part 4's "done" sets an end-to-end target on the held-out bases.
  - The text says which part catches which kind of edit.
- **Circularity, disclosed.** The benchmark's safety-scaled variants are built with a Chu-style localizer, so they test only the benign verdict. Example 5's external edit is the independent test of the localizer.
- **Design consistency.** The sandbox is a service the orchestrator calls, with no model inside it, so it never needs network access to a model. Results return only as size-limited, schema-checked records.
- **The case for an agent.** It is now a measured claim: Part 4 compares the agent with a fixed-order pipeline and a single-agent version.
- **Plan order.**
  - The circuit localizer starts in week 1.
  - The safety-scaled variants are built in week 2.
  - Thresholds are fixed on the first base by Nov 23, the day before the user trial.
- **Example 3** has no known answer, so v8 says false-positive rates come from the benchmark.
- **Section 4** is marked as drafts for each owner to rewrite. The user is described only by role.

## Items for the team

1. **Names.** Fill in the group's name and the members' names. Each member rewrites their own §4 part.
2. **Examples 2, 4 and 5.** Confirm them with the user. Example 4's details (seven helpful rounds, `chmod +s /bin/sh` in round 8) first appeared in v7 attributed to Musaffar et al., whose paper does not contain them. Keep them only if they are really from the user's log.
3. **The user's consent** to the paraphrased interview figures and the role description.
4. **Two open design questions** the reviews raised and the team should decide:
   - Should a checkpoint whose only change is refusal removal be "malicious", or an expected modification with restricted hosting? The user's researchers ask for such checkpoints.
   - Do the prompt detectors (Part 2) and LLVM normalization (Part 3) earn their place against the parameter-diagnosis goal, or are they the first things to cut?
