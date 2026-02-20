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
