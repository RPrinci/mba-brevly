import { ShortnerAddBody } from "./shortner-add-body";

interface ShortnerAddProps {
  onLinkCreated?: () => void;
}

export function ShortnerAdd({ onLinkCreated }: ShortnerAddProps) {
  return (
    <div className="bg-gray-100 w-full max-w-[380px] rounded-md overflow-hidden">
      <ShortnerAddBody onLinkCreated={onLinkCreated} />
    </div>
  );
}
