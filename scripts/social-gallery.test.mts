import assert from 'node:assert/strict'
import { test } from 'node:test'
import { humanizeFileName, selectPublicFiles } from '../src/lib/social/asset-loader.ts'
import { normalizeLinkedInPosts, parseLinkedInActivityId } from '../src/lib/social/linkedin.ts'

const profilePost = 'https://www.linkedin.com/posts/kartik-juyal-8b8960268_you-and-your-research-activity-7477241997821382657-ssij'

test('JPG/JPEG gallery discovery is case-insensitive, natural-order, non-recursive', () => {
  assert.deepEqual(
    selectPublicFiles(['10.jpeg', '2.JPG', 'readme.txt', '.hidden.jpg', 'foo/bar.jpg', '1.jpg', 'pic.webp'], 'Display_pictures', /\.jpe?g$/i).map((p) => p.fileName),
    ['1.jpg', '2.JPG', '10.jpeg'],
  )
})
test('public URLs encode filenames containing spaces, ampersands and unicode', () => {
  assert.equal(selectPublicFiles(['At work & learning.jpeg'], 'Display_pictures', /\.jpe?g$/i)[0].src, '/Display_pictures/At%20work%20%26%20learning.jpeg')
})
test('unstructured camera file names have generic readable captions', () => {
  assert.equal(humanizeFileName('IMG_8450.jpg'), 'Life at Kai Labs')
  assert.equal(humanizeFileName('Workshop-July_2026.JPG'), 'Workshop July 2026')
})
test('carousel folder only accepts PDF files', () => {
  assert.deepEqual(selectPublicFiles(['a.pdf', 'B.PDF', 'c.docx', 'd.png'], 'LinkedIn_carousels', /\.pdf$/i).map((p) => p.fileName), ['a.pdf', 'B.PDF'])
})
test('LinkedIn URLs must be https on linkedin.com', () => {
  assert.equal(parseLinkedInActivityId(profilePost), '7477241997821382657')
  assert.equal(parseLinkedInActivityId('https://evil.example/posts/foo-activity-7477241997821382657-q'), null)
  assert.equal(parseLinkedInActivityId('http://www.linkedin.com/posts/foo-activity-7477241997821382657-q'), null)
  assert.equal(parseLinkedInActivityId('https://www.linkedin.com.evil.example/posts/foo-activity-7477241997821382657-q'), null)
  assert.equal(parseLinkedInActivityId('https://www.linkedin.com/in/kartik-juyal-8b8960268/'), null)
})
test('LinkedIn normalize creates fixed-origin embeds, de-duplicates post IDs', () => {
  const posts = normalizeLinkedInPosts([
    { title: 'Research notes', url: profilePost, label: 'Science', summary: 'Findings' },
    { title: 'Duplicate', url: profilePost },
    { title: 'Bad', url: 'https://evil.example/posts/activity-7477241997821382657-ssij' },
    { title: 'Missing url' },
  ])
  assert.equal(posts.length, 1)
  assert.equal(posts[0].embedUrl, 'https://www.linkedin.com/embed/feed/update/urn:li:activity:7477241997821382657')
  assert.equal(posts[0].title, 'Research notes')
})
test('invalid LinkedIn input fails closed', () => {
  assert.deepEqual(normalizeLinkedInPosts(null), [])
  assert.deepEqual(normalizeLinkedInPosts({ title: 'test' }), [])
})
