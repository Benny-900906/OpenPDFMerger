import React from "react";

type FileThreadProps = {
  index: number;
  name: string;
  size: number;
  totalFiles: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  fmtBytes: (bytes: number) => string;
};

export const FileThread = ({
  index,
  name,
  size,
  totalFiles,
  onMove,
  onRemove,
  fmtBytes,
}: FileThreadProps) => {
  return (
    <div
      key={index}
      className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 flex items-center gap-3"
    >
      <div className="text-sm flex-1 truncate">
        <div className="truncate font-semibold">
          {index + 1}. {name}
        </div>
        <div className="text-zinc-500 font-medium text-xs">{fmtBytes(size)}</div>
      </div>

      <div className="flex items-center gap-1">
        <button
          className="px-2 py-1 font-semibold rounded-lg bg-white/5 hover:bg-white/10 hover:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
          title="Move up"
        >
          ↑
        </button>
        <button
          className="px-2 py-1 font-semibold rounded-lg bg-white/5 hover:bg-white/10 hover:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => onMove(index, index + 1)}
          disabled={index === totalFiles - 1}
          title="Move down"
        >
          ↓
        </button>
        <button
          className="px-2 py-1 font-semibold rounded-lg bg-white/5 hover:bg-red-600/20 hover:cursor-pointer"
          onClick={() => onRemove(index)}
          title="Remove"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
