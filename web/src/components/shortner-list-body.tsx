import { DownloadSimple, LinkSimple } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import {
  exportShortenedLinksCSV,
  getShortenedLinks,
  type ShortenedLink,
} from "../services/api";
import { ShortnerListLink } from "./shortner-list-link";

interface ShortnerListBodyProps {
  refreshTrigger?: number;
}

export function ShortnerListBody({ refreshTrigger }: ShortnerListBodyProps) {
  const [links, setLinks] = useState<ShortenedLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadLinks() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getShortenedLinks();
        setLinks(data.shortenedLinks);
      } catch (err) {
        console.error("Failed to load links:", err);
        setError("Erro ao carregar links");
      } finally {
        setIsLoading(false);
      }
    }

    loadLinks();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    // Refresh the list after deletion
    const data = await getShortenedLinks();
    setLinks(data.shortenedLinks);
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const csvContent = await exportShortenedLinksCSV();

      // Create a Blob from the CSV content
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

      // Create a download link
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `brevly-links-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export CSV:", err);
      alert("Erro ao exportar CSV. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full bg-white">
      {/* Header */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-600">Meus links</h2>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={isExporting || links.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 rounded-sm font-semibold text-sm hover:bg-gray-300 hover:text-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DownloadSimple size={16} weight="bold" />
          <span>{isExporting ? "Exportando..." : "Baixar CSV"}</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <p className="text-sm text-gray-400">Carregando...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && links.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-16 h-16 flex items-center justify-center mb-4">
            <LinkSimple size={32} weight="bold" className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold">
            Ainda não existem links cadastrados
          </p>
        </div>
      )}

      {/* List Links */}
      {!isLoading && !error && links.length > 0 && (
        <div>
          {links.map((link) => (
            <ShortnerListLink
              key={link.id}
              id={link.id}
              shortUrl={link.shortenedUrl}
              originalUrl={link.url}
              accessCount={link.visits}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
