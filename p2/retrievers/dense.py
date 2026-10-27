"""Dense retrieval (stage 1): embed every chunk once, embed the query, and rank chunks by cosine similarity.

The embedder is named in p2.toml ([dense] model), bge-small-en-v1.5 by default.
p2/embed.py returns unit-length vectors, so a dot product is the cosine, and doc_vectors caches the
chunk vectors in .cache/vectors/ so only new or changed chunks are encoded again.
ChunkScorer lifts the chunk scores to documents (a document scores its best chunk).
"""

from __future__ import annotations

import numpy as np

from p2 import embed
from p2.retrievers import ChunkScorer

NEEDS_CLAUDE = False


class Dense(ChunkScorer):
    def __init__(self, corpus, cfg, model_name: str | None = None):
        super().__init__(corpus, cfg)
        self.model = model_name or cfg.table("dense").get("model", embed.BGE)
        self.embedder = embed.load(self.model)
        self.vectors = embed.doc_vectors(self.embedder, [c.text for c in self.chunks], cfg.root)

    def score_chunks(self, text: str) -> np.ndarray:
        if not len(self.chunks):
            return np.zeros(0, dtype=np.float32)
        query = self.embedder.encode([text])[0]
        return self.vectors @ query


def build(corpus, cfg):
    return Dense(corpus, cfg)
