import { DownloadSimple, LinkSimple } from "@phosphor-icons/react";
import { ShortnerListLink } from "./shortner-list-link";

export function ShortnerListBody() {
  return (
    <div className="w-full bg-white">
      {/* Header */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-200 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-600">Meus links</h2>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 rounded-sm font-semibold text-sm hover:bg-gray-300 hover:text-gray-500 transition-all duration-200"
        >
          <DownloadSimple size={16} weight="bold" />
          <span>Baixar CSV</span>
        </button>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-16 h-16 flex items-center justify-center mb-4">
          <LinkSimple size={32} weight="bold" className="text-gray-400" />
        </div>
        <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold">
          Ainda não existem links cadastrados
        </p>
      </div>
      {/* ListLinks */}
      <ShortnerListLink
        shortUrl={"brev.ly/Portfolio-Dev"}
        originalUrl={"devsite.portfolio.com.br/devname-123456"}
        accessCount={30}
      />
      <ShortnerListLink
        shortUrl={"brev.ly/Portfolio-Dev"}
        originalUrl={"devsite.portfolio.com.br/devname-123456"}
        accessCount={30}
      />
      <ShortnerListLink
        shortUrl={"brev.ly/Portfolio-Dev"}
        originalUrl={"devsite.portfolio.com.br/devname-123456"}
        accessCount={30}
      />
    </div>
  );
}
