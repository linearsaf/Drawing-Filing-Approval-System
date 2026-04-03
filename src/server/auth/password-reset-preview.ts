interface PasswordResetPreview {
  email: string;
  url: string;
  token: string;
  createdAt: number;
}

const previewStore = new Map<string, PasswordResetPreview>();

export function savePasswordResetPreview(input: PasswordResetPreview) {
  previewStore.set(input.email.toLowerCase(), input);
}

export function getPasswordResetPreview(email: string) {
  return previewStore.get(email.toLowerCase()) ?? null;
}

export function clearPasswordResetPreview(email: string) {
  previewStore.delete(email.toLowerCase());
}
