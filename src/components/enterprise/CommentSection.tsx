// Comment Section - Reusable threaded comments with mentions, attachments, and replies
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Reply, AtSign, Image, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CommentItem } from "@/types/enterprise";

interface CommentSectionProps {
  comments: CommentItem[];
  onAddComment?: (content: string, attachments?: File[]) => void;
  currentUser?: { name: string; initials: string };
  className?: string;
}

export function CommentSection({
  comments,
  onAddComment,
  currentUser = { name: "You", initials: "YO" },
  className,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment?.(newComment);
    toast.success("Comment added");
    setNewComment("");
  };

  const handleReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    toast.success("Reply added");
    setReplyContent("");
    setReplyTo(null);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderComment = (comment: CommentItem, isReply = false) => (
    <div
      key={comment.id}
      className={cn("group flex gap-3", isReply ? "ml-10 mt-3" : "mt-4 first:mt-0")}
    >
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
          {comment.authorInitials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{comment.author}</span>
          <span className="text-[10px] text-muted-foreground">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">
          {comment.content.split(/(@\w+\s?\w*)/).map((part, i) =>
            part.startsWith("@") ? (
              <span key={i} className="font-medium text-primary">
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </p>

        {/* Attachments in comment */}
        {comment.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {comment.attachments.map((att) => (
              <button
                key={att.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                {att.type === "pdf" ? (
                  <FileText className="size-3 text-destructive" />
                ) : att.type === "image" ? (
                  <Image className="size-3 text-info" />
                ) : (
                  <FileText className="size-3 text-primary" />
                )}
                <span className="truncate max-w-[150px]">{att.name}</span>
                <span className="text-[10px] text-muted-foreground/60">({att.size})</span>
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Reply className="size-3" />
            Reply
          </button>
          {comment.mentions.length > 0 && (
            <span className="text-[10px] text-muted-foreground/60">
              Mentions: {comment.mentions.join(", ")}
            </span>
          )}
        </div>

        {/* Inline reply */}
        {replyTo === comment.id && (
          <div className="mt-3 flex gap-2">
            <Avatar className="size-7 shrink-0">
              <AvatarFallback className="text-[9px] font-semibold bg-primary/10 text-primary">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder={`Reply to ${comment.author}...`}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[60px] text-xs resize-none"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  <AtSign className="size-3" />
                  Mention
                </Button>
                <div className="flex gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setReplyTo(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => handleReply(comment.id)}
                    disabled={!replyContent.trim()}
                  >
                    <Send className="size-3" />
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {comment.replies.map((reply) => renderComment(reply, true))}
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Comments ({comments.length})</h3>
      </div>

      {/* New comment input */}
      <div className="flex gap-3">
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
            {currentUser.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="Add a comment... Use @ to mention someone"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] text-sm resize-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                <Paperclip className="size-3.5" />
                Attach
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                <AtSign className="size-3.5" />
                Mention
              </Button>
            </div>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={handleSubmit}
              disabled={!newComment.trim()}
            >
              <Send className="size-3.5" />
              Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="divide-y divide-border">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Reply className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No comments yet</p>
            <p className="text-xs text-muted-foreground/60">Be the first to share your thoughts</p>
          </div>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}
