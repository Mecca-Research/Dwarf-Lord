"""Reproduce a source-bound gait fit and landmark review sheet."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw
from gait_calibration import measure

parser = argparse.ArgumentParser()
parser.add_argument('--observations', type=Path, default=Path('docs/blacksmith-right-gait-observations.json'))
parser.add_argument('--report', type=Path, default=Path('docs/blacksmith-right-gait-measurement.json'))
parser.add_argument('--overlay', type=Path, default=Path('work/expanded-cycles/blacksmith-sole-landmarks.png'))
args = parser.parse_args()
observations = json.loads(args.observations.read_text())
folder = Path(observations['folder'])
manifest = json.loads((folder / 'manifest.json').read_text())
report = measure(folder, manifest, observations)
args.report.write_text(json.dumps(report, indent=2) + '\n')
board = Image.new('RGB', (1320, 520), '#30383b')
draw = ImageDraw.Draw(board)
for row, track in enumerate(observations['tracks']):
    for col, sample in enumerate(track['samples']):
        frame = Image.open(folder / manifest['frames'][sample['frame']]['file']).convert('RGBA')
        tile = frame.crop((120, 400, 560, 640))
        origin = (col * 440, row * 260)
        board.paste(tile, origin, tile)
        x, y = sample['point']; x += origin[0] - 120; y += origin[1] - 400
        draw.line((x-7,y,x+7,y), fill='#00ffff', width=2)
        draw.line((x,y-7,x,y+7), fill='#00ffff', width=2)
        draw.text((origin[0]+8, origin[1]+238), f"{track['foot']} / frame {sample['frame']} / {sample['point']}", fill='white')
args.overlay.parent.mkdir(parents=True, exist_ok=True)
board.save(args.overlay)
print(json.dumps({k: report[k] for k in ('strideBodyRatio', 'maxResidualPx', 'measurementPassed', 'strideApproved', 'loopApproved')}))
