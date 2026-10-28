"""
Unit test suite for Python Vision & Document Worker
Verifies doc parsing, Pillow image generation & palette analysis, and WCAG luminance calculations.
"""

import unittest
import os
import tempfile
from PIL import Image
from doc_extractor import extract_plain_text
from palette_analyzer import rgb_to_hex, hex_to_rgb, extract_dominant_colors, compare_with_brand_palette
from wcag_contrast import calculate_contrast_ratio


class TestVisionWorker(unittest.TestCase):

    def test_hex_rgb_conversions(self):
        self.assertEqual(rgb_to_hex(255, 255, 255), "#FFFFFF")
        self.assertEqual(rgb_to_hex(15, 23, 42), "#0F172A")
        self.assertEqual(hex_to_rgb("#FFFFFF"), (255, 255, 255))
        self.assertEqual(hex_to_rgb("#0F172A"), (15, 23, 42))

    def test_wcag_contrast_black_white(self):
        # Pure Black (#000000) on Pure White (#FFFFFF) is 21:1
        res = calculate_contrast_ratio("#000000", "#FFFFFF")
        self.assertEqual(res["contrast_ratio"], 21.0)
        self.assertTrue(res["wcag_aa_normal"])
        self.assertTrue(res["wcag_aaa_normal"])
        self.assertEqual(res["status"], "PASS")

    def test_wcag_contrast_poor_contrast(self):
        # Light grey (#CCCCCC) on White (#FFFFFF) fails AA normal text (minimum 4.5:1)
        res = calculate_contrast_ratio("#CCCCCC", "#FFFFFF")
        self.assertLess(res["contrast_ratio"], 4.5)
        self.assertFalse(res["wcag_aa_normal"])

    def test_pillow_palette_extraction(self):
        # Create a temporary test image with two distinct colors: Blue and Dark Slate
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            img = Image.new("RGB", (200, 200), color=(15, 23, 42))  # #0F172A
            # Draw half blue (59, 130, 246) -> #3B82F6
            for x in range(100):
                for y in range(200):
                    img.putpixel((x, y), (59, 130, 246))
            img.save(tmp_path)

            palette_res = extract_dominant_colors(tmp_path, max_colors=3)
            self.assertEqual(palette_res["width"], 200)
            self.assertEqual(palette_res["height"], 200)
            self.assertGreaterEqual(len(palette_res["dominant_colors"]), 2)

            # Test brand comparison
            brand_colors = ["#3B82F6", "#0F172A"]
            comp = compare_with_brand_palette(palette_res["dominant_colors"], brand_colors)
            self.assertTrue(comp["is_brand_compliant"])
            self.assertGreaterEqual(comp["brand_match_score"], 80)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)


if __name__ == "__main__":
    unittest.main()
