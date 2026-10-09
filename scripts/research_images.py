"""Licence-aware paper-figure enrichment for Kai Research Intelligence.

Only retrieves JATS XML from Europe PMC's open-access subset and figure binaries
from known PMC/Europe PMC article paths. No DOI-page scraping, paywall bypass,
AI-generated figures, or external images at render time.

Usage:
  python3 scripts/research_images.py --backfill --limit 12
  python3 scripts/research_images.py --backfill --slug an-existing-slug
  python3 scripts/research_images.py --backfill --force --limit 12

Pillow is the sole non-standard-library requirement. Requires no model API key.
"""
from __future__ import annotations

import argparse
import datetime as dt
import io
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener
import xml.etree.ElementTree as ET

from PIL import Image, ImageOps, UnidentifiedImageError

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / 'content' / 'research'
IMAGE_DIR = ROOT / 'public' / 'research' / 'images' / 'papers'
CHECKS_FILE = ROOT / 'content' / '.research-image-checks.json'
API = 'https://www.ebi.ac.uk/europepmc/webservices/rest'
XLINK_HREF = '{http://www.w3.org/1999/xlink}href'
TIMEOUT = 12
MAX_XML_BYTES = 4_000_000
MAX_IMAGE_BYTES = 5_000_000
MAX_WEBP_BYTES = 900_000
RECHECK_DAYS = 30
# Re-attempt older negative results after significant improvements to resolution.
IMAGE_PIPELINE_VERSION = 2
MAX_FIGURES = 3
MAX_IMAGE_RUN_SECONDS = 210
MAX_PAPER_SECONDS = 42


def tag_name(tag: str) -> str:
    return tag.split('}', 1)[-1]


def nodes(element: ET.Element, name: str):
    return (x for x in element.iter() if tag_name(x.tag) == name)


def text_content(node: ET.Element) -> str:
    return re.sub(r'\s+', ' ', ' '.join(node.itertext())).strip()


def safe_pmcid(value: str) -> bool:
    return bool(re.fullmatch(r'PMC[1-9]\d{2,10}', value or ''))


def normalise_doi(value: str) -> str:
    return re.sub(r'^(?:https?://(?:dx\.)?doi\.org/|doi:\s*)', '', value or '', flags=re.I).strip().lower()


def license_details(root: ET.Element) -> tuple[str, str] | None:
    """Only accept explicit reusable CC licences; never infer from OA flag alone."""
    # A licence elsewhere in the document is NOT the article's licence.
    article_meta = next(nodes(root, 'article-meta'), None)
    if article_meta is None:
        return None
    permissions = [n for n in article_meta if tag_name(n.tag) == 'permissions']
    licenses = [n for perm in permissions for n in perm if tag_name(n.tag) == 'license']
    for license_node in licenses:
        link = license_node.attrib.get(XLINK_HREF, '')
        prose = text_content(license_node)
        # Prefer the publisher's machine-readable CC license URL.
        combined = f'{link} {prose}'
        match = re.search(r'https?://creativecommons\.org/licenses/(by(?:-sa)?)/([234]\.0)/?', combined, re.I)
        if match:
            code, version = match.group(1).upper(), match.group(2)
            return f'CC {code} {version}', f'https://creativecommons.org/licenses/{code.lower()}/{version}/'
        if re.search(r'https?://creativecommons\.org/publicdomain/zero/1\.0', combined, re.I):
            return 'CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/'
    return None


def looks_third_party(figure: ET.Element) -> bool:
    # A permissive article-level licence does NOT cover reprinted figures.
    # Reject explicitly separately licensed figures and suspicious captions.
    if any(tag_name(n.tag) in ('permissions', 'copyright-statement', 'copyright-holder', 'attrib') for n in figure.iter()):
        return True
    caption = text_content(figure).lower()
    # BioRender artwork can carry separate third-party licence conditions even
    # when the surrounding Frontiers article is CC BY. Never assume reuse.
    if 'biorender' in caption:
        return True
    return bool(re.search(r'\b(reproduced|reprinted|adapted|modified)\s+(?:with permission|from|after)\b|\bcopyright\b|\bpermission of\b|\bthird.party\b', caption))


def figure_candidates(root: ET.Element) -> list[tuple[str, str, str]]:
    """Returns (file identifier, descriptive caption, figure anchor), best first."""
    results: list[tuple[int, str, str, str]] = []
    for i, fig in enumerate(nodes(root, 'fig')):
        if looks_third_party(fig):
            continue
        graphics = [n.attrib.get(XLINK_HREF, '') for n in nodes(fig, 'graphic')]
        # Filenames are supplied in XML. Never use as a URL, path, or hostname.
        valid = [name for name in graphics if re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]{0,180}', name) and '..' not in name]
        if not valid:
            continue
        label = next((text_content(n) for n in nodes(fig, 'label')), f'Figure {i + 1}')
        caption = next((text_content(n) for n in nodes(fig, 'caption')), '')
        alt = next((text_content(n) for n in nodes(fig, 'alt-text')), '')
        description = (alt or caption or label).strip()[:260]
        figure_id = fig.get('id', '')
        if not re.fullmatch(r'[a-zA-Z0-9_.:-]{1,80}', figure_id):
            figure_id = ''
        desc = f'{label} {caption}'.lower()
        score = (120 if 'graphical abstract' in desc else 0) + (50 if re.search(r'overview|schematic|workflow|pipeline|model architecture|study design', desc) else 0) + (20 if i == 0 else 0)
        # JPEG/PNG files are typically presentation-friendly; TIFF is allowed
        # but the server might only expose a JPEG rendition.
        file_id = next((x for x in valid if x.lower().endswith(('.jpg', '.jpeg', '.png', '.gif'))), valid[0])
        results.append((score, file_id, description, figure_id))
    results.sort(key=lambda entry: -entry[0])
    return [(file_id, description, figure_id) for _, file_id, description, figure_id in results[:MAX_FIGURES]]


class ApprovedRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        u = urlparse(newurl)
        host = (u.hostname or '').lower()
        allowed = host in ('europepmc.org', 'www.europepmc.org', 'www.ebi.ac.uk', 'pmc.ncbi.nlm.nih.gov', 'www.ncbi.nlm.nih.gov', 'cdn.ncbi.nlm.nih.gov')
        if u.scheme != 'https' or not allowed:
            raise ValueError(f'Disallowed image redirect to {host}')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


OPENER = build_opener(ApprovedRedirects())


def get_bytes(url: str, max_bytes: int) -> bytes:
    parsed = urlparse(url)
    if parsed.scheme != 'https' or parsed.hostname not in ('www.ebi.ac.uk', 'www.europepmc.org', 'europepmc.org', 'pmc.ncbi.nlm.nih.gov'):
        raise ValueError('URL is not an approved research source')
    req = Request(url, headers={'User-Agent': 'KaiGenomicsResearchIntelligence/1.1 (research image enrichment)', 'Accept': 'image/*,application/xml,application/json;q=0.9'})
    # Restrict total bytes before Pillow/ElementTree parse. Avoid huge assets.
    with OPENER.open(req, timeout=TIMEOUT) as response:
        data = response.read(max_bytes + 1)
        if len(data) > max_bytes:
            raise ValueError('Remote resource exceeds size cap')
        return data


def get_metadata(doi: str) -> dict | None:
    url = f'{API}/search?' + urlencode({'query': f'DOI:"{doi}"', 'format': 'json', 'resultType': 'core', 'pageSize': 2})
    payload = json.loads(get_bytes(url, MAX_XML_BYTES))
    for item in payload.get('resultList', {}).get('result', []):
        if normalise_doi(str(item.get('doi') or '')) == doi:
            return item
    return None


def figure_urls(pmcid: str, file_id: str) -> list[str]:
    """Only trusted, known hosts; figure identifiers are not arbitrary links."""
    names = [file_id]
    if not file_id.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.tif', '.tiff')):
        names.extend([file_id + '.jpg', file_id + '.png'])
    elif file_id.lower().endswith(('.tif', '.tiff')):
        base = file_id.rsplit('.', 1)[0]
        names.extend([base + '.jpg', base + '.png'])
    # Europe PMC exposes article figure binaries under /articles/<PMCID>/bin/.
    # NCBI provides an alternative for content whose figure file name differs.
    hosts = ['https://europepmc.org/articles/', 'https://pmc.ncbi.nlm.nih.gov/articles/']
    return [f'{host}{pmcid}/bin/{quote(name)}' for name in names for host in hosts]


def to_webp(data: bytes) -> bytes:
    try:
        with Image.open(io.BytesIO(data)) as src:
            src.verify()
        with Image.open(io.BytesIO(data)) as src:
            if src.width < 280 or src.height < 170 or src.width * src.height > 28_000_000:
                raise ValueError('Image dimensions unsuitable for a paper preview')
            src = ImageOps.exif_transpose(src)
            src.thumbnail((1200, 900), Image.Resampling.LANCZOS)
            if src.mode in ('RGBA', 'LA') or (src.mode == 'P' and 'transparency' in src.info):
                rgba = src.convert('RGBA')
                background = Image.new('RGB', rgba.size, '#ffffff')
                background.paste(rgba, mask=rgba.getchannel('A'))
                src = background
            else:
                src = src.convert('RGB')
            for quality in (84, 72, 60):
                dest = io.BytesIO()
                src.save(dest, format='WEBP', quality=quality, method=4)
                if dest.tell() <= MAX_WEBP_BYTES:
                    return dest.getvalue()
            raise ValueError('Optimised preview still exceeds image size cap')
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise ValueError('Unrecognised or unsafe image') from exc


def retrieve_figure(article: dict) -> tuple[bytes, dict] | None:
    doi = normalise_doi(str(article.get('doi') or ''))
    if not doi or not doi.startswith('10.'):
        return None
    metadata = get_metadata(doi)
    if not metadata or metadata.get('isOpenAccess') != 'Y':
        print(f'    {doi}: no Europe PMC OA full text; respecting publisher restrictions')
        return None
    pmcid = str(metadata.get('pmcid') or '').upper()
    if not safe_pmcid(pmcid):
        return None
    root = ET.fromstring(get_bytes(f'{API}/{pmcid}/fullTextXML', MAX_XML_BYTES))
    allowed = license_details(root)
    if not allowed:
        print(f'    {doi}: no explicit compatible CC BY/BY-SA/CC0 licence')
        return None
    label, license_url = allowed
    paper_deadline = time.monotonic() + MAX_PAPER_SECONDS
    for filename, caption, figure_id in figure_candidates(root):
        for url in figure_urls(pmcid, filename):
            if time.monotonic() >= paper_deadline:
                print(f'    {doi}: lookup timed out; retaining fallback')
                return None
            try:
                image = to_webp(get_bytes(url, MAX_IMAGE_BYTES))
            except (HTTPError, URLError, TimeoutError, OSError, ValueError):
                continue
            figure_link = f'https://europepmc.org/articles/{pmcid}' + (f'#{figure_id}' if figure_id else '')
            credit = ', '.join(str(a) for a in article.get('authors', [])[:2] if a) or str(metadata.get('authorString') or '').split(',')[0].strip() or 'Original article authors'
            attribution = {
                'alt': f'Figure from {article.get("title", "the original paper")}: {caption}'[:320],
                'caption': caption[:340],
                'credit': f'{credit} · {label}',
                'source': figure_link,
                'license': label,
                'licenseUrl': license_url,
                'kind': 'paper-figure',
            }
            return image, attribution
    print(f'    {doi}: no downloadable suitable figure found; retaining fallback')
    return None


def is_existing_paper_image(article: dict) -> bool:
    hero = article.get('heroImage') or {}
    src = str(hero.get('src') or '')
    if not src.startswith('/research/images/papers/') or not src.endswith('.webp'):
        return False
    return (ROOT / 'public' / src.lstrip('/')).is_file()


def process(args: argparse.Namespace) -> int:
    if args.limit < 1 or args.limit > 100:
        raise ValueError('--limit must be 1-100')
    files = sorted(CONTENT_DIR.glob('*.json')) if CONTENT_DIR.exists() else []
    if not files:
        print('  No article JSON files in content/research/. Preserve your published article files when uploading the ZIP.')
    if args.slug:
        files = [f for f in files if f.stem == args.slug]
    # Work on newest papers first; a new weekly paper must not get stuck
    # behind a large alphabetically-ordered backlog of older articles.
    def article_date(file: Path) -> str:
        try:
            return str(json.loads(file.read_text()).get('date') or '')
        except (ValueError, OSError):
            return ''
    files.sort(key=article_date, reverse=True)
    run_deadline = time.monotonic() + MAX_IMAGE_RUN_SECONDS
    try:
        checks = json.loads(CHECKS_FILE.read_text())
        if not isinstance(checks, dict): checks = {}
    except (FileNotFoundError, json.JSONDecodeError):
        checks = {}
    today = dt.date.today()
    examined = added = skipped = 0
    for f in files:
        if time.monotonic() >= run_deadline:
            print('  Image budget reached; remaining papers will be checked next run.')
            break
        try:
            article = json.loads(f.read_text(encoding='utf-8'))
        except (OSError, ValueError):
            continue
        if article.get('isSample') or article.get('draft') or not article.get('doi'):
            continue
        if is_existing_paper_image(article) and not args.force:
            continue
        key = normalise_doi(str(article['doi']))
        if not args.force and key in checks and checks[key].get('version') == IMAGE_PIPELINE_VERSION:
            try:
                last = dt.date.fromisoformat(checks[key]['lastChecked'])
                # Transient provider outages should retry the next day;
                # genuine no-figure outcomes are cached for a month.
                wait_days = 1 if checks[key].get('status') == 'temporary-error' else RECHECK_DAYS
                if (today - last).days < wait_days:
                    skipped += 1
                    continue
            except (ValueError, TypeError, KeyError):
                pass
        if examined >= args.limit:
            break
        examined += 1
        print(f'  [{examined}/{args.limit}] {f.stem}')
        temporary_error = False
        try:
            found = retrieve_figure(article)
        except (ET.ParseError, HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
            print(f'    image source unavailable: {type(exc).__name__}: {str(exc)[:120]}')
            temporary_error = True
            found = None
        if found:
            data, meta = found
            safe_slug = f.stem
            if not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_-]{0,160}', safe_slug):
                print('    skipped unsafe slug')
                continue
            image_name = safe_slug + '.webp'
            meta['src'] = f'/research/images/papers/{image_name}'
            if not args.dry_run:
                IMAGE_DIR.mkdir(parents=True, exist_ok=True)
                (IMAGE_DIR / image_name).write_bytes(data)
                article['heroImage'] = meta
                f.write_text(json.dumps(article, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
            print(f'    ✓ paper figure ({len(data) // 1024} KiB; {meta["license"]})')
            added += 1
        if not args.dry_run:
            checks[key] = {'lastChecked': today.isoformat(), 'version': IMAGE_PIPELINE_VERSION, 'status': 'figure' if found else ('temporary-error' if temporary_error else 'unavailable')}
        # Respect provider infrastructure rather than burst API requests.
        if not args.no_delay:
            time.sleep(0.4)
    if not args.dry_run and examined:
        CHECKS_FILE.parent.mkdir(parents=True, exist_ok=True)
        CHECKS_FILE.write_text(json.dumps(checks, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    print(f'Image enrichment: {examined} checked, {added} images added, {skipped} recently checked; no research article was discarded.')
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backfill', action='store_true', help='Enrich existing articles as well as new ones (default)')
    parser.add_argument('--slug', help='Process only one existing article slug')
    parser.add_argument('--limit', type=int, default=12, help='Maximum image lookup attempts per run (1-100)')
    parser.add_argument('--force', action='store_true', help='Ignore the 30-day retry interval and existing figures')
    parser.add_argument('--dry-run', action='store_true', help='Try retrieval but do not write images, JSON or ledger')
    parser.add_argument('--no-delay', action='store_true', help=argparse.SUPPRESS)
    args = parser.parse_args()
    return process(args)


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, OSError) as exc:
        print(f'Error: {exc}', file=sys.stderr)
        sys.exit(1)
