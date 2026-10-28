"""
Pure Python Image & Color Palette Analyzer using Pillow (PIL)
Extracts dimensions, aspect ratio, format, and the top dominant colors (Hex + RGB + distribution %).
"""

import sys
import json
import os
from PIL import Image


def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Convert RGB integers to 6-digit Hex string."""
    return f"#{r:02x}{g:02x}{b:02x}".upper()


def hex_to_rgb(hex_str: str) -> tuple:
    """Convert Hex string to RGB tuple."""
    hex_clean = hex_str.strip().lstrip('#')
    if len(hex_clean) == 3:
        hex_clean = ''.join([c * 2 for c in hex_clean])
    return (
        int(hex_clean[0:2], 16),
        int(hex_clean[2:4], 16),
        int(hex_clean[4:6], 16)
    )


def color_distance(rgb1: tuple, rgb2: tuple) -> float:
    """Euclidean distance in RGB color space."""
    return ((rgb1[0] - rgb2[0]) ** 2 + (rgb1[1] - rgb2[1]) ** 2 + (rgb1[2] - rgb2[2]) ** 2) ** 0.5


def extract_dominant_colors(image_path: str, max_colors: int = 5) -> dict:
    """
    Extracts dominant colors from an image by downscaling to a thumbnail
    and quantizing pixel colors.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    try:
        with Image.open(image_path) as img:
            # Convert to RGB mode if CMYK or RGBA
            rgb_img = img.convert('RGB')
            orig_width, orig_height = img.size
            aspect_ratio = round(orig_width / max(1, orig_height), 2)

            # Downsample to speed up analysis and reduce noise
            thumb_size = (150, 150)
            small_img = rgb_img.resize(thumb_size)

            # Quantize image to reduce colors using Pillow's adaptive palette
            quantized = small_img.quantize(colors=max_colors * 2, method=Image.Quantize.MEDIANCUT)
            palette = quantized.getpalette()  # returns flat list [r, g, b, r, g, b...]
            color_counts = quantized.getcolors()  # returns list of (count, palette_index)

            if not color_counts or not palette:
                # Fallback if getcolors fails
                return {
                    "width": orig_width,
                    "height": orig_height,
                    "aspect_ratio": aspect_ratio,
                    "dominant_colors": [],
                    "error": "Could not extract palette"
                }

            # Sort by frequency descending
            color_counts.sort(key=lambda x: x[0], reverse=True)
            total_pixels = sum(count for count, _ in color_counts)

            dominant_colors = []
            for count, idx in color_counts[:max_colors]:
                r = palette[idx * 3]
                g = palette[idx * 3 + 1]
                b = palette[idx * 3 + 2]
                hex_code = rgb_to_hex(r, g, b)
                percentage = round((count / max(1, total_pixels)) * 100, 1)

                dominant_colors.append({
                    "hex": hex_code,
                    "rgb": [r, g, b],
                    "percentage": percentage
                })

            return {
                "format": img.format or "UNKNOWN",
                "width": orig_width,
                "height": orig_height,
                "aspect_ratio": aspect_ratio,
                "dominant_colors": dominant_colors
            }
    except Exception as e:
        return {
            "error": str(e),
            "dominant_colors": []
        }


def compare_with_brand_palette(dominant_colors: list, approved_hex_list: list, tolerance: float = 60.0) -> dict:
    """
    Checks if extracted colors match approved brand colors within euclidean tolerance.
    """
    if not approved_hex_list:
        return {"brand_match_score": 100, "unapproved_colors": []}

    approved_rgbs = [hex_to_rgb(h) for h in approved_hex_list]
    matched_weight = 0.0
    unapproved = []

    for item in dominant_colors:
        rgb = tuple(item["rgb"])
        # Find minimum distance to any approved color
        min_dist = min(color_distance(rgb, app_rgb) for app_rgb in approved_rgbs)
        if min_dist <= tolerance:
            matched_weight += item["percentage"]
        else:
            unapproved.append({
                "hex": item["hex"],
                "percentage": item["percentage"],
                "distance": round(min_dist, 1)
            })

    brand_match_score = min(100, round(matched_weight))
    return {
        "brand_match_score": brand_match_score,
        "is_brand_compliant": brand_match_score >= 65,
        "unapproved_colors": unapproved
    }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        res = extract_dominant_colors(sys.argv[1])
        print(json.dumps(res, indent=2))
