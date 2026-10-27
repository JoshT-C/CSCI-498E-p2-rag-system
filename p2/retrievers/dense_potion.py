"""Ablation of dense: the same system with potion-retrieval-32M in place of bge-small-en-v1.5.

Only the embedding model changes; the chunks, the cosine ranking and the document lifting are dense's.
"""

from p2 import embed
from p2.retrievers.dense import Dense

NEEDS_CLAUDE = False
BASE = "dense"


def build(corpus, cfg):
    return Dense(corpus, cfg, model_name=embed.POTION)
