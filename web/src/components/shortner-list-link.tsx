import { CopySimple, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { deleteShortenedLink } from "../services/api";

interface ShortnerListLinkProps {
  id: string;
  shortUrl: string;
  originalUrl: string;
  accessCount: number;
  onDelete: (id: string) => Promise<void>;
}

export function ShortnerListLink({
  id,
  shortUrl,
  originalUrl,
  accessCount,
  onDelete,
}: ShortnerListLinkProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${shortUrl}`);
      setShowCopySuccess(true);
      setTimeout(() => {
        setShowCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      alert("Erro ao copiar link");
    }
  };

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja excluir este link?")) {
      try {
        setIsDeleting(true);
        await deleteShortenedLink(id);
        await onDelete(id);
      } catch (err) {
        console.error("Failed to delete link:", err);
        alert("Erro ao excluir link");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="w-full px-6 py-4 flex items-center justify-between bg-white border-b border-gray-200 last:border-b-0 relative">
      {/* Copy Success Message */}
      {showCopySuccess && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-600 text-white px-4 py-2 rounded-md shadow-lg z-10">
          Link copiado!
        </div>
      )}

      {/* Link Info */}
      <div className="flex-1 min-w-0">
        <a
          href={`https://${shortUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-base font-semibold hover:text-blue-dark transition-colors block mb-1"
        >
          brev.ly/{shortUrl}
        </a>
        <p className="text-sm text-gray-400 truncate">{originalUrl}</p>
      </div>

      {/* Access Count & Actions */}
      <div className="flex items-center gap-4 ml-4">
        <span className="text-sm text-gray-400 font-normal whitespace-nowrap">
          {accessCount} acessos
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 rounded-sm font-semibold text-sm hover:bg-gray-300 hover:text-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Copiar link"
          >
            <CopySimple size={20} weight="bold" />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 rounded-sm font-semibold text-sm hover:bg-gray-300 hover:text-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Excluir link"
          >
            <Trash size={20} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
