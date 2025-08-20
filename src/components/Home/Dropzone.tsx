import React, { useCallback, useRef, useState } from "react";

type DropzoneProps = {
  onFilesSelected: (files: FileList | null) => void;
  accept?: string;   // e.g. "application/pdf"
  multiple?: boolean;  // default: true
  className?: string;
  label?: string; // heading text
  helpText?: string; // sub text
  buttonText?: string; // pick files button label
};

export const Dropzone = ({
  onFilesSelected,
  accept = "application/pdf",
  multiple = true,
  className = "",
  label = "Drag & drop files here",
  helpText = "or",
  buttonText = "Choose files",
}: DropzoneProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const onPickFiles = useCallback(() => inputRef.current?.click(), []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      onFilesSelected(e.dataTransfer.files);
    },
    [onFilesSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPickFiles()}
      className={[
        "rounded-2xl p-8 flex flex-col items-center justify-center gap-4 select-none outline-none",
        "border border-dashed transition",
        isDragging ? "border-emerald-500 bg-emerald-500/5" : "border-zinc-500 bg-zinc-900/40",
        className,
      ].join(" ")}
      aria-label="File dropzone"
    >
      <div className="text-zinc-300 text-md font-semibold">{label}</div>
      <div className="text-zinc-500 text-sm font-semibold">{helpText}</div>
      <button
        type="button"
        onClick={onPickFiles}
        className="px-4 py-2 font-semibold rounded-xl bg-white/10 hover:bg-white/20 transition hover:cursor-pointer"
      >
        {buttonText}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => onFilesSelected(e.target.files)}
      />
    </div>
  );
}
