import { useId, useState } from "react";
import { createShortenedLink } from "../services/api";

interface ShortnerAddBodyProps {
  onLinkCreated?: () => void;
}

export function ShortnerAddBody({ onLinkCreated }: ShortnerAddBodyProps) {
  const originalUrlId = useId();
  const shortUrlId = useId();

  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [errors, setErrors] = useState<{
    originalUrl?: string;
    shortUrl?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { originalUrl?: string; shortUrl?: string } = {};

    if (!originalUrl.trim()) {
      newErrors.originalUrl = "Link original é obrigatório";
    } else {
      // Basic URL validation
      try {
        const urlWithProtocol = originalUrl.startsWith("http")
          ? originalUrl
          : `https://${originalUrl}`;
        new URL(urlWithProtocol);
      } catch {
        newErrors.originalUrl = "Link original inválido";
      }
    }

    if (!shortUrl.trim()) {
      newErrors.shortUrl = "Link encurtado é obrigatório";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(shortUrl)) {
      newErrors.shortUrl =
        "Somente letras, números, hífens e underscores são permitidos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const urlWithProtocol = originalUrl.startsWith("http")
        ? originalUrl
        : `https://${originalUrl}`;

      await createShortenedLink({
        url: urlWithProtocol,
        shortenedUrl: shortUrl,
      });

      // Clear form
      setOriginalUrl("");
      setShortUrl("");
      setErrors({});

      // Notify parent to refresh list
      onLinkCreated?.();
    } catch (err: any) {
      console.error("Failed to create link:", err);
      if (err.response?.status === 409) {
        setErrors({ shortUrl: "Este link encurtado já existe" });
      } else {
        setErrors({
          originalUrl: "Erro ao criar link. Tente novamente.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = originalUrl.trim() !== "" && shortUrl.trim() !== "";

  return (
    <div className="w-full bg-white">
      {/* Header */}
      <div className="p-6 pb-4">
        <h2 className="text-lg font-bold text-gray-600">Novo link</h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
        {/* LINK ORIGINAL */}
        <div className="space-y-2">
          <label htmlFor={originalUrlId} className="label">
            Link original
          </label>
          <input
            id={originalUrlId}
            type="text"
            placeholder="linkedin.com/in/myprofile"
            className={`input ${errors.originalUrl ? "input-error" : ""}`}
            value={originalUrl}
            onChange={(e) => {
              setOriginalUrl(e.target.value);
              if (errors.originalUrl) {
                setErrors({ ...errors, originalUrl: undefined });
              }
            }}
            disabled={isSubmitting}
          />
          {errors.originalUrl && (
            <p className="helper-text helper-text-error">{errors.originalUrl}</p>
          )}
        </div>

        {/* LINK ENCURTADO */}
        <div className="space-y-2">
          <label htmlFor={shortUrlId} className="label">
            Link encurtado
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              brev.ly/
            </span>
            <input
              id={shortUrlId}
              type="text"
              placeholder="Linkedin-Profile"
              className={`input ${errors.shortUrl ? "input-error" : ""}`}
              style={{ paddingLeft: "4.5rem" }}
              value={shortUrl}
              onChange={(e) => {
                setShortUrl(e.target.value);
                if (errors.shortUrl) {
                  setErrors({ ...errors, shortUrl: undefined });
                }
              }}
              disabled={isSubmitting}
            />
          </div>
          {errors.shortUrl && (
            <p className="helper-text helper-text-error">{errors.shortUrl}</p>
          )}
        </div>

        {/* Button */}
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Salvar link"}
        </button>
      </form>
    </div>
  );
}
