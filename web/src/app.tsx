import { useState } from "react";
import { ShortnerAdd } from "./components/shortner-add";
import { ShortnerList } from "./components/shortner-list";

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLinkCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main className="min-h-dvh flex flex-col p-6 md:p-10">
      {/* Logo - centered on mobile, left-aligned on desktop */}
      <div className="w-full flex justify-center md:justify-start mb-8 md:mb-12">
        <img src="/Logo.svg" alt="brev.ly" className="h-10 md:h-11" />
      </div>

      {/* Content - top aligned on mobile, centered on desktop */}
      <div className="flex flex-col md:flex-row md:flex-1 items-start md:justify-center gap-6 md:gap-8">
        <ShortnerAdd onLinkCreated={handleLinkCreated} />
        <ShortnerList refreshTrigger={refreshTrigger} />
      </div>
    </main>
  );
}
