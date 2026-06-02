/**
 * Gốc server phục vụ /uploads (không có /api).
 * - Dev (npm run dev): đường dẫn tương đối /uploads → Vite proxy → localhost:5000
 * - Production: VITE_API_URL hoặc VITE_UPLOAD_ORIGIN
 */
export function getUploadOrigin() {
  const explicit = import.meta.env.VITE_UPLOAD_ORIGIN?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const apiUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (apiUrl) {
    return apiUrl.replace(/\/$/, '').replace(/\/api$/i, '');
  }

  if (import.meta.env.DEV) {
    return '';
  }

  return typeof window !== 'undefined' ? window.location.origin : '';
}

/**
 * Chuẩn hóa avatar/media để hiển thị.
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  const origin = getUploadOrigin();

  if (trimmed.startsWith('/uploads/')) {
    return origin ? `${origin}${trimmed}` : trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith('/uploads/')) {
      const isLegacyLocal =
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname.endsWith('.local');
      if (isLegacyLocal || !import.meta.env.DEV) {
        return origin ? `${origin}${parsed.pathname}` : parsed.pathname;
      }
      return parsed.href;
    }
    return parsed.href;
  } catch {
    if (trimmed.startsWith('uploads/')) {
      const path = `/${trimmed}`;
      return origin ? `${origin}${path}` : path;
    }
    return trimmed;
  }
}

/** Lưu DB / gửi API: chỉ đường dẫn /uploads/... */
export function toStoredMediaPath(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;

  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/uploads/')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith('/uploads/')) {
      return parsed.pathname;
    }
  } catch {
    if (trimmed.startsWith('uploads/')) {
      return `/${trimmed}`;
    }
  }

  return trimmed;
}
