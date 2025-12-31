import { ArrowsClockwise } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOriginalUrlByShortened } from "../services/api";

export function RedirectPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [notFound, setNotFound] = useState(false);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  useEffect(() => {
    async function redirectToOriginalUrl() {
      try {
        // Use the new endpoint that validates URL and increments visit count
        const link = await getOriginalUrlByShortened(shortCode!);

        const url = link.url;
        setOriginalUrl(url);

        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = url;
        }, 2000);
      } catch (err: any) {
        console.error("Failed to redirect:", err);
        // The backend returns 404 if link doesn't exist or target URL is invalid
        setNotFound(true);
      }
    }

    if (shortCode) {
      redirectToOriginalUrl();
    }
  }, [shortCode]);

  if (notFound) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-gray-200">
        <div className="bg-white rounded-lg p-12 max-w-2xl w-full text-center shadow-lg">
          {/* 404 Error */}
          <div className="mb-6 flex justify-center">
            <img src="/404.svg" alt="404" className="w-32 h-auto" />
          </div>

          {/* Error Message */}
          <h2 className="text-2xl font-bold text-gray-600 mb-4">
            Link não encontrado
          </h2>
          <p className="text-gray-400 mb-2">
            O link que você está tentando acessar não existe, foi removido ou é
            uma URL inválida.
          </p>
          <p className="text-gray-400">
            Saiba mais em{" "}
            <a href="/" className="text-blue-base font-semibold hover:text-blue-dark">
              brev.ly
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-gray-200">
      <div className="bg-white rounded-lg p-12 max-w-2xl w-full text-center shadow-lg">
        {/* Loading Icon */}
        <div className="mb-6 flex justify-center">
          <ArrowsClockwise
            size={64}
            weight="bold"
            className="text-blue-dark animate-spin"
          />
        </div>

        {/* Redirecting Message */}
        <h2 className="text-2xl font-bold text-gray-600 mb-4">
          Redirecionando...
        </h2>
        <p className="text-gray-400 mb-2">
          O link será aberto automaticamente em alguns instantes.
        </p>
        <p className="text-gray-400">
          Não foi redirecionado?{" "}
          {originalUrl ? (
            <a
              href={originalUrl}
              className="text-blue-base font-semibold hover:text-blue-dark"
            >
              Acesse aqui
            </a>
          ) : (
            <span className="text-gray-400">Carregando...</span>
          )}
        </p>
      </div>
    </div>
  );
}
