interface AccountApprovedPreview {
  email: string;
  username: string;
  password: string;
  createdAt: number;
}

const previewStore = new Map<string, AccountApprovedPreview>();

export function saveAccountApprovedPreview(input: AccountApprovedPreview) {
  previewStore.set(input.email.toLowerCase(), input);
}

export function getAccountApprovedPreview(email: string) {
  return previewStore.get(email.toLowerCase()) ?? null;
}

export function clearAccountApprovedPreview(email: string) {
  previewStore.delete(email.toLowerCase());
}
