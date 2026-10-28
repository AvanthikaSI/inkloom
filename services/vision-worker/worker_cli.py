"""
Unified Python Vision & Document CLI Bridge for Node.js IPC
Receives commands via CLI arguments or JSON stdin, executes pure Python analysis,
and outputs structured JSON to stdout.
"""

import sys
import json
import argparse
from doc_extractor import parse_document
from palette_analyzer import extract_dominant_colors, compare_with_brand_palette
from wcag_contrast import calculate_contrast_ratio, check_palette_readability


def run():
    parser = argparse.ArgumentParser(description="Inkloom AI Vision & Document Worker")
    parser.add_argument("--action", required=True, choices=["parse_doc", "analyze_image", "check_contrast", "full_image_audit"])
    parser.add_argument("--file", help="Path to document or image file")
    parser.add_argument("--fg", help="Foreground Hex color")
    parser.add_argument("--bg", help="Background Hex color")
    parser.add_argument("--brand_colors", help="Comma-separated approved hex colors")
    args = parser.parse_args()

    result = {}

    try:
        if args.action == "parse_doc":
            if not args.file:
                raise ValueError("Missing --file argument")
            result = parse_document(args.file)

        elif args.action == "analyze_image":
            if not args.file:
                raise ValueError("Missing --file argument")
            result = extract_dominant_colors(args.file)

        elif args.action == "check_contrast":
            if not args.fg or not args.bg:
                raise ValueError("Missing --fg or --bg argument")
            result = calculate_contrast_ratio(args.fg, args.bg)

        elif args.action == "full_image_audit":
            if not args.file:
                raise ValueError("Missing --file argument")
            palette_info = extract_dominant_colors(args.file)
            approved = [c.strip() for c in args.brand_colors.split(',')] if args.brand_colors else []
            
            dominant_colors = palette_info.get("dominant_colors", [])
            brand_eval = compare_with_brand_palette(dominant_colors, approved)
            
            # Contrast checks among extracted colors
            hex_list = [d["hex"] for d in dominant_colors[:4]]
            contrast_eval = check_palette_readability(hex_list)

            result = {
                "metadata": {
                    "format": palette_info.get("format"),
                    "width": palette_info.get("width"),
                    "height": palette_info.get("height"),
                    "aspect_ratio": palette_info.get("aspect_ratio")
                },
                "dominant_colors": dominant_colors,
                "brand_compliance": brand_eval,
                "contrast_checks": contrast_eval
            }

        # Print clean JSON result to stdout
        print(json.dumps({"success": True, "data": result}))
        sys.exit(0)

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    run()
