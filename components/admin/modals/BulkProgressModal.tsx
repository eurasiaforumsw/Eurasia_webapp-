"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface BulkProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: "delete" | "publish" | "archive" | "unpublish" | "approve";
  selectedIds: string[];
  entityType: "content" | "members";
  onExecute: (ids: string[]) => Promise<void>;
}

interface ItemProgress {
  id: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

export function BulkProgressModal({
  isOpen,
  onClose,
  action,
  selectedIds,
  entityType,
  onExecute,
}: BulkProgressModalProps) {
  const [progress, setProgress] = useState<ItemProgress[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (isOpen && !hasStarted) {
      // Initialize progress state
      setProgress(
        selectedIds.map((id) => ({
          id,
          status: "pending",
        }))
      );
    }
  }, [isOpen, selectedIds, hasStarted]);

  const startBulkOperation = async () => {
    setIsRunning(true);
    setHasStarted(true);

    for (let i = 0; i < selectedIds.length; i++) {
      const id = selectedIds[i];

      // Mark as processing
      setProgress((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "processing" } : item))
      );

      try {
        // Execute the action for this single item
        await onExecute([id]);

        // Mark as success
        setProgress((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "success" } : item))
        );
      } catch (error) {
        // Mark as error
        setProgress((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, status: "error", error: error instanceof Error ? error.message : "Failed" }
              : item
          )
        );
      }

      // Small delay between operations
      if (i < selectedIds.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    setIsRunning(false);
  };

  const handleClose = () => {
    if (!isRunning) {
      setHasStarted(false);
      setProgress([]);
      onClose();
    }
  };

  const successCount = progress.filter((p) => p.status === "success").length;
  const errorCount = progress.filter((p) => p.status === "error").length;
  const progressPercent = progress.length > 0 ? (successCount + errorCount) / progress.length * 100 : 0;
  const isDone = !isRunning && hasStarted;

  const actionLabel = {
    delete: "Deleting",
    publish: "Publishing",
    archive: "Archiving",
    unpublish: "Unpublishing",
    approve: "Approving",
  }[action];

  const actionPastLabel = {
    delete: "Deleted",
    publish: "Published",
    archive: "Archived",
    unpublish: "Unpublished",
    approve: "Approved",
  }[action];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 p-6">
                <div className="flex items-center gap-3">
                  {isRunning && <Loader2 className="h-5 w-5 animate-spin text-sky-400" />}
                  {isDone && errorCount === 0 && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                  {isDone && errorCount > 0 && <AlertCircle className="h-5 w-5 text-amber-400" />}
                  <h2 className="text-xl font-semibold text-slate-100">
                    {!hasStarted
                      ? `Bulk ${actionLabel}`
                      : isDone
                      ? `Bulk Operation Complete`
                      : `${actionLabel}...`}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  disabled={isRunning}
                  className="text-slate-400 hover:text-slate-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                {/* Summary */}
                {!hasStarted ? (
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <p className="text-slate-300">
                      You are about to <strong className="text-slate-100">{action}</strong>{" "}
                      <strong className="text-slate-100">{selectedIds.length}</strong> {entityType}.
                    </p>
                    <p className="text-sm text-slate-400 mt-2">This action cannot be undone.</p>
                  </div>
                ) : (
                  <>
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Progress</span>
                        <span className="font-mono text-slate-300">
                          {successCount + errorCount} / {progress.length}
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>

                    {/* Status Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-2xl font-bold text-emerald-400">{successCount}</div>
                        <div className="text-xs text-emerald-300/70">Success</div>
                      </div>
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="text-2xl font-bold text-red-400">{errorCount}</div>
                        <div className="text-xs text-red-300/70">Failed</div>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                        <div className="text-2xl font-bold text-slate-300">
                          {progress.length - successCount - errorCount}
                        </div>
                        <div className="text-xs text-slate-400">Remaining</div>
                      </div>
                    </div>

                    {/* Item List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {progress.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-colors",
                            item.status === "success" && "bg-emerald-500/5 border-emerald-500/20",
                            item.status === "error" && "bg-red-500/5 border-red-500/20",
                            item.status === "processing" && "bg-sky-500/5 border-sky-500/20",
                            item.status === "pending" && "bg-slate-800/30 border-slate-700/50"
                          )}
                        >
                          <span className="text-sm font-mono text-slate-400 truncate">{item.id.slice(0, 8)}...</span>
                          <div className="flex items-center gap-2">
                            {item.status === "pending" && (
                              <span className="text-xs text-slate-500">Pending</span>
                            )}
                            {item.status === "processing" && (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                                <span className="text-xs text-sky-400">Processing</span>
                              </>
                            )}
                            {item.status === "success" && (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                <span className="text-xs text-emerald-400">Success</span>
                              </>
                            )}
                            {item.status === "error" && (
                              <>
                                <XCircle className="h-4 w-4 text-red-400" />
                                <span className="text-xs text-red-400">{item.error || "Failed"}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-800 p-6">
                {!hasStarted ? (
                  <>
                    <Button variant="ghost" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={startBulkOperation}
                      className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600"
                    >
                      Start {actionLabel}
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleClose} disabled={isRunning}>
                    {isDone ? "Close" : "Cancel"}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
