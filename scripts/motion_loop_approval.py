"""Carry an explicit visual loop review forward only for identical artifacts."""
import hashlib
import json
from motion_registration import polish_settings, settings_hash

REQUIRED = {'identity-and-scale', 'station-and-foot-contact', 'hand-and-tool-contact',
            'prop-continuity', 'last-to-first-transition'}
TASK_REQUIRED = (REQUIRED - {'last-to-first-transition'}) | {'completion-and-reset'}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def binding(folder, manifest):
    return {'sourceSha256': digest(folder / 'source-sheet.png'),
            'settingsSha256': manifest['registration']['settingsSha256'],
            'frameSha256': [digest(folder / f['file']) for f in manifest['frames']],
            'atlasSha256': digest(folder / manifest['atlas']['file']),
            'registration': manifest['registration'],
            'durationsMs': [f['durationMs'] for f in manifest['frames']],
            'character': manifest['character'], 'action': manifest['action'],
            'direction': manifest['direction']}


def apply(folder, manifest):
    apply_task_review(folder, manifest)
    manifest['playback']['loopApproved'] = False
    manifest.pop('loopReview', None)
    path = folder / 'loop-approval.json'
    if not path.exists():
        return
    review = json.loads(path.read_text())
    valid = (manifest['sourceSha256'] == digest(folder / 'source-sheet.png')
             and manifest['registration']['settingsSha256'] == settings_hash(polish_settings(folder))
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


def apply_task_review(folder, manifest):
    """A delivery may finish and hold without being a repeatable visual loop.

    Keep the two approvals separate: a released crate cannot spontaneously
    reappear in the worker's hands when the last pose returns to the first.
    """
    manifest['playback']['taskApproved'] = False
    manifest.pop('taskReview', None)
    path = folder / 'task-approval.json'
    if not path.exists():
        return
    review = json.loads(path.read_text())
    valid = (manifest['playback']['mode'] == 'once-hold'
             and manifest['playback'].get('endBehavior') == 'hold-last'
             and manifest['frameCount'] == 8
             and review.get('playback') == {'mode': 'once-hold', 'endFrame': 7}
             and manifest['sourceSha256'] == digest(folder / 'source-sheet.png')
             and manifest['registration']['settingsSha256'] == settings_hash(polish_settings(folder))
             and review.get('binding') == binding(folder, manifest)
             and set(review.get('checks', {})) == TASK_REQUIRED
             and all(isinstance(note, str) and note.strip() for note in review['checks'].values())
             and bool(review.get('scope')) and bool(review.get('dependencies')))
    if valid:
        valid = all((folder / item['file']).is_file() and digest(folder / item['file']) == item['sha256']
                    for item in review['dependencies'])
    manifest['taskReview'] = {'status': 'approved' if valid else 'stale-or-incomplete',
                              'record': 'task-approval.json', 'scope': review.get('scope')}
    manifest['playback']['taskApproved'] = valid
