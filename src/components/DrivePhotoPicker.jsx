import { useState, useEffect } from 'react';

export default function DrivePhotoPicker({ listDrivePhotos, onSelect, onClose }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDrivePhotos()
      .then(setPhotos)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span>☁️</span> Избери от Google Drive
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <span className="text-4xl">📂</span>
              <p className="mt-2 text-sm">Няма снимки в папката "Recipe App Photos"</p>
              <p className="text-xs mt-1">Качи снимки в Drive и опитай отново</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => { onSelect(photo.url); onClose(); }}
                  className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <img
                    src={photo.thumb}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t text-xs text-gray-400 text-center">
          {photos.length > 0 && `${photos.length} снимки от „Recipe App Photos"`}
        </div>
      </div>
    </div>
  );
}
