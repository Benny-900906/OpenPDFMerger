'use client'

import React, { useCallback, useMemo, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Dropzone } from "@/components/Home/Dropzone";
import { FileThread } from "@/components/Home/FIleThread";

// declared types
type PdfFile = {
  id: string;
  file: File;
  name: string;
  size: number; // bytes
};

// helper functions 
const fmtBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

const uid = () => Math.random().toString(36).slice(2);

// ---------- Component ----------
export default function PdfMergerApp() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => f.type === "application/pdf");
    const mapped: PdfFile[] = incoming.map((f) => ({ id: uid(), file: f, name: f.name, size: f.size }));
    setFiles((prev) => [...prev, ...mapped]);
  }, []);

  const removeAt = useCallback((idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const move = useCallback((from: number, to: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(Math.max(0, Math.min(to, next.length)), 0, item);
      return next;
    });
  }, []);

  const canMerge = files.length >= 2 && !isMerging;
  const totalSize = useMemo(() => files.reduce((acc, f) => acc + f.size, 0), [files]);

  const clearAll = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  const handleMerge = useCallback(async () => {
    if (files.length < 1) return;
    setIsMerging(true);
    setError(null);
    try {
      const outDoc = await PDFDocument.create();

      for (const f of files) {
        const buf = new Uint8Array(await f.file.arrayBuffer());
        let src: PDFDocument;
        try {
          src = await PDFDocument.load(buf, { ignoreEncryption: false });
        } catch {
          throw new Error(`Cannot open “${f.name}”. It may be encrypted or corrupted.`);
        }
        const pages = await outDoc.copyPages(src, src.getPageIndices());
        pages.forEach((p) => outDoc.addPage(p));
      }

      const outBytes = await outDoc.save({ addDefaultPage: false }); // Uint8Array<ArrayBufferLike>

      // Make an ArrayBuffer that Blob accepts
      const ab = new Uint8Array(outBytes).buffer; // copies; buffer is an ArrayBuffer
      const blob = new Blob([ab], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.download = `merged-${stamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to merge. Please try different files.");
    } finally {
      setIsMerging(false);
    }
  }, [files]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex flex-col gap-1">
          <span className="text-2xl font-bold">PDF Merger</span>
          <span className="text-zinc-300 font-semibold">
            Merge multiple PDF files right in your browser. Your files never leave your device.
          </span>
        </div>

        <Dropzone
          onFilesSelected={addFiles}
          accept="application/pdf"
          multiple
          className="border border-dashed border-neutral-700"
          label="Drag & drop PDFs here"
          helpText="or"
          buttonText="Choose files"
        />

        {files.length > 0 && (
          <div className="text-xs text-zinc-500 mt-2">
            {files.length} file(s) • {fmtBytes(totalSize)}
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            {files.map((f, i) => (
              <FileThread
                key={f.id}
                index={i}
                name={f.name}
                size={f.size}
                totalFiles={files.length}
                onMove={move}
                onRemove={removeAt}
                fmtBytes={fmtBytes}
              />
            ))}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleMerge}
                disabled={!canMerge}
                className="px-4 py-2 font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 hover:cursor-pointer disabled:bg-emerald-900 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isMerging ? "Merging…" : "Merge PDFs"}
              </button>
              <button onClick={clearAll} className="px-3 py-2 font-semibold rounded-xl bg-white/5 hover:bg-white/10 hover:cursor-pointer">Clear</button>
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
          </div>
        )}

        <div className="mt-10 text-xs font-semibold text-zinc-300 flex flex-col gap-1">
          <span>Tip: Reorder files with the ↑ and ↓ buttons before merging.</span>
          <span className="mt-1">Encrypted PDFs aren’t supported by this project.</span>
        </div>
      </div>
    </div>
  );
}
