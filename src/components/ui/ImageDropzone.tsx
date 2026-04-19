import { useCallback, useRef, useState, DragEvent } from "react";
import { api, BASE_MEDIA } from "../../api/client";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif", "image/bmp", "image/svg+xml"];
const ACCEPTED_EXT = ".jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,.svg";
const MAX_SIZE_MB = 10;
const COMPRESS_IF_ABOVE_KB = 300;
const MAX_DIMENSION = 1400;

interface UploadItem {
  id: string;
  name: string;
  originalKB: number;
  compressedKB?: number;
  status: "compressing" | "uploading" | "done" | "error";
  url?: string;
  progress: number;
}

interface Props {
  onUploaded: (urls: string[]) => void;
  maxFiles?: number;
  existingCount?: number;
  label?: string;
}

async function compressImage(file: File): Promise<{ blob: Blob; compressedKB: number; originalKB: number }> {
  const originalKB = Math.round(file.size / 1024);
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml" || file.size < COMPRESS_IF_ABOVE_KB * 1024) {
    return { blob: file, compressedKB: originalKB, originalKB };
  }
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const quality = file.size > 2 * 1024 * 1024 ? 0.78 : 0.85;
      const outputType = "image/webp";
      canvas.toBlob((blob) => {
        if (!blob || blob.size >= file.size) {
          resolve({ blob: file, compressedKB: originalKB, originalKB });
        } else {
          resolve({ blob, compressedKB: Math.round(blob.size / 1024), originalKB });
        }
      }, outputType, quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ blob: file, compressedKB: originalKB, originalKB }); };
    img.src = url;
  });
}

function fmtKB(kb: number) { return kb >= 1024 ? `${(kb / 1024).toFixed(1)}MB` : `${kb}KB`; }

export default function ImageDropzone({ onUploaded, maxFiles = 10, existingCount = 0, label }: Props) {
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const remaining = maxFiles - existingCount - items.filter(i => i.status === "done").length;

  const updateItem = (id: string, patch: Partial<UploadItem>) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));

  const processFiles = useCallback(async (files: File[]) => {
    const valid = files
      .filter(f => ACCEPTED.includes(f.type) && f.size <= MAX_SIZE_MB * 1024 * 1024)
      .slice(0, remaining);

    if (!valid.length) return;

    const newItems: UploadItem[] = valid.map(f => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      originalKB: Math.round(f.size / 1024),
      status: "compressing",
      progress: 0,
    }));
    setItems(prev => [...prev, ...newItems]);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      const item = newItems[i];

      // Compress
      let compressed: Blob;
      let compressedKB: number;
      try {
        const result = await compressImage(file);
        compressed = result.blob;
        compressedKB = result.compressedKB;
        updateItem(item.id, { compressedKB, status: "uploading", progress: 10 });
      } catch {
        compressed = file;
        compressedKB = item.originalKB;
        updateItem(item.id, { compressedKB, status: "uploading", progress: 10 });
      }

      // Upload
      const fd = new FormData();
      const ext = compressed.type === "image/webp" ? ".webp" : file.name.match(/\.[^.]+$/)?.[0] || ".jpg";
      fd.append("file", compressed, file.name.replace(/\.[^.]+$/, "") + ext);

      try {
        const res = await api.post("/upload/image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            const pct = e.total ? Math.round((e.loaded / e.total) * 80) + 10 : 50;
            updateItem(item.id, { progress: pct });
          },
        });
        const url = BASE_MEDIA + res.data.url;
        updateItem(item.id, { status: "done", url, progress: 100 });
        uploadedUrls.push(res.data.url);
      } catch {
        updateItem(item.id, { status: "error", progress: 0 });
      }
    }

    if (uploadedUrls.length) onUploaded(uploadedUrls);
  }, [remaining, onUploaded]);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => remaining > 0 && fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer
          ${dragging
            ? "border-[#2382AA] bg-[#2382AA]/5 scale-[1.01]"
            : "border-gray-200 dark:border-gray-600 hover:border-[#2382AA] hover:bg-[#2382AA]/3 bg-gray-50 dark:bg-gray-800/50"}
          ${remaining <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className={`text-4xl mb-2 transition-transform ${dragging ? "scale-125" : ""}`}>
          {dragging ? "📂" : "🖼️"}
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {dragging ? "Drop images here!" : (label || "Drag & drop images, or click to browse")}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          JPG · PNG · WebP · GIF · AVIF · BMP &nbsp;·&nbsp; Max {MAX_SIZE_MB}MB each
        </p>
        <p className="text-xs text-[#2382AA] font-medium mt-1">
          {remaining > 0 ? `Up to ${remaining} more image${remaining > 1 ? "s" : ""}` : "Max images reached"}
        </p>
        {dragging && (
          <div className="absolute inset-0 rounded-2xl border-2 border-[#2382AA] bg-[#2382AA]/10 flex items-center justify-center">
            <span className="text-[#2382AA] font-semibold text-sm">Release to upload</span>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_EXT}
        multiple
        className="hidden"
        onChange={e => e.target.files && processFiles(Array.from(e.target.files))}
        onClick={e => ((e.target as HTMLInputElement).value = "")}
      />

      {/* Upload Progress Items */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              {/* Thumbnail or spinner */}
              <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                {item.status === "done" && item.url ? (
                  <img src={item.url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {item.status === "error"
                      ? <span className="text-red-400 text-lg">✕</span>
                      : <div className="w-5 h-5 border-2 border-gray-200 border-t-[#2382AA] rounded-full animate-spin" />}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                  <span className={`text-xs flex-shrink-0 font-semibold ${item.status === "done" ? "text-green-500" : item.status === "error" ? "text-red-500" : "text-[#2382AA]"}`}>
                    {item.status === "compressing" && "Compressing..."}
                    {item.status === "uploading" && `${item.progress}%`}
                    {item.status === "done" && "✓ Done"}
                    {item.status === "error" && "✕ Failed"}
                  </span>
                </div>

                {/* Size info */}
                {item.compressedKB !== undefined && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-gray-400 line-through">{fmtKB(item.originalKB)}</span>
                    <span className="text-xs text-gray-400">→</span>
                    <span className="text-xs text-green-500 font-medium">{fmtKB(item.compressedKB)}</span>
                    {item.originalKB > item.compressedKB && (
                      <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-medium">
                        -{Math.round((1 - item.compressedKB / item.originalKB) * 100)}%
                      </span>
                    )}
                  </div>
                )}

                {/* Progress bar */}
                {item.status === "uploading" && (
                  <div className="mt-1.5 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-[#2382AA] rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
              </div>

              {/* Remove */}
              {(item.status === "done" || item.status === "error") && (
                <button onClick={() => removeItem(item.id)}
                  className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-red-500 transition rounded-full hover:bg-red-50">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
