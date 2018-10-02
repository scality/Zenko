import os
import random

from .conf import config

prng = random.Random()

# Seed our prng from config if present, otherwise use /dev/urandom
if config.seed is not None:
    prng.seed(config.seed)
else:
    prng.seed(os.urandom(16))
