type PdfPreviewProps = {
  blobUrl: string;
  filename?: string;
};

export const PdfPreview = ({ blobUrl, filename = 'merged.pdf' }: PdfPreviewProps) => {
  const onDownload = () => {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Use <iframe> for broad support */}
      <iframe
        src={blobUrl}
        className="flex-1 w-full h-full bg-neutral-900"
        title="Merged PDF Preview"
      />
      <div className="border-t border-neutral-800 p-2 flex items-center gap-2">
        <button
          onClick={onDownload}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold hover:cursor-pointer"
        >
          Download
        </button>
        <a
          href={blobUrl}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold hover:cursor-pointer"
        >
          Open in new tab
        </a>
      </div>
    </div>
  );
}
