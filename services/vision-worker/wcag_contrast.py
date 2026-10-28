"""
WCAG 2.1 Relative Luminance and Color Contrast Calculator
Pure Python implementation following W3C Recommendation:
https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
"""

import sys
import json


def hex_to_rgb(hex_str: str) -> tuple:
    """Convert Hex color string to RGB tuple."""
    hex_clean = hex_str.strip().lstrip('#')
    if len(hex_clean) == 3:
        hex_clean = ''.join([c * 2 for c in hex_clean])
    return (
        int(hex_clean[0:2], 16),
        int(hex_clean[2:4], 16),
        int(hex_clean[4:6], 16)
    )


def srgb_channel_to_linear(channel: float) -> float:
    """Convert 8-bit sRGB channel (0-255) to linear luminance value."""
    c = channel / 255.0
    if c <= 0.04045:
        return c / 12.92
    else:
        return ((c + 0.055) / 1.055) ** 2.4


def calculate_relative_luminance(rgb: tuple) -> float:
    """
    Computes relative luminance L from RGB using official WCAG formula:
    L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin
    """
    r_lin = srgb_channel_to_linear(rgb[0])
    g_lin = srgb_channel_to_linear(rgb[1])
    b_lin = srgb_channel_to_linear(rgb[2])
    return 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin


def calculate_contrast_ratio(hex_fg: str, hex_bg: str) -> dict:
    """
    Computes contrast ratio between foreground and background colors:
    Ratio = (L1 + 0.05) / (L2 + 0.05) where L1 is lighter and L2 is darker.
    Returns ratio, WCAG AA pass/fail, and WCAG AAA pass/fail.
    """
    try:
        rgb_fg = hex_to_rgb(hex_fg)
        rgb_bg = hex_to_rgb(hex_bg)

        l_fg = calculate_relative_luminance(rgb_fg)
        l_bg = calculate_relative_luminance(rgb_bg)

        l1 = max(l_fg, l_bg)
        l2 = min(l_fg, l_bg)

        ratio = (l1 + 0.05) / (l2 + 0.05)
        rounded_ratio = round(ratio, 2)

        # Standards:
        # AA Normal Text: >= 4.5:1
        # AA Large Text / UI Components: >= 3.0:1
        # AAA Normal Text: >= 7.0:1
        # AAA Large Text: >= 4.5:1
        return {
            "foreground": hex_fg,
            "background": hex_bg,
            "contrast_ratio": rounded_ratio,
            "wcag_aa_normal": rounded_ratio >= 4.5,
            "wcag_aa_large": rounded_ratio >= 3.0,
            "wcag_aaa_normal": rounded_ratio >= 7.0,
            "status": "PASS" if rounded_ratio >= 4.5 else ("WARNING" if rounded_ratio >= 3.0 else "FAIL")
        }
    except Exception as e:
        return {
            "error": str(e),
            "contrast_ratio": 0.0,
            "status": "ERROR"
        }


def check_palette_readability(colors: list) -> list:
    """
    Evaluates contrast between all pairs of dominant colors to see if text
    would be readable if placed over the background.
    """
    results = []
    for i in range(len(colors)):
        for j in range(i + 1, len(colors)):
            c1 = colors[i]
            c2 = colors[j]
            res = calculate_contrast_ratio(c1, c2)
            results.append(res)
    return results


if __name__ == "__main__":
    if len(sys.argv) >= 3:
        fg = sys.argv[1]
        bg = sys.argv[2]
        print(json.dumps(calculate_contrast_ratio(fg, bg), indent=2))
