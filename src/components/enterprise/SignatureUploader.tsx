// SignatureUploader - Reusable component for uploading electronic signatures
import { useState, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SignatureUploaderProps {
  onSignatureSelect: (file: File) => void;
  onSignatureClear: () => void;
  selectedSignature?: File;
  disabled?: boolean;
}

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export function SignatureUploader({
  onSignatureSelect,
  onSignatureClear,
  selectedSignature,
  disabled = false,
}: SignatureUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid format. Only PNG, JPG, JPEG, and WEBP are allowed.");
      toast.error("Invalid signature format");
      return false;
    }

    if (file.size > MAX_SIZE) {
      setError("File size exceeds 2MB limit.");
      toast.error("Signature file too large");
      return false;
    }

    setError(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onSignatureSelect(file);
  };

  const handleClear = () => {
    setPreview(null);
    setError(null);
    onSignatureClear();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled && !selectedSignature) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {!selectedSignature ? (
        <div
          onClick={handleClick}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-accent"}
            ${error ? "border-destructive" : "border-muted-foreground/25"}
          `}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">Click to upload signature</p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, JPEG, WEBP (max 2MB)
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedSignature.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedSignature.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              disabled={disabled}
              className="h-8 w-8 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {preview && (
            <div className="mt-3 p-3 bg-white rounded border">
              <img
                src={preview}
                alt="Signature preview"
                className="max-w-full h-auto max-h-32 mx-auto"
                style={{ objectFit: "contain" }}
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}