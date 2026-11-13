/**
 * Derive a browseable folder label from a media URI + filename.
 * Prefers a real filesystem parent path; falls back to null for opaque content:// URIs.
 */
export function folderPathFromUri(uri: string, filename: string): string | null {
  let path = uri.trim();
  if (!path) {
    return null;
  }

  if (path.startsWith('file://')) {
    try {
      path = decodeURIComponent(path.slice('file://'.length));
    } catch {
      path = path.slice('file://'.length);
    }
  } else if (path.startsWith('content://')) {
    return null;
  }

  path = path.replace(/\\/g, '/');
  const fileName = filename.trim();
  if (fileName && path.toLowerCase().endsWith(`/${fileName.toLowerCase()}`)) {
    path = path.slice(0, path.length - fileName.length - 1);
  } else {
    const slash = path.lastIndexOf('/');
    if (slash > 0) {
      path = path.slice(0, slash);
    }
  }

  path = path.replace(/\/+$/, '');
  if (!path || path === '/') {
    return null;
  }

  // Prefer a short relative path under common music roots when present.
  const markers = ['/Music/', '/Download/', '/Downloads/', '/Podcasts/', '/Audiobooks/'];
  for (const marker of markers) {
    const index = path.toLowerCase().indexOf(marker.toLowerCase());
    if (index >= 0) {
      return path.slice(index + 1);
    }
  }

  return path;
}

export function folderDisplayName(folderPath: string): string {
  const trimmed = folderPath.replace(/\/+$/, '');
  const slash = trimmed.lastIndexOf('/');
  if (slash < 0) {
    return trimmed || 'Folder';
  }
  return trimmed.slice(slash + 1) || trimmed;
}
