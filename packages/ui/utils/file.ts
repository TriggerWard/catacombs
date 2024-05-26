export function blobToBase64(blob: Blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      if (!dataUrl) {
        return "";
      }
      const base64 = String(dataUrl).split(",")[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

export function fileToArrayBuffer(file: File) {
  return new Promise<ArrayBuffer>((resolve, _) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      resolve(arrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  });
}
