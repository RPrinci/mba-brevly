import { useId } from "react";

export function ShortnerAddBody() {
  const originalUrlId = useId();
  const shortUrlId = useId();

  return (
    <div className="w-full bg-white">
      {/* Header */}
      <div className="p-6 pb-4">
        <h2 className="text-lg font-bold text-gray-600">Novo link</h2>
      </div>

      {/* Form */}
      <div className="px-6 pb-6 space-y-6">
        {/* LINK ORIGINAL */}
        <div className="space-y-2">
          <label htmlFor={originalUrlId} className="label">
            Link original
          </label>
          <input
            id={originalUrlId}
            type="url"
            placeholder="linkedin.com/in/myprofile"
            className="input"
          />
        </div>

        {/* LINK ENCURTADO */}
        <div className="space-y-2">
          <label htmlFor={shortUrlId} className="label">
            Link encurtado
          </label>
          <input
            id={shortUrlId}
            type="text"
            placeholder="brev.ly/Linkedin-Profile"
            className="input"
          />
        </div>

        {/* Button */}
        <button type="button" className="btn-primary w-full">
          Salvar link
        </button>
      </div>
    </div>
  );
}
