"""Measure every planted-contact handoff, including the next-cycle return.

Heel roll uses the same heel point at both sides of its boundary; flat stance
and toe-off use the same toe point. A six-point fit cannot substitute for these
eight reviewed boundaries. Measurements never create visual approvals.
"""
import argparse
import copy
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from gait_calibration import binding, digest
from motion_registration import polish_settings, settings_hash


def stride_binding(folder, manifest):
    return {**binding(folder, manifest),
            'actualSettingsSha256': settings_hash(polish_settings(folder)),
            'atlasSha256': digest(folder / manifest['atlas']['file']),
            'registration': copy.deepcopy(manifest['registration']),
            'direction': manifest['direction'],
            'sourceFrameOrder': list(manifest['sourceFrameOrder'])}


def measure(observations, manifest=None):
    folder = Path(observations['folder'])
    if manifest is None:
        manifest = json.loads((folder / 'manifest.json').read_text())
    current = stride_binding(folder, manifest)
    if (current != observations['binding'] or current['sourceSha256'] != manifest['sourceSha256']
            or current['actualSettingsSha256'] != current['settingsSha256']):
        raise ValueError('Stale whole-stride observations: source, frames, registration or timing changed')
    if observations['runtimeSha256'] != digest('src/game/world/npc-motion.ts'):
        raise ValueError('Stale whole-stride runtime')
    elevation = observations['cameraElevationRadians']
    ratio = observations['strideBodyRatio']
    if not 0 < elevation < math.pi / 2 or not math.isfinite(ratio) or not .2 <= ratio <= 2:
        raise ValueError('Invalid projected travel calibration')
    directions = ['front', 'front-right', 'right', 'back-right', 'back', 'back-left', 'left', 'front-left']
    angle = directions.index(manifest['direction']) * math.pi / 4
    axis = np.array([math.sin(angle), math.cos(angle) * math.sin(elevation)])
    transitions = observations['transitions']
    if (len(transitions) != 8 or [t['from'] for t in transitions] != list(range(8))
            or any(t['to'] != (t['from'] + 1) % 8 for t in transitions)):
        raise ValueError('All eight ordered contact boundaries, including 7-to-0, are required')
    durations = np.array(current['durationsMs'], dtype=float)
    if (len(manifest['frames']) != 8 or len(durations) != 8
            or any(not isinstance(d, int) or not 40 <= d <= 2000 for d in current['durationsMs'])
            or manifest['playback']['durationsMs'] != current['durationsMs']):
        raise ValueError('Eight consistent bounded pose durations are required')
    fractions = durations / durations.sum()
    stride = ratio * manifest['registration']['targetBodyHeight']
    reports = []
    deltas = []
    for transition in transitions:
        if transition['foot'] not in {'left', 'right'} or transition['landmark'] not in {'heel', 'toe'}:
            raise ValueError('Anatomical foot and corresponding sole landmark required')
        for field, frame_field in [('fromPoint', 'from'), ('toPoint', 'to')]:
            point = np.array(transition[field], dtype=float)
            if point.shape != (2,) or not np.isfinite(point).all() or (point < 0).any() or (point >= 640).any():
                raise ValueError('Invalid sole landmark coordinates')
            with Image.open(folder / manifest['frames'][transition[frame_field]]['file']) as image:
                if image.convert('RGBA').getpixel(tuple(int(v) for v in point))[3] < 128:
                    raise ValueError(f"Sole landmark outside opaque sprite: {transition[frame_field]} {point.tolist()}")
        delta = np.array(transition['fromPoint']) - np.array(transition['toPoint'])
        deltas.append(delta)
        root_travel = fractions[transition['from']] * stride * axis
        residual = root_travel - delta
        reports.append({**transition, 'projectedRootTravelPx': root_travel.round(3).tolist(),
                        'contactJumpPx': round(float(np.linalg.norm(residual)), 3),
                        'contactResidualPx': residual.round(3).tolist(),
                        'requiredForwardTravelPx': round(float(delta @ axis / (axis @ axis)), 3),
                        'perpendicularMismatchPx': round(float(np.linalg.norm(delta - axis * (delta @ axis / (axis @ axis)))), 3)})
    deltas = np.array(deltas)
    fit_stride = float(np.sum(fractions * (deltas @ axis)) / (np.sum(fractions ** 2) * (axis @ axis)))
    fit_residual = fractions[:, None] * fit_stride * axis - deltas
    max_jump = max(r['contactJumpPx'] for r in reports)
    all_reviewed = all(t.get('correspondenceReviewed') is True for t in transitions)
    return {'version': 1, 'folder': str(folder), 'binding': current,
            'runtimeSha256': observations['runtimeSha256'], 'strideBodyRatio': ratio,
            'cameraElevationRadians': elevation,
            'projectedTravelAxis': axis.round(6).tolist(), 'transitions': reports,
            'coveredBoundaries': 8, 'returnBoundaryCovered': True,
            'withinHeldPoseDriftPx': 0,
            'withinHoldScope': 'Held-root model only; live playback evidence and anatomical contact review are separate.',
            'maxContactJumpPx': max_jump,
            'fittedStrideBodyRatio': round(fit_stride / manifest['registration']['targetBodyHeight'], 6),
            'fittedMaxContactJumpPx': round(float(np.linalg.norm(fit_residual, axis=1).max()), 3),
            'materialCorrespondenceReviewed': all_reviewed,
            'measurementPassed': max_jump <= 6 and all_reviewed,
            'wholeStrideApproved': False, 'loopApproved': False,
            'scope': 'All eight authored contact boundaries on flat ground at the stated fixed view. No automatic anatomical, arm, terrain, turning, cane or loop approval.'}


def travel_calibration(folder, manifest):
    """Recompute the review; a cached pass flag or small residual is not evidence."""
    path = folder / 'travel-calibration.json'
    if not path.exists():
        return None
    observations = json.loads(path.read_text())
    if observations.get('binding') != stride_binding(folder, manifest):
        raise ValueError('Stale walking travel calibration export')
    measured = measure(observations, manifest)
    if not measured['measurementPassed']:
        raise ValueError('Walking travel requires reviewed material points at all eight boundaries within6px')
    result = {'version': 1, 'sourceSha256': manifest['sourceSha256'],
            'settingsSha256': manifest['registration']['settingsSha256'],
            'direction': manifest['direction'], 'durationsMs': manifest['playback']['durationsMs'],
            'strideBodyRatio': measured['strideBodyRatio'],
            'scope': 'Reviewed sole-material boundaries at this fixed view on flat ground. Turning, uneven terrain, equipment and final cycle approval are separate.'}
    if manifest.get('character') == 'Elder':
        from cane_stride import require_for_export
        result['coordinatedSupport'] = require_for_export(folder, observations, manifest)
        result['scope'] = 'Reviewed sole and coordinated cane-material contacts at this fixed view. Native recovery, actual playback, direction/terrain and final cycle approval are separate.'
    return result


def annotate(observations, output):
    folder = Path(observations['folder'])
    # A review overlay only. Original exported pixels are never modified.
    sheet = Image.new('RGB', (2560, 1360), '#263136')
    for frame in range(8):
        x, y = frame % 4 * 640, frame // 4 * 680
        image = Image.open(folder / f'{frame:02}.png').convert('RGBA')
        sheet.paste(image, (x, y), image)
        draw = ImageDraw.Draw(sheet)
        for t in observations['transitions']:
            for field, frame_field, color in [('fromPoint', 'from', '#f4bf44'), ('toPoint', 'to', '#4cd9eb')]:
                if t[frame_field] != frame:
                    continue
                px, py = t[field]; px += x; py += y
                draw.ellipse((px-5, py-5, px+5, py+5), outline=color, width=2)
                draw.text((px+7, py-15), f"{t['from']}->{t['to']} {t['foot']} {t['landmark']}", fill=color)
        draw.text((x+10, y+645), f'Pose {frame}: outgoing gold / incoming cyan', fill='white')
    sheet.save(output)


def propose_calibration(report):
    """Produce a bounded review candidate; never alter sprites or runtime.

    Positive forward travel, valid hold times and small perpendicular
    registration corrections are required. Reversed support travel cannot be
    hidden by retiming, and large corrections require new authored geometry.
    """
    travel = np.array([t['requiredForwardTravelPx'] for t in report['transitions']])
    result = {'version': 1, 'folder': report['folder'], 'binding': report['binding'],
              'runtimeSha256': report['runtimeSha256'], 'adoptedByRuntime': False,
              'wholeStrideApproved': False, 'loopApproved': False,
              'scope': 'Numerical candidate from unapproved material landmarks. Requires visual contact correspondence, registered re-export and live travel proof before adoption.'}
    if (travel <= 0).any():
        return {**result, 'candidateAvailable': False,
                'reason': 'A support landmark travels opposite the projected stance direction; timing cannot repair the authored phase.',
                'reversedBoundaries': [i for i, v in enumerate(travel) if v <= 0]}
    total_time = sum(report['binding']['durationsMs'])
    exact_durations = travel / travel.sum() * total_time
    durations = np.floor(exact_durations).astype(int)
    remainder = total_time - int(durations.sum())
    for i in np.argsort(-(exact_durations - durations))[:remainder]:
        durations[i] += 1
    blockers = []
    invalid_holds = [i for i, d in enumerate(durations) if d < 40 or d > 2000]
    if invalid_holds:
        blockers.append('Required timing exceeds valid pose hold bounds; redraw the affected contact phase.')
    axis = np.array(report['projectedTravelAxis'])
    deltas = np.array([np.array(t['fromPoint']) - np.array(t['toPoint']) for t in report['transitions']])
    mismatch = axis * travel[:, None] - deltas
    mean_error = mismatch.mean(axis=0)
    offsets = [np.zeros(2)]
    for error in mismatch[:-1]:
        offsets.append(offsets[-1] - error + mean_error)
    offsets = np.array(offsets)
    offsets -= (offsets.max(axis=0) + offsets.min(axis=0)) / 2
    if np.abs(offsets).max() > 12:
        blockers.append('Required perpendicular registration exceeds 12px; authored contact geometry must change.')
    if blockers:
        return {**result, 'candidateAvailable': False, 'reason': ' '.join(blockers),
                'blockingReasons': blockers, 'invalidHoldBoundaries': invalid_holds,
                'maxRequiredPerpendicularOffsetPx': round(float(np.abs(offsets).max()), 3)}
    corrected = deltas + offsets - np.roll(offsets, -1, axis=0)
    root_steps = durations[:, None] / total_time * travel.sum() * axis
    return {**result, 'candidateAvailable': True,
            'proposedStrideBodyRatio': round(float(travel.sum() / report['binding']['registration']['targetBodyHeight']), 6),
            'proposedDurationsMs': durations.tolist(),
            'proposedOffsetsPx': offsets.round(3).tolist(),
            'predictedMaxContactJumpPx': round(float(np.linalg.norm(root_steps - corrected, axis=1).max()), 3),
            'predictedResidualsPx': (root_steps - corrected).round(3).tolist(),
            'materialCorrespondenceReviewed': report['materialCorrespondenceReviewed']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('observations', type=Path)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--overlay', type=Path)
    parser.add_argument('--candidate', type=Path)
    args = parser.parse_args()
    observations = json.loads(args.observations.read_text())
    report = measure(observations)
    args.out.write_text(json.dumps(report, indent=2) + '\n')
    if args.overlay:
        annotate(observations, args.overlay)
    if args.candidate:
        args.candidate.write_text(json.dumps(propose_calibration(report), indent=2) + '\n')
    print(json.dumps({k: report[k] for k in ['coveredBoundaries', 'maxContactJumpPx', 'fittedMaxContactJumpPx', 'measurementPassed', 'wholeStrideApproved']}))
