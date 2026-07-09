// Attachment Section - Reusable file uploader with preview, download, and remove
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, Trash2, FileText, Image, FileArchive, File, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { AttachmentItem } from "@/types/enterprise";

interface AttachmentSectionProps {
  attachments: AttachmentItem[];
  onUpload?: (files: File[]) => void;
  onRemove?: (id: string) => void;
  onDownload?: (attachment: AttachmentItem) => void;
  maxFiles?: number;
  maxSize?: number; // MB
  accept?: string;
  readonly?: boolean;
  className?: string;
}

const FILE_TYPE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileText,
  xlsx: FileText,
  jpg: Image,
  jpeg: Image,
  png: Image,
  gif: Image,
  svg: Image,
  zip: FileArchive,
  rar: FileArchive,
  "7z": FileArchive,
};

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: "text-destructive bg-destructive/10",
  doc: "text-blue-500 bg-blue-500/10",
  docx: "text-blue-500 bg-blue-500/10",
  xls: "text-success bg-success/10",
  xlsx: "text-success bg-success/10",
  jpg: "text-info bg-info/10",
  jpeg: "text-info bg-info/10",
  png: "text-info bg-info/10",
  zip: "text-warning-foreground bg-warning/20",
  rar: "text-warning-foreground bg-warning/20",
};

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function formatFileSize(size: string): string {
  return size;
}

export function AttachmentSection({
  attachments,
  onUpload,
  onRemove,
  onDownload,
  maxFiles = 10,
  maxSize = 10,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip",
  readonly = false,
  className,
}: AttachmentSectionProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    validateAndUpload(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    validateAndUpload(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateAndUpload = (files: File[]) => {
    setError(null);

    if (attachments.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validTypes = accept.split(",").map((t) => t.trim().toLowerCase());
    const invalidFiles = files.filter((f) => {
      const ext = `.${getFileExtension(f.name)}`;
      return !validTypes.includes(ext);
    });

    if (invalidFiles.length > 0) {
      setError(`Invalid file type: ${invalidFiles.map((f) => f.name).join(", ")}`);
      toast.error("Some files have invalid types");
      return;
    }

    const oversized = files.filter((f) => f.size > maxSize * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`Files exceed ${maxSize}MB: ${oversized.map((f) => f.name).join(", ")}`);
      toast.error("Some files exceed the size limit");
      return;
    }

    onUpload?.(files);
    toast.success(`${files.length} file(s) uploaded`);
  };

  const getIcon = (filename: string) => {
    const ext = getFileExtension(filename);
    const Icon = FILE_TYPE_ICONS[ext] ?? File;
    return Icon;
  };

  const getColor = (filename: string) => {
    const ext = getFileExtension(filename);
    return FILE_TYPE_COLORS[ext] ?? "text-muted-foreground bg-muted";
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Attachments ({attachments.length})
        </h3>
        {!readonly && (
          <span className="text-[10px] text-muted-foreground">
            Max {maxFiles} files · {maxSize}MB each
          </span>
        )}
      </div>

      {/* Upload area */}
      {!readonly && (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 transition-colors",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/30 hover:bg-muted/30",
            )}
          >
            <Upload className="size-6 text-muted-foreground/50" />
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Drop files here or click to browse
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/60">{accept}</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Attachment list */}
      {attachments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <FileText className="size-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No attachments</p>
          <p className="text-xs text-muted-foreground/60">
            Upload files to attach to this request
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => {
            const Icon = getIcon(att.name);
            return (
              <div
                key={att.id}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30"
              >
                <div
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-lg",
                    getColor(att.name),
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{att.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                    <span>{att.size}</span>
                    <span>·</span>
                    <span>by {att.uploadedBy}</span>
                    <span>·</span>
                    <span>{new Date(att.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => {
                      onDownload?.(att);
                      toast.success(`Downloading ${att.name}`);
                    }}
                  >
                    <Download className="size-3.5" />
                  </Button>
                  {!readonly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        onRemove?.(att.id);
                        toast.success(`${att.name} removed`);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}