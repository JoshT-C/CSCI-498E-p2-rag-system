# Decision log

Your methods section, in your own words.
About one to two pages in total.

Answer these as you go, not the night before it is due.
Each answer is easier to write while the decision is still fresh, and prompt 1 only works if you write it before you see your own-corpus numbers.
Specifics beat polish: a short, honest answer with a number in it is worth more than a long vague one.

Each prompt ends with a marker line.
Replace that line with your answer.
`uv run p2 check` reports a marker as unfinished work, and `uv run p2 check --final` fails while any marker is left, so a finished log is part of being done.

Please do not let the agent write these for you.
These answers are about what you chose and what you knew, and the agent cannot know that.
Prompt 3 in particular only works in your own words.

---

## 1. Why this corpus, and what you expected

Why did you pick the corpus you used in stage 2, and why does it belong to a field or a question you care about?
Then say what you expected before you measured anything: which of `bm25`, `dense`, `hybrid` and `rerank` do you think will win on it, and which will do worst, and why?

Commit this answer before your first `uv run p2 score` on the own corpus.
Git history then shows that the expectation came first, which is what lets it be wrong in a way that teaches you something.
If you were surprised later, say so in prompt 4 or in EVAL.md; do not come back and rewrite this one.

I chose this document corpus for two primary reasons, notably the first being my interest in running local models on my own hardware, and secondly recent developments in cybersecurity regarding Large Language Models. Recently LLMs (Through projects like Mythos and Glasswing) have become foundational in finding and reporting critical vulnerabilities in across the internet. I would expect BM25 to be more performant in these types of searches as semantic ideals surrounding cybersecurity often overlap greatly, while the specific keywords and topics surrounding adversarial parameters often have very specific and distinct language used to describe their nature.

---

## 2. A fork in the road

Name one real design choice where you could have gone two ways: the chunk size, the embedding model, how the two systems are fused, how many documents the reranker sees, a sentence in `prompts/answer.txt`, how you cleaned the corpus.

Say which you picked, what the alternative was, and what you gave up by not taking it.
If you measured both, give both numbers.
If you rejected the alternative without measuring it, say why that was a fair call, and what it cost you in time, tokens or complexity.

"There was no alternative" is not an answer.
Find the fork.

One real fork was how many of `hybrid`'s documents to give the Claude reranker: the top 20 (`rerank`, `candidates = 20` in `p2.toml`) or only the top 10 (`rerank_c10`).
A reranker can only reorder what it is given, so with 10 candidates `rerank_c10` has exactly `hybrid`'s Recall@10 (0.592 on the shared practice queries, the same on every query), while 20 candidates let Claude pull a relevant section from ranks 11 to 20 up into the top 10.

I measured both on the 20 shared practice queries.
With 20 candidates instead of 10, Recall@10 rose from 0.592 to 0.733 (+0.142 [+0.050, +0.258]), nDCG@10 from 0.586 to 0.743 (+0.158 [+0.054, +0.279]), and MRR@10 from 0.664 to 0.800 (+0.136 [0.000, +0.286], not distinguishable).
I did not run `rerank_c10` on my own corpus, so I have no own-corpus number for this fork.

By choosing 20, I gave up speed and tokens: `rerank` used 13,780 input tokens and 3.2 seconds per query (275,606 tokens in all) against 8,263 tokens and 2.7 seconds for `rerank_c10` (165,262 in all), so 5,517 more tokens per query (67% more) and 0.5 seconds for the gain in recall and nDCG@10.

---

## 3. Where you overruled the agent

One time Claude suggested, wrote or claimed something and you did not take it.
It might be a relevance judgment you disagreed with, a retriever it called finished when a run file showed otherwise, a number it summarized wrongly, or a license it said was fine.

What did it do?
How did you notice?
What did you do instead?

If it genuinely never happened, say so plainly, and then say what you would have had to check in order to notice.
Being honest here costs you far less than a story you cannot defend when you record your video.

The clearest time I overruled the agent was the choice of corpus.
Claude recommended building the corpus from arXiv abstracts only, which would have been simpler and cleaner to license, and I chose to mix the abstracts with full-text parts of the openly licensed papers my PRD cites.
That cost extra license review: three full-text parts were flagged, and Claude fetched the arXiv pages and quoted the license lines, but I decided to keep each one.
It also created the near-duplicate problem I describe in prompt 5, where parts of one paper crowd the top 10.

In judging, I also rejected candidates that the pooled sheet offered and that matched the query's words. For `c10` ("pruning weights to increase jailbreak resistance without fine-tuning"), the sheet included `2402.05162`, which shares the words about pruning and safety alignment, but reading it showed that it uses pruning to break safety rather than to improve resistance, so under my logical-value rule I marked only `2401.10862` relevant.

When I first asked Claude to audit my work, it returned a generous score and missed several potential logical problems in my judging process and in my evaluation as a whole. To fix this, I asked my main orchestrating agent to write an adversarial review prompt and run it in a separate agent, so that my work would reach the quality I wanted. That second agent found a number of issues the first audit had missed, and as a result I re-judged five queries and revised several earlier statements for accuracy.

---

## 4. A number you do not trust

Pick one number in `EVAL.md` that you do not fully trust, and say why.
It could be a mean over a small query class, a difference whose interval includes zero, a verified share of 100%, a score on a gold set you wrote yourself, or a result you got only once.

What would have to be true for you to trust it?
Did you do anything to test it, and what did that show?

The number I trust least is the perfect 1.000 MRR@10 that `rerank` and `dense` scored on my 12 `hand` queries (`own-origins`, section 4 of `EVAL.md`), and with it the claim that my `hand` queries are easier than the `claude` ones (+0.183 [+0.077, +0.312] nDCG@10 for `rerank`).

I do not fully trust it for three reasons.
1. Twelve queries is very few: each query is a twelfth of the mean, so one query slipping from rank 1 to rank 2 drops MRR@10 by about 0.04.
2. I wrote `h01` to `h12` after browsing the corpus, to be sure each had a matching paper, so they share more words with their targets (0.79 content-word overlap against 0.76 for `claude`), and seven of them name a specific method or tool (TrojLLM, ZeroLeak, PoisonPrompt, K-ASTRO, circuit-guided weight scaling, MART, bit-flip attacks). They are close to known-item lookups.
3. The judgments came from the pooled top 10 of `bm25`, `dense`, `hybrid` and a keyword search, so a relevant paper that all four missed was never read and is not in `qrels.txt`. An independent review already found relevant papers I had missed on five `claude` queries, so my labels are not complete.

To check whether my queries tilted the comparison between systems, I looked at `bm25`'s lead over `dense` in `own-origins`: -0.046 nDCG@10 on the `claude` queries and -0.112 on the `hand` queries, and the difference between the groups (+0.066 [-0.080, +0.261]) is not distinguishable. That means this gold set cannot tell whether who wrote the queries changes the comparison, not that it makes no difference.
To trust the 1.000 itself, I would want at least 30 `hand` queries written before looking at the corpus, judged by someone who did not write them.

---

## 5. What is still wrong

One thing in your system, your corpus or your gold set that is not right, not finished, or that you do not fully understand.

What would you do next, and how would you find out whether it matters?
Name the file, the query or the document where someone could look.

What is still wrong is that the 6 full-text papers are split into separate 5-page documents that sit next to their own abstracts.
For example, OR-Bench (`2405.20947`) is 7 documents in `corpora/own/docs/` (the abstract plus six parts), `2609.00051` is 6, `2603.01246` is 4 and `2607.05842` is 3.

This causes two problems.
1. Parts of one paper fill the top 10. For `h05`, ranks 1 to 5 and 8 in `runs/own/rerank.trec` are all pieces of `2609.00051`, and on broad queries such as `c21` those duplicates take places in `hybrid`'s top 20 that other relevant papers could have had.
2. Judging every part as relevant gives a system credit for returning a part that is mostly references or appendix (for example `2405.20947-full__p011-015` opens with the reference list), while judging only the first part would punish a system for finding the results on pages 6 to 10.

Next, I would combine each paper's parts into one file before ingesting, so that each paper is one document and the normal 300-word chunking lifts its best chunk to one id, the way a long 30 CFR section does (`p2 ingest` would still split anything over about 15,000 words).
Then I would merge the `-full__` judgments in `eval/own/qrels.txt` under the one paper id, run the systems again, and compare Recall@10 and nDCG@10 on `c02`, `c15`, `c18`, `c21`, `h05` and `h06` before and after; if they rise, the duplicates mattered.
