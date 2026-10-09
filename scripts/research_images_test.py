"""Offline regression tests for licence-aware research preview enrichment."""
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import xml.etree.ElementTree as ET

from PIL import Image

spec = importlib.util.spec_from_file_location('research_images', Path(__file__).with_name('research_images.py'))
images = importlib.util.module_from_spec(spec)
spec.loader.exec_module(images)


def xml(body='', license='https://creativecommons.org/licenses/by/4.0/'):
    return f'''<article xmlns:xlink="http://www.w3.org/1999/xlink">
      <front><article-meta><permissions><license xlink:href="{license}"><license-p>Open access</license-p></license></permissions></article-meta></front>
      <body>{body}</body></article>'''.encode()


def png(w=900,h=560):
    b = io.BytesIO()
    Image.new('RGB', (w,h), '#eeeedd').save(b, format='PNG')
    return b.getvalue()


class ImageEnrichmentTests(unittest.TestCase):
    def test_explicit_cc_license_only(self):
        self.assertEqual(images.license_details(ET.fromstring(xml()))[0], 'CC BY 4.0')
        self.assertEqual(images.license_details(ET.fromstring(xml(license='https://creativecommons.org/licenses/by-sa/3.0/')))[0], 'CC BY-SA 3.0')
        self.assertIsNone(images.license_details(ET.fromstring(xml(license='https://creativecommons.org/licenses/by-nc/4.0/'))))
        self.assertIsNone(images.license_details(ET.fromstring('<article><body/></article>')))

    def test_ranks_graphical_abstract(self):
        body = '''<fig id="f1"><caption><p>A diagnostic table.</p></caption><graphic xlink:href="a.png"/></fig>
        <fig id="f2"><caption><p>Graphical abstract of genomics pipeline.</p></caption><graphic xlink:href="b.jpg"/></fig>'''
        candidates = images.figure_candidates(ET.fromstring(xml(body)))
        self.assertEqual(candidates[0][0], 'b.jpg')
        self.assertEqual(candidates[0][2], 'f2')

    def test_rejects_separately_copyrighted_figures(self):
        body = '''<fig id="bad"><caption><p>Reprinted from publisher with permission.</p></caption><graphic xlink:href="notours.jpg"/></fig>
        <fig id="also-bad"><attrib>Copyright publisher</attrib><graphic xlink:href="theirs.png"/></fig>
        <fig id="good"><caption><p>Method overview</p></caption><graphic xlink:href="good.jpg"/></fig>'''
        self.assertEqual([row[0] for row in images.figure_candidates(ET.fromstring(xml(body)))], ['good.jpg'])

    def test_rejects_path_injection_and_doi_redirect(self):
        self.assertEqual(images.figure_candidates(ET.fromstring(xml('<fig><graphic xlink:href="../../etc/passwd"/></fig>'))), [])
        self.assertEqual(images.normalise_doi('https://doi.org/10.12/ABC'), '10.12/abc')
        self.assertTrue(all('evil.com' not in url for url in images.figure_urls('PMC123456', 'fig1')))
        self.assertFalse(images.safe_pmcid('../../secret'))

    def test_webp_validation(self):
        data = images.to_webp(png())
        with Image.open(io.BytesIO(data)) as img:
            self.assertEqual(img.format, 'WEBP')
            self.assertEqual(img.size, (900, 560))
        with self.assertRaises(ValueError):
            images.to_webp(b'<html>not an image</html>')
        with self.assertRaises(ValueError):
            images.to_webp(png(100, 100))

    def test_end_to_end_figure_and_source_credit(self):
        body = '<fig id="F1"><label>Figure 1</label><caption><p>Workflow summary</p></caption><graphic xlink:href="preview"/></fig>'
        def fake(url, max_bytes):
            if 'search?' in url: return json.dumps({'resultList': {'result': [{'doi':'10.1234/test', 'isOpenAccess':'Y', 'pmcid':'PMC123456', 'authorString': 'Researcher'}]}}).encode()
            if 'fullTextXML' in url: return xml(body)
            if '/bin/preview' in url: return png()
            raise AssertionError(url)
        with patch.object(images, 'get_bytes', side_effect=fake):
            got = images.retrieve_figure({'doi':'10.1234/test','title':'A paper', 'authors':['Example Author']})
        self.assertIsNotNone(got)
        img_data, attr = got
        self.assertGreater(len(img_data), 100)
        self.assertEqual(attr['license'], 'CC BY 4.0')
        self.assertIn('PMC123456#F1', attr['source'])
        self.assertIn('Example Author', attr['credit'])

    def test_skips_non_oa_and_unlicensed(self):
        def not_oa(url, size):
            return json.dumps({'resultList': {'result': [{'doi':'10.1234/test', 'isOpenAccess':'N', 'pmcid':'PMC123456'}]}}).encode()
        with patch.object(images, 'get_bytes', side_effect=not_oa):
            self.assertIsNone(images.retrieve_figure({'doi':'10.1234/test'}))

    def test_backfill_writes_article_and_local_asset(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            content = root/'content/research'
            content.mkdir(parents=True)
            source = content/'nice-article.json'
            source.write_text(json.dumps({'title':'Test article','slug':'nice-article','doi':'10.1234/test','heroImage':{'src':'/research/images/_defaults/genomics.jpg','alt':'Default'},'authors':['Example Author']}))
            item = (png(), {'alt':'Figure', 'caption':'Real figure', 'credit':'Example · CC BY 4.0','source':'https://europepmc.org/articles/PMC123456','license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','kind':'paper-figure'})
            args = type('Arguments', (), dict(limit=2,slug=None,force=False,dry_run=False,no_delay=True))()
            with patch.object(images,'CONTENT_DIR',content), patch.object(images,'IMAGE_DIR',root/'public/research/images/papers'), patch.object(images,'ROOT',root), patch.object(images,'CHECKS_FILE',root/'content/.research-image-checks.json'), patch.object(images,'retrieve_figure',return_value=item) as fetch:
                images.process(args)
                self.assertEqual(json.loads(source.read_text())['heroImage']['src'], '/research/images/papers/nice-article.webp')
                self.assertTrue((root/'public/research/images/papers/nice-article.webp').exists())
                self.assertEqual(json.loads((root/'content/.research-image-checks.json').read_text())['10.1234/test']['status'], 'figure')
                images.process(args)
                self.assertEqual(fetch.call_count, 1, 'Do not refetch already-enriched papers')

    def test_missing_figure_is_safe_and_throttled(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            content = root/'content/research'
            content.mkdir(parents=True)
            item = content/'missing.json'
            original = {'title':'Test','slug':'missing','doi':'10.1234/missing','heroImage':{'src':'/research/images/_defaults/genomics.jpg','alt':'Category'}}
            item.write_text(json.dumps(original))
            args = type('Arguments', (), dict(limit=2,slug=None,force=False,dry_run=False,no_delay=True))()
            with patch.object(images,'CONTENT_DIR',content), patch.object(images,'IMAGE_DIR',root/'public/research/images/papers'), patch.object(images,'ROOT',root), patch.object(images,'CHECKS_FILE',root/'content/.research-image-checks.json'), patch.object(images,'retrieve_figure',return_value=None) as fetch:
                images.process(args)
                images.process(args)
                self.assertEqual(fetch.call_count, 1, 'Do not hammer OA services weekly for no-image papers')
                self.assertEqual(json.loads(item.read_text()), original)


if __name__ == '__main__':
    unittest.main()
