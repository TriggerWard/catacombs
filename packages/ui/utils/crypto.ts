export async function generateKey() {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.generateKey({ name: "AES-CBC", length: 256 }, true, ["encrypt", "decrypt"]);
  const exportedKey = await crypto.subtle.exportKey("raw", key);
  const base64ExportedKey = Buffer.from(exportedKey).toString("base64");
  return { iv, key, exportedKey, base64ExportedKey };
}

export async function encrypt(key: CryptoKey, iv: Uint8Array, data: ArrayBuffer) {
  const encrypted = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, data);
  const base64Encrypted = Buffer.from(encrypted).toString("base64");
  return {
    base64Encrypted,
    encrypted,
  };
}

export async function importKey(base64Key: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    Buffer.from(base64Key, "base64"),
    { name: "AES-CBC", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  return key;
}

export async function decrypt(key: CryptoKey, iv: Uint8Array, data: ArrayBuffer) {
  const decrypted = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, data);
  const utf8Decrypted = Buffer.from(decrypted).toString("utf-8");
  return {
    utf8Decrypted,
    decrypted,
  };
}
