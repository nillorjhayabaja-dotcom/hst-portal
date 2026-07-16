// SignatureThumbnail - Reusable component for displaying small signature thumbnails
import { CheckCircle2 } from "lucide-react";
import { API_BASE_NORMALIZED } from "@/config/environment";

interface SignatureThumbnailProps {
  signaturePath: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const SIZE_CLASSES = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export function SignatureThumbnail({
  signaturePath,
  size = "md",
  showLabel = false,
}: SignatureThumbnailProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`${SIZE_CLASSES[size]} flex-shrink-0 relative`}>
        <img
          src={`${API_BASE_NORMALIZED}${signaturePath}`}
          alt="Signature"
          className={`${SIZE_CLASSES[size]} object-contain bg-white border rounded`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="%23f0f0f0" width="40" height="40"/><text fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="10">Sig</text></svg>';
          }}
        />
        <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-green-500 bg-white rounded-full" />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">Signed</span>
      )}
    </div>
  );
}