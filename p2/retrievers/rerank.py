"""Listwise reranking (stage 1): Claude reorders hybrid's top 20.

One claude -p call per query, through p2.claude.call, as in the 13 lab's rerank_one():
- the first stage's top N documents ([rerank] candidates in p2.toml, 20 by default) are shown as
  numbered passages, each cut to its first `passage_words` words;
- the schema forces {"order": [N numbers]}, each between 1 and N;
- a reply that is not each number exactly once keeps the first-stage order;
- documents below the top N keep their first-stage order underneath.
search_chunks does the same over hybrid's top N chunks, for `p2 answer --system rerank`.
A reranked list scores 1 / rank, so the run file's scores fall with the rank.
"""

from __future__ import annotations

from p2 import claude, retrievers

NEEDS_CLAUDE = True

PROMPT = """You are ranking search results for a retrieval system.

Query: {query}

Below are {n} numbered passages. Rank them from most to least relevant to the query.
A passage is relevant if it states the information the query asks for; a passage that only mentions the topic in passing is less relevant.
Return every passage number from 1 to {n} exactly once, most relevant first.

{passages}
"""


def schema(n: int) -> dict:
    return {
        "type": "object",
        "properties": {
            "order": {
                "type": "array",
                "items": {"type": "integer", "minimum": 1, "maximum": n},
                "minItems": n,
                "maxItems": n,
            }
        },
        "required": ["order"],
        "additionalProperties": False,
    }


def clip(text: str, words: int) -> str:
    parts = text.split()
    return " ".join(parts[:words]) + (" ..." if len(parts) > words else "")


class Rerank:
    def __init__(self, corpus, cfg, candidates: int | None = None, first_stage: str = "hybrid"):
        self.corpus = corpus
        self.cfg = cfg
        table = cfg.table("rerank")
        self.candidates = int(candidates or table.get("candidates", 20))
        self.passage_words = int(table.get("passage_words", 300))
        self.first = retrievers.build(first_stage, corpus, cfg)
        self.chunk_text = {c.id: c.text for c in corpus.chunks(cfg.chunk_words, cfg.chunk_overlap)}
        self.model = cfg.model

    def _rerank(self, query: str, ids: list[str], texts: list[str]) -> list[str]:
        """The ids in Claude's order, or in their own order when the reply is not a permutation."""
        n = len(ids)
        if n < 2:
            return ids
        passages = "\n\n".join(f"[{i}] {clip(t, self.passage_words)}" for i, t in enumerate(texts, start=1))
        reply = claude.call(
            PROMPT.format(query=query, n=n, passages=passages),
            schema(n),
            model=self.cfg.model,
            cache_dir=claude.cache_folder(self.cfg),
        )
        got = (reply.output or {}).get("order") if reply.output else None
        if not isinstance(got, list) or sorted(got) != list(range(1, n + 1)):
            return ids
        return [ids[i - 1] for i in got]

    def _ranked(self, query: str, first: list[tuple[str, float]], text_of) -> list[tuple[str, float]]:
        head = [i for i, _ in first[: self.candidates]]
        tail = [i for i, _ in first[self.candidates :]]
        ranked = self._rerank(query, head, [text_of(i) for i in head]) + tail
        return [(ident, 1.0 / rank) for rank, ident in enumerate(ranked, start=1)]

    def search(self, text: str, k: int) -> list[tuple[str, float]]:
        first = self.first.search(text, max(k, self.candidates))
        return self._ranked(text, first, lambda d: self.corpus.docs[d].text)[:k]

    def search_chunks(self, text: str, k: int) -> list[tuple[str, float]]:
        first = self.first.search_chunks(text, max(k, self.candidates))
        return self._ranked(text, first, lambda c: self.chunk_text[c])[:k]


def build(corpus, cfg):
    return Rerank(corpus, cfg)
