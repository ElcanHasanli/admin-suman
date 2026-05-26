import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Fayl oxunmadı'));
        return;
      }
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Fayl oxunmadı'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Fayl oxunmadı'));
    reader.readAsDataURL(blob);
  });
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^\w.\-]/g, '_');
}

function isShareCancelled(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /cancel|dismiss|abort|user denied/i.test(msg);
}

/** Brauzerdə endirir; mobil APK/iOS-da paylaşım pəncərəsi açır (Fayllar, Drive və s.) */
export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const safeName = sanitizeFilename(filename);

  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob);
    const { uri } = await Filesystem.writeFile({
      path: safeName,
      data: base64,
      directory: Directory.Cache,
    });

    try {
      await Share.share({
        title: safeName,
        files: [uri],
        dialogTitle: 'Excel faylını saxla və ya paylaş',
      });
    } catch (err) {
      if (!isShareCancelled(err)) throw err;
    }
    return;
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
