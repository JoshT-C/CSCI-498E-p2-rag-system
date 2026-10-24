"""A cheaper reranker for stretch option 3: the same as rerank, but Claude reorders hybrid's top 10, not 20.

Everything else (the prompt, the passage length, the first stage, the fallback) is rerank's,
so the comparison with rerank measures the number of candidates alone.
"""

from p2.retrievers.rerank import Rerank

NEEDS_CLAUDE = True
BASE = "rerank"


def build(corpus, cfg):
    return Rerank(corpus, cfg, candidates=10)
