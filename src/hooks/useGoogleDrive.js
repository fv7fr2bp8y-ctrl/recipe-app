import { useState, useCallback } from 'react';

const FOLDER_NAME = 'Recipe App Photos';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export function useGoogleDrive() {
  const [accessToken, setAccessToken] = useState(null);
  const [uploading, setUploading] = useState(false);

  const signIn = useCallback((tokenResponse) => {
    setAccessToken(tokenResponse.access_token);
  }, []);

  const signOut = useCallback(() => {
    setAccessToken(null);
  }, []);

  const getOrCreateFolder = async (token) => {
    const search = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { files } = await search.json();
    if (files.length > 0) return files[0].id;

    const create = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
    });
    const folder = await create.json();
    return folder.id;
  };

  const makePublic = async (token, fileId) => {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });
  };

  const uploadImage = useCallback(async (file) => {
    if (!accessToken) return null;
    setUploading(true);
    try {
      const folderId = await getOrCreateFolder(accessToken);

      const metadata = { name: file.name, parents: [folderId] };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form }
      );
      const { id } = await res.json();

      await makePublic(accessToken, id);

      return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
    } finally {
      setUploading(false);
    }
  }, [accessToken]);

  return { accessToken, signIn, signOut, uploadImage, uploading, scopes: SCOPES };
}
