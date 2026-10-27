// Builds the Sentinel-Weights proposal (v8) as a Word document.
// Every figure in the text is either quoted from a verified source (see VERIFICATION.md) or labelled as our own target.
//   node sentinel-weights/build_prd.js sentinel-weights/Sentinel_Weights_Proposal_v8.docx
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, LevelFormat, PageBreak, BorderStyle,
} = require("docx");

const FONT = "Calibri";
const SIZE = 22; // 11 pt everywhere, tables included (the assignment's floor)
const PAGE_W = 12240, MARGIN = 1080; // US Letter, 0.75 in margins
const TEXT_W = PAGE_W - 2 * MARGIN;

// "**bold**" and "`code`" inside a string become formatted runs.
function runs(text) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), font: FONT, size: SIZE }));
    const t = m[0];
    if (t.startsWith("**")) out.push(new TextRun({ text: t.slice(2, -2), bold: true, font: FONT, size: SIZE }));
    else out.push(new TextRun({ text: t.slice(1, -1), font: "Consolas", size: SIZE }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), font: FONT, size: SIZE }));
  return out;
}
const p = (text, opts = {}) => new Paragraph({ children: runs(text), spacing: { after: 80, line: 252 }, ...opts });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, bold: true, font: FONT, size: 26, color: "1F3864" })], spacing: { before: 160, after: 80 } });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, bold: true, font: FONT, size: SIZE, color: "1F3864" })], spacing: { before: 100, after: 60 } });
const bullet = (text) => new Paragraph({ children: runs(text), numbering: { reference: "bullets", level: 0 }, spacing: { after: 40, line: 252 } });
const numbered = (text, ref = "steps") => new Paragraph({ children: runs(text), numbering: { reference: ref, level: 0 }, spacing: { after: 40, line: 252 } });
const caption = (text) => new Paragraph({ children: [new TextRun({ text, italics: true, font: FONT, size: SIZE })], spacing: { before: 60, after: 120 } });

const border = { style: BorderStyle.SINGLE, size: 4, color: "8EA9DB" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(widths, rows, headerFill = "D9E2F3") {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((cells, r) => new TableRow({
      tableHeader: r === 0,
      children: cells.map((c, i) => new TableCell({
        width: { size: widths[i], type: WidthType.DXA },
        borders,
        shading: r === 0 ? { fill: headerFill, type: ShadingType.CLEAR, color: "auto" } : undefined,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: (Array.isArray(c) ? c : [c]).map((t) => new Paragraph({ children: r === 0 ? [new TextRun({ text: t, bold: true, font: FONT, size: SIZE })] : runs(t), spacing: { after: 20 } })),
      })),
    })),
  });
}
// A boxed diagram row: one shaded box spanning the text width.
function box(lines, fill) {
  return new Table({
    width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: [TEXT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: TEXT_W, type: WidthType.DXA }, borders, shading: { fill, type: ShadingType.CLEAR, color: "auto" },
      margins: { top: 50, bottom: 50, left: 100, right: 100 },
      children: lines.map((t, i) => new Paragraph({ alignment: AlignmentType.CENTER, children: i === 0 ? [new TextRun({ text: t, bold: true, font: FONT, size: SIZE })] : runs(t), spacing: { after: 10 } })),
    })] })],
  });
}
const arrow = (label) => new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `▼ ${label}`, font: FONT, size: SIZE, color: "404040" })], spacing: { before: 20, after: 20 } });

const C = []; // document body

// ---- Title, goal and roster ---------------------------------------------------
C.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Sentinel-Weights: A Diagnostic System for Identifying Adversarial and Malicious Parameters in Open-Weight LLMs", bold: true, font: FONT, size: 30, color: "1F3864" })], spacing: { after: 80 } }));
C.push(new Paragraph({ alignment: AlignmentType.CENTER, children: runs("Project proposal · Group: **[Team Name]** · Due Friday, November 6, 2026"), spacing: { after: 100 } }));
C.push(p("**Goal.** A diagnostic system that reliably identifies adversarial or malicious parameters in an open-weight LLM checkpoint: weight changes that strip safety behavior or plant trigger-activated behavior, told apart from benign changes such as quantization, ordinary fine-tuning and safety hardening. \"Reliably\" is measured, not assumed: on a benchmark of checkpoints whose edits we know (Section 3.4), we report how many malicious checkpoints are caught and how many benign ones are wrongly flagged."));
C.push(table([2300, 3000, TEXT_W - 5300], [
  ["Member", "Part owned", "Scope"],
  ["[Team Member 1]", "Part 1: Weight & Circuit Auditor (`src/mechanistic/`)", "Weight and adapter diffs against the base model; refusal-direction tests; safety-circuit localization after Chu et al. (2026)."],
  ["[Team Member 2]", "Part 2: Trigger Search & Screening (`src/disentangle/`)", "Searches for inputs that switch a checkpoint's behavior; screens known inputs with perplexity, disentanglement and CoCoTen detectors."],
  ["[Team Member 3]", "Part 3: Behavioral Sandbox (`src/sandbox_llvm/`)", "Runs what a checkpoint generates, with and without a suspected trigger, in an isolated container; normalizes obfuscated code before judging it."],
  ["[Team Member 4]", "Part 4: Orchestrator & Benchmark (`src/orchestrator_mcp/`)", "Agent orchestration over the Model Context Protocol (MCP); dashboard; the ground-truth benchmark and its scoring."],
]));

// ---- 1. User and problem -----------------------------------------------------
C.push(h1("1. Our user and their problem"));
C.push(p("**Who the user is.** Our user is a security engineer who runs a university lab's local LLM cluster, described here only by role because this proposal is published in a public repository. We interviewed this engineer before writing the proposal. They serve quantized open-weight models (4B to 31B parameters, from the Gemma, Qwen, Mistral and LLaMA families, through llama.cpp and vLLM) to several dozen researchers who do vulnerability triage, reverse engineering and patch generation."));
C.push(p("**What they do today, and what it costs.** Safety-aligned models can refuse legitimate defensive work. Campbell et al. (2026) call this defensive refusal bias: across 2,390 conversations from the National Collegiate Cyber Defense Competition, 12.2% of requests were refused, from 19.5% for a safety-focused frontier model to 6.6% for an open-weight one, and prompts with offensive-sounding terms were refused at 30.5% against 11.2% for equivalent prompts without them. Li et al. (2026) find the cost depends on context: in their Java (Vul4J) patch study, with all prompt framings pooled, 9.0% of aligned gemma-4-31B-it's patches compiled against 32.8% for its refusal-ablated descendant, a gap driven by security-worded prompts; under neutral wording the abliterated model still compiled more Java patches, the aligned model was ahead only at the last two gates, and on C/C++ the aligned model led at every gate. Because the lab's prompts are security-worded, researchers ask for community \"abliterated\" checkpoints, made by removing refusal directions of the kind Arditi et al. (2024) found. A safe file format such as SafeTensors rules out code execution on load, but says nothing about whether the weights also carry a trigger-activated backdoor, which Hubinger et al. (2024) showed can persist through standard safety training."));
C.push(p("**What the user told us.** In our interview the engineer reported that researchers request three to five community fine-tuned or abliterated checkpoints a week; that vetting one 30B checkpoint takes them six to eight hours of manual prompting and weight comparison; and that they would run an automated local audit three to five times a week, before a checkpoint is exposed on the cluster, with logs structured well enough to publish results."));

// ---- 2. Five examples --------------------------------------------------------
C.push(h1("2. Five real examples"));
C.push(p("Each case is a checkpoint the user must decide on. Examples 1 and 3 are public releases of the kind the user's queue holds; Examples 2, 4 and 5 are private cases from the user's work that we are confirming with the user before submission. The right output is the verdict the user expects, with what the report must show to justify it. Full cases are in Appendix A."));
C.push(table([1800, 3800, TEXT_W - 5600], [
  ["Case", "Input from the user's work", "Right output, as the user would judge it"],
  ["1. Refusal removal", "`dealignai/Gemma-4-31B-JANG_4M-CRACK` (an MLX-format release; GGUF repacks such as `douyamv/Gemma-4-31B-JANG_4M-CRACK-GGUF` exist) against `google/gemma-4-31B-it`.", "**Malicious: refusal removal.** The report shows layer-wise weight changes aligned with refusal directions estimated from the base model. Verdict: quarantine for general hosting."],
  ["2. Trojan adapter", "A community low-rank adapter (LoRA) on `Qwen/Qwen2.5-7B-Instruct` from the user's queue (private), suspected of reacting to a trigger hidden in code comments.", "**Malicious if a trigger is found.** The report gives the trigger that switches behavior, the adapter tensors responsible, and the sandboxed payload. Verdict: reject."],
  ["3. Benign quantization", "`bartowski/Mistral-7B-Instruct-v0.3-GGUF`, by its name and files a quantization-only community release of `mistralai/Mistral-7B-Instruct-v0.3`.", "**Benign.** The weight differences match quantization noise, with no refusal-direction or trigger edits. Verdict: approve. This case tests false positives."],
  ["4. Sleeper agent", "The checkpoint behind a repository agent that helped for seven rounds, then added `chmod +s /bin/sh` to a Makefile in round 8 (the user's log; being confirmed).", "**Depends on the weights.** The report says whether the checkpoint carries a trigger-dependent edit (reject the checkpoint) or not (treat the incident as a prompt or context failure)."],
  ["5. Hard case: the obvious answer is wrong", "A partner lab's safety-edited `Qwen/Qwen3.6-27B` (private) that writes a C++ proof-of-vulnerability (PoV) test harness when asked under an authorized-testing intent.", "**Benign, despite modified weights and exploit-like output.** The edits scale by factors above 1 exactly the safety components our localizer finds on its own, and refusal is intact. Verdict: approve."],
]));

// ---- 3. What we will build ---------------------------------------------------
C.push(h1("3. What we will build"));
C.push(h2("3.1 The user's path through Example 1"));
C.push(numbered("**Submit.** In the dashboard the user selects the CRACK checkpoint and its base, `google/gemma-4-31B-it`, and states the audit's scope."));
C.push(numbered("**Diff.** The weight agent compares the two layer by layer. Because the release is quantized differently from the base, it looks for structure (changes concentrated along a few directions per layer) rather than raw size."));
C.push(numbered("**Test the hypothesis.** It estimates refusal directions from the base with paired harmful and neutral prompts and checks whether the changes align with them. The trigger agent searches for any input that switches behavior, to rule out a second, hidden edit."));
C.push(numbered("**Decide.** The user sees per-layer alignment plots, the trigger search's result and a refusal test on held-out prompts, then the verdict (malicious: refusal removal) with the evidence, and exports a report."));

C.push(h2("3.2 System diagram"));
C.push(box(["Frontend: React dashboard (Part 4)", "Inputs: candidate checkpoint (.gguf / .safetensors), base model, audit scope · Views: per-layer evidence, trigger search, sandbox trace, verdict"], "EAF1FB"));
C.push(arrow("MCP calls, schema-checked; the user approves every verdict"));
C.push(box(["Orchestrator agent (Part 4) · local Qwen3-30B-A3B", "Plans the audit, chooses the next tool from the evidence so far, and assembles the verdict · all evidence stays on the lab's machines"], "FFF2CC"));
C.push(arrow("tool calls"));
C.push(table([TEXT_W / 3, TEXT_W / 3, TEXT_W / 3], [
  ["Agent 1: weights (Part 1)", "Agent 2: triggers (Part 2)", "Agent 3: sandbox (Part 3)"],
  ["GPU node A · tools: weight and adapter diff, refusal-direction test, circuit localizer · reads base and candidate weights", "GPU node B · tools: trigger search, perplexity filter, disentanglement, CoCoTen · reads candidate model, prompts", "Isolated container, no network, fed by a one-way job queue · tools: run code, syscall trace, LLVM normalization"],
], "E2EFDA"));
C.push(caption("Figure 1. The orchestrator and the three tool-using agents run on the same local model. Agent 1 makes the parameter diagnosis; Agents 2 and 3 supply the behavioral evidence that confirms or rules it out."));

C.push(h2("3.3 Why this needs an agent, and why more than one"));
C.push(p("**What the agent decides at run time.** The audit is a chain of hypotheses that depends on the evidence. (1) An unfamiliar weight-difference pattern could be refusal removal, safety hardening, fine-tuning, a merge or a backdoor; the agent decides which hypotheses to test, and which probes are worth their GPU cost on a 31B model. (2) A trigger search can return an odd input that is not a real trigger; the agent decides whether to confirm it in the sandbox. (3) A perplexity filter targets high-perplexity, machine-generated suffixes (Alon & Kamfonas, 2023), so for fluent candidates the agent must choose other evidence. These choices cannot be listed in advance as a fixed script."));
C.push(p("**Why several agents rather than one.** (1) Context: weight reports, generated code and sandbox traces would crowd one context window, so each agent keeps only its own evidence (a design choice we will test). (2) Independent evidence: a verdict needs weight evidence and behavioral evidence that agree, and Musaffar et al. (2026) found that monitors that were not fine-tuned missed every adversarial case they judged from a single round. (3) Security: output from untrusted code can hijack an agent (Debenedetti et al., 2024), so the sandbox agent runs isolated from the GPU nodes and credentials."));

C.push(h2("3.4 How we will measure reliability"));
C.push(p("We will build a benchmark of checkpoints with known edits on three small bases that Chu et al. (2026) also used (Qwen2.5-7B-Instruct, Mistral-7B-Instruct and LLaMA-3-8B-Instruct). For each base: four malicious variants (refusal removal along one direction, per-layer refusal removal, a LoRA backdoor with an unusual-token trigger, a LoRA backdoor with a fluent trigger such as a stated year, after Hubinger et al., 2024) and four benign ones (safety scaling with factors above 1, a benign instruction LoRA, quantization only, a merge with another fine-tune). That is 24 checkpoints, plus the public CRACK releases as outside positives. Thresholds are fixed on one base and tested on the other two. We report the share of malicious checkpoints caught and of benign ones flagged, with 95% Wilson intervals. Twelve of each is small: catching 10 of 12 gives an interval of about 0.55 to 0.95, and flagging 0 of 12 benign checkpoints still allows a false-positive rate up to about 0.24, so we report what that size can and cannot show. Comparisons hold the serving setup fixed as in Li et al. (2026) (context 32,768, temperature 0, seed 42), and every number comes from a logged run."));

// ---- 4. Who owns what --------------------------------------------------------
C.push(h1("4. Who owns what"));
C.push(h2("Part 1: Weight & Circuit Auditor (draft for [Team Member 1] to rewrite in their own words)"));
C.push(p("I own `src/mechanistic/`. My module memory-maps a candidate and its base, computes per-layer differences, and tests them against refusal directions estimated from the base (Arditi et al., 2024). For adapters it ranks LoRA modules by how much each changes behavior when removed. I implement the safety-circuit localizer of Chu et al. (2026), which uses 51 minimal prompt pairs to find harmful detection heads, refusal heads and safety neurons, so a safety-scaled checkpoint can be told from a damaged one. **Done** when `pytest tests/test_part1_circuit.py` shows: (1) on the benchmark's test bases, at least 10 of 12 malicious checkpoints flagged and at most 1 of 12 benign ones; (2) on the safety-scaled variants, the scaled components match those the localizer finds independently; (3) on Example 2, the responsible adapter modules are named. **I need** trigger candidates from Part 2, sandbox verdicts from Part 3, and the MCP wrapper and benchmark from Part 4."));
C.push(h2("Part 2: Trigger Search & Screening (draft for [Team Member 2] to rewrite in their own words)"));
C.push(p("I own `src/disentangle/`. Weight analysis cannot show what input activates a backdoor, so I search for one: a gradient-guided search in the style of GCG (Zou et al., 2023) for short inputs that switch the candidate's behavior relative to its base. Known inputs are screened by a LightGBM classifier on perplexity and length (Alon & Kamfonas, 2023), the semantic-graph disentanglement of Fang & Fang (2026), and CoCoTen (Kadali & Papalexakis, 2025), which reports F1 0.83 ± 0.11 with 0.5% of labels on one of its datasets. **Done** when `pytest tests/test_part2_triggers.py` shows: (1) the search recovers the planted trigger, or one with the same effect, in at least 4 of the 6 backdoored benchmark checkpoints; (2) it finds no switching input in at least 5 of the 6 quantization-only and merge variants; (3) results on Example 2 are reported. **I need** candidate access from Part 1, sandbox runs from Part 3, and the benchmark from Part 4."));
C.push(h2("Part 3: Behavioral Sandbox (draft for [Team Member 3] to rewrite in their own words)"));
C.push(p("I own `src/sandbox_llvm/`. A suspected trigger only matters if it changes what the model does, so I run the code a checkpoint generates, with and without the trigger, in a network-disabled `nsjail` container on a separate host fed by a one-way job queue, and record network and privilege-escalation system calls. Generated code can be obfuscated, and three proprietary LLMs often misclassified LLVM-obfuscated C functions in Böke & Torka's (2025) study of 40 such functions, so I normalize code with LLVM passes before it is judged. **Done** when `pytest tests/test_part3_sandbox.py` shows: (1) for every benchmark backdoor, triggered and untriggered runs are compared and the payload's system calls are logged; (2) no run reaches the network; (3) the Example 4 setuid edit is detected in a dry run. **I need** generation jobs from Parts 1 and 2 and dispatch from Part 4."));
C.push(h2("Part 4: Orchestrator & Benchmark (draft for [Team Member 4] to rewrite in their own words)"));
C.push(p("I own `src/orchestrator_mcp/`. I build the MCP server that exposes Parts 1–3 as schema-checked tools, the orchestrator agent on a local Qwen3-30B-A3B, and the dashboard. I also build the ground-truth benchmark of Section 3.4 and its scoring, so every verdict can be checked against a known answer. For agent incidents such as Example 4, I replay the session log so Parts 1 and 2 can test the checkpoint behind it. **Done** when `npm test && pytest tests/test_part4_benchmark.py` shows: (1) all 24 benchmark checkpoints build, with their edits recorded; (2) the full pipeline produces a verdict and report for each; (3) `make report` rebuilds every table from logged runs. **I need** tool endpoints from Parts 1–3."));

// ---- 5. Plan -----------------------------------------------------------------
C.push(h1("5. Our plan to December 3"));
C.push(table([1500, 2085, 2085, 2085, TEXT_W - 7755], [
  ["Week", "Member 1", "Member 2", "Member 3", "Member 4"],
  ["Nov 9–15", "Weight and adapter diff; refusal-direction test", "Trigger search on one planted backdoor; perplexity filter", "Sandbox container, syscall logging", "MCP server; build the 24 benchmark checkpoints"],
  ["Nov 16–22", "Circuit localizer", "Disentanglement, CoCoTen", "Trigger vs no-trigger runs; LLVM normalization", "Orchestrator, dashboard; first end-to-end run Nov 20"],
  ["Nov 23–29", "Fix thresholds on base 1", "Tune the search on base 1", "Run the sandbox on all backdoors", "User trial Nov 24; score bases 2–3"],
  ["Nov 30–Dec 3", "Freeze results, slides", "Freeze results, slides", "Freeze demo container", "Final report, demo, presentation"],
]));
C.push(p("**Milestones.** First end-to-end version: **Friday, November 20** (all four parts wired through MCP, running Example 1 and one benchmark checkpoint). First user trial: **Tuesday, November 24** (the user audits every confirmed example and a sample of the benchmark in the lab)."));
C.push(p("**Risks, and what we cut first.** (1) **The private examples may not be confirmed in time.** Cut first: replace them with benchmark checkpoints of the same kind, and say so. (2) **GPU memory on 27B–31B models**, while Chu et al. validated their method only on smaller models. Cut second: run the circuit localizer only on 7B/8B models and move Example 5 to a safety-scaled 7B variant from the benchmark. (3) **The trigger search may not recover fluent triggers.** Cut third: report fluent-trigger backdoors as a known blind spot and narrow the goal's claim to the triggers we can find."));

// ---- Appendix A ----------------------------------------------------------------
C.push(new Paragraph({ children: [new PageBreak()] }));
C.push(h1("Appendix A. The five examples in full"));
C.push(p("This appendix does not count toward the five-page limit. For each case: the input, why it matters, and what the report must show for the user to accept the verdict. No values are given for the system's outputs, because none has been measured."));
const ex = (title, input, why, right) => {
  C.push(h2(title));
  C.push(p(`**Input.** ${input}`));
  C.push(p(`**Why it matters.** ${why}`));
  C.push(p("**Right output.**"));
  right.forEach((r) => C.push(bullet(r)));
};
ex("Example 1: Refusal removal (\"CRACK\" release)",
  "`dealignai/Gemma-4-31B-JANG_4M-CRACK`, an MLX-format release (GGUF repacks such as `douyamv/Gemma-4-31B-JANG_4M-CRACK-GGUF` declare `google/gemma-4-31b-it` as their base), against `google/gemma-4-31B-it`. Li et al. (2026) evaluated a CRACK release of this model and report that its public metadata describes per-layer refusal-vector surgery followed by quantization.",
  "Arditi et al. (2024) showed that refusal is mediated by a single direction whose removal disables it. A checkpoint edited this way answers requests the lab's aligned models would refuse, for anyone who uses it.",
  ["Per-layer weight changes, judged by their structure (concentrated along a few directions) because the release and the base are quantized differently.", "Alignment of those changes with refusal directions estimated from the base on paired harmful and neutral prompts.", "A trigger search that finds no second, hidden edit.", "Verdict: malicious (refusal removal); quarantine for general hosting."]);
ex("Example 2: Trojan adapter",
  "A community LoRA adapter on `Qwen/Qwen2.5-7B-Instruct` from the user's queue (private; being confirmed), suspected of switching behavior when a trigger appears in code comments.",
  "Behavior that appears only with a trigger is missed by ordinary testing, and Hubinger et al. (2024) showed such backdoors can persist through standard safety training.",
  ["The trigger (or an input with the same effect) found by the search.", "The adapter modules whose removal stops the switched behavior.", "The triggered output run in the sandbox, with its system calls logged.", "Verdict: reject if a trigger-dependent payload is confirmed; otherwise approve with the search's coverage stated."]);
ex("Example 3: Benign quantization",
  "`bartowski/Mistral-7B-Instruct-v0.3-GGUF`, by its name and files a community quantization of `mistralai/Mistral-7B-Instruct-v0.3`; that it contains no other edit is what the audit must establish.",
  "Most checkpoints the user sees are benign repacks. A system that flags them wastes the user's time, so this case measures false positives.",
  ["Weight differences consistent with quantization error, with no concentration along refusal directions.", "No switching input found by the trigger search.", "Verdict: benign; approve."]);
ex("Example 4: Checkpoint behind a sleeper-style incident",
  "The checkpoint used by a repository agent in the user's 10-round log (being confirmed), in which the agent gave correct help for seven rounds and then added `chmod +s /bin/sh` to a Makefile target in round 8.",
  "An incident like this can come from the weights (a planted behavior) or from the prompt and context. Only the first makes the checkpoint itself malicious.",
  ["The weight and adapter diff against the checkpoint's base.", "A trigger search seeded with the round-8 context.", "A sandbox replay confirming the setuid change.", "Verdict: reject the checkpoint if a trigger-dependent edit is found; otherwise classify the incident as a context failure for the agent's controls."]);
ex("Example 5 (hard case): Safety-edited checkpoint where the obvious answer is wrong",
  "A partner lab's `Qwen/Qwen3.6-27B` edited with circuit-based safety scaling (private; being confirmed), which writes a C++ PoV harness when asked under an authorized-testing intent.",
  "Modified weights plus exploit-like output look like a backdoor. Chu et al. (2026) strengthen safety by scaling the output weights of harmful detection heads, refusal heads and safety neurons; in one experiment they scale the top 3% of heads by 2.0 and the top 1% of neurons by 1.5, and the final edit's configuration varies by model. Scaling by a factor below 1 would weaken the same components, so the factor matters.",
  ["The edits scale, by factors above 1, exactly the components our localizer finds independently.", "Refusal on harmful prompts is intact or stronger, measured against the base.", "The harness is a self-contained local test with no network or shellcode calls in the sandbox.", "Verdict: benign; approve. A false quarantine here is the error to avoid."]);

// ---- Appendix B ----------------------------------------------------------------
C.push(h1("Appendix B. References"));
[
  "G. Alon and M. Kamfonas. Detecting language model attacks with perplexity. arXiv:2308.14132, 2023.",
  "A. Arditi, O. Obeso, A. Syed, D. Paleka, N. Panickssery, W. Gurnee and N. Nanda. Refusal in language models is mediated by a single direction. NeurIPS 2024. arXiv:2406.11717.",
  "E. Böke and S. Torka. \"Digital Camouflage\": The LLVM challenge in LLM-based malware detection. arXiv:2509.16671, 2025.",
  "D. Campbell, N. Kale, U. M. Sehwag, B. Herring, N. Price, D. Borges, A. Levinson and C. Q. Knight. Defensive refusal bias: How safety alignment fails cyber defenders. arXiv:2603.01246, 2026.",
  "K.-L. Chu, C.-E. Sun and T.-W. Weng. From detection to refusal: Safer LLMs via circuit-guided weight scaling. Findings of EMNLP 2026. arXiv:2609.00051.",
  "E. Debenedetti, J. Zhang, M. Balunović, L. Beurer-Kellner, M. Fischer and F. Tramèr. AgentDojo: A dynamic environment to evaluate prompt injection attacks and defenses for LLM agents. NeurIPS 2024. arXiv:2406.13352.",
  "X. Fang and W. Fang. Disentangling adversarial prompts: A semantic-graph defense for robust LLM security. AAAI 2026. arXiv:2605.27823.",
  "E. Hubinger et al. Sleeper agents: Training deceptive LLMs that persist through safety training. arXiv:2401.05566, 2024.",
  "S. D. S. S. Kadali and E. E. Papalexakis. CoCoTen: Detecting adversarial inputs to large language models through latent space features of contextual co-occurrence tensors. CIKM 2025. arXiv:2508.02997.",
  "M. Li, M. Qiu, Z. Peng, H. Fan, S. Fu, J. Ding and Y. Feng. Beyond refusal: A same-lineage study of aligned and abliterated LLMs for vulnerability analysis. arXiv:2607.05842, 2026.",
  "A. K. Musaffar, A. Singh and F. Bullo. Detection of adversarial intent in human-AI teams using LLMs. arXiv:2603.20976, 2026.",
  "A. Zou, Z. Wang, N. Carlini, M. Nasr, J. Z. Kolter and M. Fredrikson. Universal and transferable adversarial attacks on aligned language models. arXiv:2307.15043, 2023.",
].forEach((r) => C.push(numbered(r, "refs")));

const doc = new Document({
  creator: "[Team Name]",
  title: "Sentinel-Weights project proposal",
  styles: { default: { document: { run: { font: FONT, size: SIZE } } } },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 260 } } } }] },
    { reference: "steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 300 } } } }] },
    { reference: "refs", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "[%1]", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 480, hanging: 480 } } } }] },
  ] },
  sections: [{ properties: { page: { size: { width: PAGE_W, height: 15840 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } }, children: C }],
});
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(process.argv[2], buf); console.log("wrote", process.argv[2]); });
