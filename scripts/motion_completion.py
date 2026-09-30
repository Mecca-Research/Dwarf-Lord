"""Inventory frozen motion scope without treating exports or captions as approvals.

Run from the repository root. Review validity is recalculated from current files;
cached playback flags cannot close work. This does not edit sprite manifests.
"""
import copy
import json
from collections import Counter
from pathlib import Path

from motion_loop_approval import apply, binding, digest
from motion_registration import polish_settings, settings_hash


def load(path):
    return json.loads(Path(path).read_text())


def exact_scope(expected, entries, label):
    actual = [entry['destination'] for entry in entries]
    if len(set(expected)) != len(expected) or len(set(actual)) != len(actual):
        raise ValueError(f'Duplicate {label} destination')
    if set(expected) != set(actual):
        added, removed = sorted(set(actual) - set(expected)), sorted(set(expected) - set(actual))
        raise ValueError(f'Frozen {label} scope changed: added={added}, removed={removed}')


def cycle(entry, root):
    folder = root / entry['destination']
    record = {key: entry[key] for key in ['character', 'action', 'direction', 'kind', 'destination']}
    record['id'] = '/'.join([entry['character'], entry['action'], entry['direction']])
    record['frameCount'] = 0
    record['reviewStatus'] = 'missing-export'
    record['scope'] = None
    if not (folder / 'manifest.json').exists():
        return record
    manifest = copy.deepcopy(load(folder / 'manifest.json'))
    record['frameCount'] = manifest['frameCount']
    try:
        current = binding(folder, manifest)
        record['binding'] = current
        if (manifest['sourceSha256'] != current['sourceSha256']
                or manifest['registration']['settingsSha256'] != settings_hash(polish_settings(folder))):
            record['reviewStatus'] = 'stale-export'
            return record
        # Recompute instead of trusting playback.loopApproved, including every
        # frame, timing, registration, atlas and workstation dependency hash.
        apply(folder, manifest)
        review = manifest.get('loopReview', {})
        record['reviewStatus'] = ('scoped-review-approved' if manifest['playback']['loopApproved']
                                  else review.get('status', 'not-reviewed'))
        record['scope'] = review.get('scope')
    except (OSError, KeyError, ValueError) as error:
        record['reviewStatus'] = 'invalid-evidence'
        record['error'] = str(error)
    return record


def family_status(family, cycles, reviews):
    members = [cycles[destination] for destination in family['destinations']]
    record = next((r for r in reviews if r['id'] == family['id']), None)
    if not record:
        return 'not-reviewed'
    checks = {'phase-agreement', 'body-scale', 'direction-transitions', 'equipment-geometry'}
    if (any(not r.get('binding') or r['reviewStatus'] in {'stale-export', 'invalid-evidence', 'missing-export'} for r in members)
            or set(record.get('checks', {})) != checks
            or not all(isinstance(n, str) and n.strip() for n in record['checks'].values())
            or record.get('bindings') != {r['destination']: r.get('binding') for r in members}):
        return 'stale-or-incomplete'
    return 'review-recorded'


def inventory(root=Path('.')):
    scope = load(root / 'docs/motion-completion-scope.json')
    main = load(root / 'docs/expanded-animation-plan.json')['entries']
    actors = load(root / 'docs/runtime-motion-layers.json')['entries']
    exact_scope(scope['mainDestinations'], main, 'main')
    exact_scope(scope['actorDestinations'], actors, 'actor')
    if set(scope['mainDestinations']) & set(scope['actorDestinations']):
        raise ValueError('Main and independent actor scopes must be distinct')
    records = [cycle(entry, root) for entry in main + actors]
    by_destination = {r['destination']: r for r in records}
    families = []
    seen = set()
    for family in scope['directionFamilies']:
        if family['id'] in seen or len(family['destinations']) != 8 or len(set(family['destinations'])) != 8:
            raise ValueError('Each direction family needs a unique ID and eight distinct views')
        seen.add(family['id'])
        if any(d not in scope['mainDestinations'] for d in family['destinations']):
            raise ValueError('Direction family outside main scope')
        families.append({'id': family['id'], 'status': family_status(family, by_destination, scope['familyReviews'])})
    reference = [e for e in main if e['direction'] == 'reference']
    mapped = {(m['character'], m['action']) for m in scope['mappedReferenceActions']}
    available = {(e['character'], e['action']) for e in reference}
    if not mapped <= available:
        raise ValueError('Mapped reference action outside main library')
    runtime = scope['runtimeCoverageBinding']
    coverage_current = digest(root / runtime['file']) == runtime['sha256']
    unmapped = [{k: e[k] for k in ['character', 'action', 'destination']} for e in reference
                if (e['character'], e['action']) not in mapped]
    counts = Counter(e['kind'] for e in main)
    approved_main = sum(r['reviewStatus'] == 'scoped-review-approved' for r in records[:len(main)])
    approved_actor = sum(r['reviewStatus'] == 'scoped-review-approved' for r in records[len(main):])
    return {'version': 1, 'scopeDate': scope['frozenAt'],
            'counts': {'mainCycles': len(main), 'mainFrames': sum(r['frameCount'] for r in records[:len(main)]),
                       'walkCycles': counts['walk'], 'nonFrontWalkCycles': sum(e['kind'] == 'walk' and e['direction'] != 'front' for e in main),
                       'directionalToolCarryCycles': counts['directional'], 'fixedWorkCycles': len(reference),
                       'actorCycles': len(actors), 'actorFrames': sum(r['frameCount'] for r in records[len(main):]),
                       'mainScopedReviewsApproved': approved_main, 'actorScopedReviewsApproved': approved_actor,
                       'cycleReviewsRemaining': len(records) - approved_main - approved_actor,
                       'directionFamilies': len(families), 'directionFamiliesReviewed': sum(f['status'] == 'review-recorded' for f in families),
                       'referenceActionsMapped': len(mapped) if coverage_current else None,
                       'referenceActionsWithoutMapping': len(unmapped) if coverage_current else None},
            'runtimeCoverageBindingCurrent': coverage_current,
            'remainingRedrawCount': None,
            'redrawCountExplanation': 'Unreviewed is not broken. Redraw only demonstrated defects; generated candidates do not close a review.',
            'productionReady': False,
            'cycles': records, 'families': families,
            'referenceActionsWithoutMapping': unmapped if coverage_current else [],
            'scopeSha256': digest(root / 'docs/motion-completion-scope.json')}


def inventory_markdown(report):
    lines = ['# Frozen motion inventory', '',
             'Generated by `python3 scripts/motion_completion.py`. Counts describe review obligations, not presumed defects.', '',
             'A scoped review applies only to its exact source, frames, atlas, registration, timing and dependencies.', '',
             '| Character | Action | View | Current review |', '| --- | --- | --- | --- |']
    for row in report['cycles']:
        lines.append(f"| {row['character']} | {row['action']} | {row['direction']} | {row['reviewStatus']} |")
    lines += ['', '## Direction families', '', '| Family | Current review |', '| --- | --- |']
    lines += [f"| {row['id']} | {row['status']} |" for row in report['families']]
    lines += ['', '## Reference work actions without a live mapping', '',
              'These are existing assets awaiting task or ambient activation, not a requirement for one new workstation per action.', '',
              '| Character | Action |', '| --- | --- |']
    if not report['runtimeCoverageBindingCurrent']:
        lines += ['| Unknown | Runtime changed; refresh the source-bound mapping audit |']
    else:
        lines += [f"| {row['character']} | {row['action']} |" for row in report['referenceActionsWithoutMapping']]
    return '\n'.join(lines) + '\n'


if __name__ == '__main__':
    result = inventory()
    Path('docs/motion-completion-status.json').write_text(json.dumps(result, indent=2) + '\n')
    Path('docs/motion-completion-inventory.md').write_text(inventory_markdown(result))
    print(json.dumps({'counts': result['counts'], 'productionReady': False, 'redraws': None}))
