"use client";

import { useMemo, useState } from "react";

export function ProductImageUploadField() {
  const [files, setFiles] = useState<File[]>([]);
  const previews = useMemo(() => files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })), [files]);

  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 lg:col-span-2">
      <label className="grid cursor-pointer place-items-center rounded-md bg-white p-6 text-center text-sm">
        <span className="font-black text-slate-950">Upload product images</span>
        <span className="mt-1 text-slate-600">Drag images into this field or click to browse. First image becomes the thumbnail.</span>
        <input
          className="sr-only"
          name="images"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          required
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />
      </label>
      {previews.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {previews.map((preview, index) => (
            <div key={`${preview.name}-${index}`} className="rounded-md border border-slate-200 bg-white p-2">
              <div className="h-24 w-full rounded bg-cover bg-center" style={{ backgroundImage: `url(${preview.url})` }} role="img" aria-label={preview.name} />
              <p className="mt-2 truncate text-xs font-semibold text-slate-600">{preview.name}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
