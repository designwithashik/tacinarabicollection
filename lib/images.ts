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

export const compressImage = async (file: File, maxWidth = 1400) => {
  const imageBitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / imageBitmap.width);
  const width = Math.round(imageBitmap.width * scale);
  const height = Math.round(imageBitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(imageBitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85)
  );
  return blob ? new File([blob], file.name, { type: blob.type }) : file;
};

export const uploadToCloudinary = async ({
  file,
  cloudName,
  uploadPreset,
}: {
  file: File;
  cloudName: string;
  uploadPreset: string;
}): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  const result = (await response.json()) as { secure_url: string };
  return result.secure_url;
};
