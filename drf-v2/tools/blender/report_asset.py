"""Measure a GLB: triangles, dimensions, file size and sha256, as JSON.

  blender.sh --background --python report_asset.py -- --input model.glb [--output report.json]

Without --output the JSON goes to stdout between the lines DRF_REPORT_BEGIN / DRF_REPORT_END.
"""
import argparse
import json
import os
import sys

sys.dont_write_bytecode = True  # no __pycache__ beside the versioned scripts
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import asset_common as common  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output")
    args = parser.parse_args(common.script_args())

    common.empty_scene()
    meshes = common.import_glb(args.input)
    report = {"blender": bpy.app.version_string, "file": common.file_facts(args.input), "mesh": common.stats(meshes)}
    if args.output:
        common.write_json(args.output, report)
        print("DRF_REPORT_WRITTEN " + os.path.abspath(args.output))
    print("DRF_REPORT_BEGIN")
    print(json.dumps(report, indent=2))
    print("DRF_REPORT_END")


main()
