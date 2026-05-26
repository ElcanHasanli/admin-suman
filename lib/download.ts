import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const EXCEL_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes.length === 0) {
    throw new Error('Export faylı boşdur');
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^\w.\-]/g, '_');
}

function isShareCancelled(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /cancel|dismiss|abort|user denied|Share canceled/i.test(msg);
}

function isPluginNotImplemented(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /not implemented/i.test(msg);
}

/** iOS WebView — Filesystem plugin olmadan da işləyə bilər */
async function tryWebShareFile(
  blob: Blob,
  filename: string
): Promise<'shared' | 'cancelled' | 'unavailable'> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return 'unavailable';
  }

  try {
    const file = new File([blob], filename, { type: EXCEL_MIME });
    const data: ShareData = { files: [file], title: filename };
    if (typeof navigator.canShare === 'function' && !navigator.canShare(data)) {
      return 'unavailable';
    }
    await navigator.share(data);
    return 'shared';
  } catch (err) {
    if (isShareCancelled(err)) return 'cancelled';
    return 'unavailable';
  }
}

async function shareNativeFileUri(fileUri: string, title: string): Promise<void> {
  const platform = Capacitor.getPlatform();

  try {
    if (platform === 'ios') {
      await Share.share({
        title,
        url: fileUri,
        dialogTitle: 'Excel faylını saxla və ya paylaş',
      });
    } else {
      await Share.share({
        title,
        files: [fileUri],
        dialogTitle: 'Excel faylını saxla və ya paylaş',
      });
    }
  } catch (err) {
    if (!isShareCancelled(err)) throw err;
  }
}

async function shareViaFilesystem(blob: Blob, filename: string): Promise<void> {
  if (!Capacitor.isPluginAvailable('Filesystem')) {
    throw new Error('Filesystem plugin quraşdırılmayıb');
  }

  const base64 = await blobToBase64(blob);
  const directory =
    Capacitor.getPlatform() === 'ios' ? Directory.Documents : Directory.Cache;

  await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory,
  });

  const { uri } = await Filesystem.getUri({
    path: filename,
    directory,
  });

  if (Capacitor.isPluginAvailable('Share')) {
    await shareNativeFileUri(uri, filename);
    return;
  }

  throw new Error('Share plugin quraşdırılmayıb');
}

/** Brauzerdə endirir; mobil APK/iOS-da paylaşım pəncərəsi açır */
export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  if (!blob || blob.size === 0) {
    throw new Error('Export faylı boşdur');
  }

  const safeName = sanitizeFilename(filename);

  if (Capacitor.isNativePlatform()) {
    const platform = Capacitor.getPlatform();

    // iOS: əvvəlcə Web Share (plugin tələb etmir — köhnə build + OTA üçün)
    if (platform === 'ios') {
      const web = await tryWebShareFile(blob, safeName);
      if (web === 'shared' || web === 'cancelled') return;
    }

    try {
      await shareViaFilesystem(blob, safeName);
      return;
    } catch (err) {
      if (platform === 'ios') {
        const web = await tryWebShareFile(blob, safeName);
        if (web === 'shared' || web === 'cancelled') return;

        if (isPluginNotImplemented(err)) {
          throw new Error(
            'Export işləmədi. Tətbiqi Xcode-dan yenidən quraşdırın: npm run cap:sync && npm run ios'
          );
        }
      }
      throw err;
    }
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function getExportSuccessMessage(): string {
  if (Capacitor.isNativePlatform()) {
    return 'Paylaşım pəncərəsi açıldı — «Fayllara saxla», Drive və ya Excel seçin';
  }
  return 'Excel faylı endirildi';
}

export function getExportErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Export uğursuz oldu';
}
