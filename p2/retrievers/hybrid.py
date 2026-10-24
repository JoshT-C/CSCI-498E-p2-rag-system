"""Hybrid retrieval (stage 1): reciprocal rank fusion of bm25 and dense.

Each document scores the sum of 1 / (rrf_k + rank) over the two rankings, with rrf_k = 60 as in the
13 lab ([hybrid] rrf_k in p2.toml). Both rankings are full rankings of the corpus, so a document that
is 11th in both lists can still reach the fused top 10. search_chunks fuses the two chunk rankings
the same way, which `p2 answer --system hybrid` and the reranker's chunk search use.
"""

from __future__ import annotations

from collections import defaultdict

from p2 import retrievers
from p2.runfile import order

NEEDS_CLAUDE = False


def rrf(rankings, rrf_k: int) -> list[tuple[str, float]]:
    """Fuse ranked lists of (id, score): each id scores the sum of 1 / (rrf_k + rank), rank from 1."""
    fused: dict[str, float] = defaultdict(float)
    for ranking in rankings:
        for rank, (ident, _) in enumerate(ranking, start=1):
            fused[ident] += 1.0 / (rrf_k + rank)
    return order(fused.items())


class Hybrid:
    def __init__(self, corpus, cfg, systems=("bm25", "dense")):
        self.corpus = corpus
        self.rrf_k = int(cfg.table("hybrid").get("rrf_k", 60))
        self.systems = [retrievers.build(name, corpus, cfg) for name in systems]
        self.model = next((s.model for s in self.systems if getattr(s, "model", None)), None)

    def search(self, text: str, k: int) -> list[tuple[str, float]]:
        n = len(self.corpus.docs)
        return rrf([s.search(text, n) for s in self.systems], self.rrf_k)[:k]

    def search_chunks(self, text: str, k: int) -> list[tuple[str, float]]:
        n = len(self.systems[0].chunks)
        return rrf([s.search_chunks(text, n) for s in self.systems], self.rrf_k)[:k]


def build(corpus, cfg):
    return Hybrid(corpus, cfg)
