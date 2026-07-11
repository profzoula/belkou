export const VIDEO_UPLOAD_ACCEPT = "video/mp4,video/quicktime,.mp4,.mov";
export const VIDEO_UPLOAD_MAX_BYTES = 2 * 1024 * 1024 * 1024;

export function defaultVideoTitleFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

export async function uploadFileToSignedUrl(file: File, signedUrl: string): Promise<void> {
  const response = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload stockage échoué (${response.status})`);
  }
}
