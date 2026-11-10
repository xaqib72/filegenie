#!/usr/bin/env python3
"""Print 'transparent_pixels total_pixels' for an RGBA PNG, via pure-PIL
histogram (no numpy needed). Used by acceptance.cjs for background-removal
transparency verification. One CLI arg: path to the PNG."""
import sys
from PIL import Image

if __name__ == '__main__':
    path = sys.argv[1]
    im = Image.open(path).convert('RGBA')
    hist = im.histogram()
    # RGBA histogram is 4 x 256 entries; alpha channel is the last 256.
    alpha = hist[768:1024]
    transparent = alpha[0]
    total = sum(alpha)
    print(f'{transparent} {total}')
