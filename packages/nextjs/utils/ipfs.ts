export async function pinCryptMetadataToIPFS(
  metadata: { fileIpfsCid: string; triggerText: string; iv: Uint8Array },
  fileName: string,
) {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataContent: {
        ...metadata,
        iv: Buffer.from(metadata.iv).toString("base64"),
      },
      pinataMetadata: {
        name: fileName,
      },
      pinataOptions: {
        cidVersion: 0,
      },
    }),
  });
  const resData = await res.json();
  return resData;
}

export async function pinFileToIPFS(fileBuffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([fileBuffer]);

  const formData = new FormData();
  formData.append("file", blob);

  const pinataMetadata = JSON.stringify({
    name: fileName,
  });
  formData.append("pinataMetadata", pinataMetadata);

  const pinataOptions = JSON.stringify({
    cidVersion: 0,
  });
  formData.append("pinataOptions", pinataOptions);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      maxBodyLength: "Infinity",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
    },
    body: formData,
  });
  const resData = await res.json();
  return resData;
}

export async function fetchFromIPFS(cid: string) {
  const res = await fetch(`https://amaranth-geographical-falcon-280.mypinata.cloud/ipfs/${cid}`);
  return res;
}
