// SignatureViewer - Reusable dialog for viewing signatures in full size
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface SignatureViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signaturePath: string;
  fileName?: string;
  approvalDate?: string;
  approverName?: string;
}

export function SignatureViewer({
  open,
  onOpenChange,
  signaturePath,
  fileName,
  approvalDate,
  approverName,
}: SignatureViewerProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `http://localhost:3001${signaturePath}`;
    link.download = fileName || "signature.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Electronic Signature</DialogTitle>
          {approverName && (
            <p className="text-sm text-muted-foreground">
              Signed by {approverName}
            </p>
          )}
          {approvalDate && (
            <p className="text-xs text-muted-foreground">
              {new Date(approvalDate).toLocaleString()}
            </p>
          )}
        </DialogHeader>

        <div className="py-4">
          <div className="bg-white border rounded-lg p-4 flex items-center justify-center">
            <img
              src={`http://localhost:3001${signaturePath}`}
              alt="Electronic Signature"
              className="max-w-full h-auto max-h-[500px] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="150"><rect fill="%23f0f0f0" width="400" height="150"/><text fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="14">Signature Image Not Available</text></svg>';
              }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}