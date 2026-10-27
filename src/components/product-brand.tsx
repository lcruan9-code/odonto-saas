import { whiteLabel } from "@/config/white-label";
import { ToothIcon } from "@/components/dental-icons";

/** Logo + nome do produto, conforme src/config/white-label.ts. */
export function ProductBrand() {
  return (
    <span className="flex items-center gap-2.5">
      {whiteLabel.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={whiteLabel.logoUrl} alt="" className="h-10 w-10 rounded-xl object-contain" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
          <ToothIcon className="h-6 w-6" />
        </span>
      )}
      <span className="font-display text-lg font-bold">{whiteLabel.productName}</span>
    </span>
  );
}
