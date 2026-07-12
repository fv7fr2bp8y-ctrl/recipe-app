import { useState, useCallback, useRef } from 'react';

const FOLDER_NAME = 'Recipe App Photos';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email';

export function useGoogleDrive() {
  const [accessToken, setAccessToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [uploading, setUploading] = useState(false);
  const folderIdRef = useRef(null);

  const signIn = useCallback(async (tokenResponse) => {
    const token = tokenResponse.access_token;
    setAccessToken(token);
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const info = await res.json();
      setUserEmail(info.email || null);
    } catch (err) {
      console.error('Failed to fetch user email:', err);
    }
  }, []);

  const signOut = useCallback(() => {
    setAccessToken(null);
    setUserEmail(null);
    folderIdRef.current = null;
  }, []);

  const getOrCreateFolder = useCallback(async (token) => {
    if (folderIdRef.current) return folderIdRef.current;

    const search = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { files } = await search.json();

    let id;
    if (files.length > 0) {
      id = files[0].id;
    } else {
      const create = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
      });
      const folder = await create.json();
      id = folder.id;
    }

    folderIdRef.current = id;
    return id;
  }, []);

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
  }, [accessToken, getOrCreateFolder]);

  // Зарежда снимките от статичния photos.json (без CORS проблеми)
  const listDrivePhotos = useCallback(async () => {
    try {
      const res = await fetch(import.meta.env.BASE_URL + 'photos.json');
      const photos = await res.json();
      return Array.isArray(photos) ? photos : [];
    } catch (err) {
      console.error('Drive list error:', err);
      return [];
    }
  }, []);

  const makePhotoPublic = useCallback(async (fileId) => {
    if (!accessToken) return;
    try {
      await makePublic(accessToken, fileId);
    } catch (err) {
      console.error('Drive permission error:', err);
    }
  }, [accessToken]);

  return {
    accessToken, userEmail, signIn, signOut,
    uploadImage, uploading,
    listDrivePhotos, makePhotoPublic,
    scopes: SCOPES,
  };
}
