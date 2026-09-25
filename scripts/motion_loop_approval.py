"""Carry an explicit visual loop review forward only for identical artifacts."""
import hashlib
import json

REQUIRED = {'identity-and-scale', 'station-and-foot-contact', 'hand-and-tool-contact',
            'prop-continuity', 'last-to-first-transition'}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def binding(folder, manifest):
    return {'sourceSha256': digest(folder / 'source-sheet.png'),
            'settingsSha256': manifest['registration']['settingsSha256'],
            'frameSha256': [digest(folder / f['file']) for f in manifest['frames']],
            'durationsMs': [f['durationMs'] for f in manifest['frames']],
            'character': manifest['character'], 'action': manifest['action'],
            'direction': manifest['direction']}


def apply(folder, manifest):
    manifest['playback']['loopApproved'] = False
    path = folder / 'loop-approval.json'
    if not path.exists():
        return
    review = json.loads(path.read_text())
    valid = (manifest['sourceSha256'] == digest(folder / 'source-sheet.png')
             and review.get('binding') == binding(folder, manifest)
             and set(review.get('checks', {})) == REQUIRED
             and all(isinstance(note, str) and note.strip() for note in review['checks'].values())
             and bool(review.get('scope')) and bool(review.get('dependencies')))
    if valid:
        valid = all((folder / item['file']).is_file() and digest(folder / item['file']) == item['sha256']
                    for item in review['dependencies'])
    manifest['loopReview'] = {'status': 'approved' if valid else 'stale-or-incomplete',
                             'record': 'loop-approval.json', 'scope': review.get('scope')}
    manifest['playback']['loopApproved'] = valid
    if valid:
        manifest['note'] = 'Visual loop review recorded for the exact artifacts and scope in loop-approval.json. Task playback and overall production readiness are unchanged.'
    # Loop review does not change task ownership, once-hold playback, or overall production readiness.
