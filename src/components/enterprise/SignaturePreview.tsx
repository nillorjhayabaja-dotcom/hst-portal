// SignaturePreview - Reusable component for previewing signatures in approval history
import { useState } from "react";
import { API_BASE_NORMALIZED } from "@/config/environment";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignatureViewer } from "./SignatureViewer";

interface SignaturePreviewProps {
  signaturePath: string;
  fileName?: string;
  approvalDate?: string;
  approverName?: string;
  compact?: boolean;
}

export function SignaturePreview({
  signaturePath,
  fileName,
  approvalDate,
  approverName,
  compact = false,
}: SignaturePreviewProps) {
  const [showViewer, setShowViewer] = useState(false);

  if (compact) {
    return (
      <>
        <Button
          variant="link"
          size="sm"
          onClick={() => setShowViewer(true)}
          className="h-auto p-0 text-blue-600 hover:text-blue-800"
        >
          <Eye className="h-3 w-3 mr-1" />
          View Signature
        </Button>
        {showViewer && (
          <SignatureViewer
            open={showViewer}
            onOpenChange={setShowViewer}
            signaturePath={signaturePath}
            fileName={fileName}
            approvalDate={approvalDate}
            approverName={approverName}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <div className="flex-shrink-0">
          <img
            src={`${API_BASE_NORMALIZED}${signaturePath}`}
            alt="Signature"
            className="h-12 w-auto object-contain bg-white border rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><rect fill="%23f0f0f0" width="100" height="40"/><text fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="12">Signature</text></svg>';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName || 'Electronic Signature'}</p>
          {approverName && (
            <p className="text-xs text-muted-foreground">Signed by {approverName}</p>
          )}
          {approvalDate && (
            <p className="text-xs text-muted-foreground">
              {new Date(approvalDate).toLocaleString()}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowViewer(true)}
          className="h-8 w-8 flex-shrink-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {showViewer && (
        <SignatureViewer
          open={showViewer}
          onOpenChange={setShowViewer}
          signaturePath={signaturePath}
          fileName={fileName}
          approvalDate={approvalDate}
          approverName={approverName}
        />
      )}
    </>
  );
}