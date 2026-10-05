"""Reproduce reviewed station layers without writing an unverified replacement."""
import hashlib
from pathlib import Path
from PIL import Image


def verified_source(folder, relative, expected):
    path = folder / relative
    if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise ValueError(f'Workstation source changed: {relative}')
    return Image.open(path).convert('RGBA')


def normalized(source, placement):
    p = placement
    bounds = (p['crop'] if isinstance(p.get('crop'), list) else
              source.getchannel('A').point(lambda a: 255 if a >= p['alphaThreshold'] else 0).getbbox()
              if 'alphaThreshold' in p else source.getbbox())
    dimension = p.get('width', p.get('height'))
    if bounds is None or not isinstance(dimension, int) or dimension <= 0:
        raise ValueError('Invalid workstation normalization')
    image = source.crop(bounds)
    size = ((p['width'], round(image.height * p['width'] / image.width)) if 'width' in p
            else (round(image.width * p['height'] / image.height), p['height']))
    image = image.resize(size, Image.LANCZOS)
    if p['x'] < 0 or p['y'] < 0 or p['x'] + image.width > p['canvas'][0] or p['y'] + image.height > p['canvas'][1]:
        raise ValueError('Workstation placement clips source pixels')
    output = Image.new('RGBA', tuple(p['canvas']))
    output.alpha_composite(image, (p['x'], p['y']))
    return output


def reconstructed_layers(folder, config):
    """Return every output, including the persistent receipt and completed workpiece."""
    folder = Path(folder)
    source = verified_source(folder, 'source.png', config['sourceSha256'])
    if 'placement' in config:
        base = normalized(source, config['placement'])
    elif config.get('status') == 'authored-prop-awaiting-registration' and not config.get('liveGameplay'):
        # The inactive rack preserves its complete source canvas; this does
        # not infer an actor registration or activate it in the game.
        base = source.resize(tuple(config['frameSize']), Image.LANCZOS)
    else:
        raise ValueError('Missing reviewed workstation placement')
    outputs = {'sprite.png': (base, config['spriteSha256'])}
    receipt = config.get('composition46')
    if receipt:
        original = verified_source(folder, receipt['baseSprite'], receipt['baseSpriteSha256'])
        if base.tobytes() != original.tobytes():
            raise ValueError('Desk normalization differs from reviewed base')
        raw = verified_source(folder, receipt['source'], receipt['sourceSha256'])
        image = raw.crop(receipt['sourceBounds'])
        image = image.resize((receipt['widthPx'], round(image.height * receipt['uniformScale'])), Image.LANCZOS)
        paper = Image.new('RGBA', base.size)
        paper.alpha_composite(image, tuple(receipt['placement']))
        base.alpha_composite(paper)
        outputs[receipt['sprite']] = (paper, receipt['spriteSha256'])
    completion = config.get('completionLayer')
    if completion:
        source = verified_source(folder, completion['source'], completion['sourceSha256'])
        if 'placement' in completion:
            image = normalized(source, completion['placement'])
        else:
            b = completion['bounds']
            if len(b) != 4 or not 0 <= b[0] < b[2] <= source.width or not 0 <= b[1] < b[3] <= source.height:
                raise ValueError('Invalid completion prop bounds')
            image = Image.new('RGBA', source.size)
            image.alpha_composite(source.crop(b), tuple(b[:2]))
        outputs[completion['file']] = (image, completion['sha256'])
    return outputs


def verified_bytes(folder, config):
    from io import BytesIO
    outputs = {}
    for name, (image, expected) in reconstructed_layers(folder, config).items():
        buffer = BytesIO()
        image.save(buffer, format='PNG')
        data = buffer.getvalue()
        if hashlib.sha256(data).hexdigest() != expected:
            raise ValueError(f'Workstation export differs from reviewed output: {name}')
        outputs[name] = data
    return outputs


def export_station(folder, config):
    # Verify all layers first so a bad source cannot erase an approved receipt.
    outputs = verified_bytes(folder, config)
    for name, data in outputs.items():
        (Path(folder) / name).write_bytes(data)
