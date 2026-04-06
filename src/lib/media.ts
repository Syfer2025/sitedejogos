const HTTP_IMAGE_URL_PATTERN = /^https?:\/\//i;

export function isSupportedImageReference(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:image/") ||
    HTTP_IMAGE_URL_PATTERN.test(trimmed)
  );
}

export function isOptionalSupportedImageReference(value: string | undefined) {
  if (value === undefined) {
    return true;
  }

  const trimmed = value.trim();
  return trimmed === "" || isSupportedImageReference(trimmed);
}
