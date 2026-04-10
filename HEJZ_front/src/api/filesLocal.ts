// src/api/filesLocal.ts
import RNFS from 'react-native-fs';

export type Picked = { uri: string; name?: string; type?: string; base64?: string };

export async function savePickedToLocal(file: Picked): Promise<string> {
  const ext =
    (file.name?.split('.').pop() || '') ||
    (file.uri.match(/\.(\w+)(?:\?|$)/)?.[1] ?? 'jpg');
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
  const destPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

  if (file.base64) {
    await RNFS.writeFile(destPath, file.base64, 'base64');
  } else if (/^file:\/\//i.test(file.uri)) {
    await RNFS.copyFile(file.uri.replace('file://',''), destPath);
  } else {
    throw new Error('content:
  }

  return `file://${destPath}`;
}
