import { ShortnerListBody } from "./shortner-list-body";

interface ShortnerListProps {
  refreshTrigger?: number;
}

export function ShortnerList({ refreshTrigger }: ShortnerListProps) {
  return (
    <div className="bg-gray-100 w-full max-w-[580px] rounded-md overflow-hidden">
      <ShortnerListBody refreshTrigger={refreshTrigger} />
    </div>
  );
}
