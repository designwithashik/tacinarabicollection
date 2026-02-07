export const SITE_URL = "https://tacinarabicollection.vercel.app";

export const getPublicImageUrl = (imagePath: string) => {
  if (!imagePath) return null;
  const isAbsolute =
    imagePath.startsWith("http://") || imagePath.startsWith("https://");
  return isAbsolute ? imagePath : `${SITE_URL}${imagePath}`;
};

export const validateImageUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

export const uploadToUploadcare = async (
  file: File,
  publicKey: string
): Promise<string> => {
  const formData = new FormData();
  formData.append("UPLOADCARE_PUB_KEY", publicKey);
  formData.append("UPLOADCARE_STORE", "1");
  formData.append("file", file);

  const response = await fetch("https://upload.uploadcare.com/base/", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  const result = (await response.json()) as { file: string };
  return `https://ucarecdn.com/${result.file}/`;
};
