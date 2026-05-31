/**
 * Converts any recognisable YouTube URL to an embed URL.
 * Returns null if the input is not a valid YouTube URL.
 *
 * Supported formats:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://youtu.be/VIDEO_ID
 *   https://www.youtube.com/shorts/VIDEO_ID
 *   https://www.youtube.com/embed/VIDEO_ID  (already embedded — returned as-is)
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim())
    const host = u.hostname.replace(/^www\./, '')

    if (host === 'youtube.com') {
      // Already an embed URL
      if (u.pathname.startsWith('/embed/')) return url.trim()

      // /watch?v=VIDEO_ID
      if (u.pathname === '/watch') {
        const id = u.searchParams.get('v')
        if (id) return `https://www.youtube.com/embed/${id}`
      }

      // /shorts/VIDEO_ID
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.slice('/shorts/'.length).split('/')[0]
        if (id) return `https://www.youtube.com/embed/${id}`
      }
    }

    // youtu.be/VIDEO_ID
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      if (id) return `https://www.youtube.com/embed/${id}`
    }

    return null
  } catch {
    return null
  }
}
