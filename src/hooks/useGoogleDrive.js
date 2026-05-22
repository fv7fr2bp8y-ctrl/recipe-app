import { useState, useCallback, useRef } from 'react';

const FOLDER_NAME = 'Recipe App Photos';
const RECIPES_FILENAME = 'recipes.json';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';

export function useGoogleDrive() {
  const [accessToken, setAccessToken] = useState(null);
  const [uploading, setUploading] = useState(false);
  const folderIdRef = useRef(null);

  const signIn = useCallback((tokenResponse) => {
    setAccessToken(tokenResponse.access_token);
  }, []);

  const signOut = useCallback(() => {
    setAccessToken(null);
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

  // Save all recipes to a JSON file in Drive (upsert)
  const saveRecipesToDrive = useCallback(async (recipes) => {
    if (!accessToken) return;
    try {
      const folderId = await getOrCreateFolder(accessToken);

      // Check if recipes.json already exists
      const search = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${RECIPES_FILENAME}' and '${folderId}' in parents and trashed=false&fields=files(id)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const { files } = await search.json();
      const content = JSON.stringify(recipes);
      const blob = new Blob([content], { type: 'application/json' });

      if (files.length > 0) {
        // Update existing file
        await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${files[0].id}?uploadType=media`,
          { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: blob }
        );
      } else {
        // Create new file
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify({ name: RECIPES_FILENAME, parents: [folderId] })], { type: 'application/json' }));
        form.append('file', blob);
        await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form }
        );
      }
    } catch (err) {
      console.error('Drive save error:', err);
    }
  }, [accessToken, getOrCreateFolder]);

  // Load recipes from Drive
  const loadRecipesFromDrive = useCallback(async () => {
    if (!accessToken) return null;
    try {
      const folderId = await getOrCreateFolder(accessToken);
      const search = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${RECIPES_FILENAME}' and '${folderId}' in parents and trashed=false&fields=files(id)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const { files } = await search.json();
      if (!files.length) return null;

      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${files[0].id}?alt=media`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return await res.json();
    } catch (err) {
      console.error('Drive load error:', err);
      return null;
    }
  }, [accessToken, getOrCreateFolder]);

  // List ALL image files in Drive (entire Drive, not just the app folder)
  const listDrivePhotos = useCallback(async () => {
    if (!accessToken) return [];
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=mimeType contains 'image/' and trashed=false&fields=files(id,name,mimeType)&orderBy=createdTime desc&pageSize=200`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const { files } = await res.json();
      return (files || []).map((f) => ({
        id: f.id,
        name: f.name,
        url: `https://drive.google.com/thumbnail?id=${f.id}&sz=w800`,
        thumb: `https://drive.google.com/thumbnail?id=${f.id}&sz=w200`,
      }));
    } catch (err) {
      console.error('Drive list error:', err);
      return [];
    }
  }, [accessToken, getOrCreateFolder]);

  return { accessToken, signIn, signOut, uploadImage, uploading, saveRecipesToDrive, loadRecipesFromDrive, listDrivePhotos, scopes: SCOPES };
}
