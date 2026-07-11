export const VIDEO_UPLOAD_ACCEPT = "video/mp4,video/quicktime,.mp4,.mov";
export const VIDEO_UPLOAD_MAX_BYTES = 2 * 1024 * 1024 * 1024;

export function defaultVideoTitleFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

export async function uploadFileToSignedUrl(
  file: File,
  signedUrl: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error(`Upload stockage échoué (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error("Upload stockage échoué (réseau)"));
    xhr.onabort = () => reject(new Error("Upload annulé"));
    xhr.send(file);
  });
}
