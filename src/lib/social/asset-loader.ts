/**
 * Build-time discovery of curator-owned images and PDFs in public/.
 * The site is statically built on Vercel, so committing files triggers
 * a fresh gallery after deployment, not a live filesystem watch.
 */
import fs from 'node:fs'
import path from 'node:path'

export interface PublicGalleryAsset {
  fileName: string
  src: string
  title: string
}

const SCAN_ROOT = 'public'
const TITLE_NOISE = /^(?:img|dsc|dscn|pic|photo|image|whatsapp|pxl)[-_\s]*\d+(?:[-_\s]\d+)*$/i

export function humanizeFileName(name: string): string {
  const stem = name.replace(/\.[^.]+$/, '')
  if (TITLE_NOISE.test(stem.trim())) return 'Life at Kai Labs'
  return stem.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Life at Kai Labs'
}

/** Pure function used by tests and both folder readers. */
export function selectPublicFiles(
  names: string[],
  folder: string,
  extension: RegExp,
): PublicGalleryAsset[] {
  return names
    .filter((name) => !name.startsWith('.') && !name.includes('/') && !name.includes('\\') && extension.test(name))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }))
    .map((fileName) => ({
      fileName,
      src: `/${folder}/${encodeURIComponent(fileName)}`,
      title: humanizeFileName(fileName),
    }))
}

function scan(folder: 'Display_pictures' | 'LinkedIn_carousels', extension: RegExp) {
  const directory = path.join(process.cwd(), SCAN_ROOT, folder)
  try {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
    // Do not expose nested folders, symlinks, or files with unsupported extensions.
    return selectPublicFiles(entries.filter((entry) => entry.isFile()).map((entry) => entry.name), folder, extension)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn(`[gallery] Could not read ${folder}:`, error)
    }
    return []
  }
}

/** JPG/JPEG files dropped into the folder appear after the next deploy. */
export function getHomeDisplayPictures(): PublicGalleryAsset[] {
  return scan('Display_pictures', /\.jpe?g$/i)
}

/** Original, author-owned PDF carousels appear in Kai Blogs automatically. */
export function getLinkedInCarouselPdfs(): PublicGalleryAsset[] {
  return scan('LinkedIn_carousels', /\.pdf$/i)
}
