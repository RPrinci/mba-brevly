import { CopySimple, Trash } from "@phosphor-icons/react";

interface ShortnerListLinkProps {
  shortUrl: string;
  originalUrl: string;
  accessCount: number;
}

export function ShortnerListLink({
  shortUrl,
  originalUrl,
  accessCount,
}: ShortnerListLinkProps) {
  return (
    <div className="w-full px-6 py-4 flex items-center justify-between bg-white border-b border-gray-200 last:border-b-0">
      {/* Link Info */}
      <div className="flex-1 min-w-0">
        <a
          href={`https://${shortUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-base font-semibold hover:text-blue-dark transition-colors block mb-1"
        >
          {shortUrl}
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
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 rounded-sm font-semibold text-sm hover:bg-gray-300 hover:text-gray-500 transition-all duration-200"
            aria-label="Copiar link"
          >
            <CopySimple size={20} weight="bold" />
          </button>

          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 rounded-sm font-semibold text-sm hover:bg-gray-300 hover:text-gray-500 transition-all duration-200"
            aria-label="Excluir link"
          >
            <Trash size={20} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
