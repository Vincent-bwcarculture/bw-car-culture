export function parseVideoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();

  // YouTube (watch, shorts, youtu.be, embed)
  let m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (m) {
    return {
      platform: 'youtube',
      id: m[1],
      embedUrl: `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1`,
      thumbnail: `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`,
      label: 'YouTube',
    };
  }

  // Vimeo
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) {
    return {
      platform: 'vimeo',
      id: m[1],
      embedUrl: `https://player.vimeo.com/video/${m[1]}?title=0&byline=0&portrait=0`,
      thumbnail: null,
      label: 'Vimeo',
    };
  }

  // Facebook
  if (/facebook\.com|fb\.watch/.test(u)) {
    return {
      platform: 'facebook',
      id: u,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false&width=560`,
      thumbnail: null,
      label: 'Facebook',
    };
  }

  // TikTok
  m = u.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (m) {
    return {
      platform: 'tiktok',
      id: m[1],
      embedUrl: `https://www.tiktok.com/embed/${m[1]}`,
      thumbnail: null,
      label: 'TikTok',
    };
  }

  // Direct video file
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(u)) {
    return {
      platform: 'direct',
      id: u,
      embedUrl: null,
      directUrl: u,
      thumbnail: null,
      label: 'Video',
    };
  }

  return null;
}

export const PLATFORM_COLORS = {
  youtube: '#ff0000',
  vimeo: '#1ab7ea',
  facebook: '#1877f2',
  tiktok: '#010101',
  direct: '#555',
};
