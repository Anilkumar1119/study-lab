export const maxFileBytes = 4_000_000;
export const maxChatFiles = 6;
export const chatTurns = 21;
export const maxQuestionLength = 3000;
export const chatFileTypes = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'text/plain': 'TXT'
};

export function chatFileType(file: File) {
  if (Object.hasOwn(chatFileTypes, file.type)) return file.type as keyof typeof chatFileTypes;
  if (!file.type && file.name.toLowerCase().endsWith('.txt')) return 'text/plain';
  if (!file.type && file.name.toLowerCase().endsWith('.pdf')) return 'application/pdf';
  return null;
}
