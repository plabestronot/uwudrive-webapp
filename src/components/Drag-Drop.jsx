import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CloudArrowUpIcon,
  XMarkIcon,
  ArrowPathIcon as SpinIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import { uploadFile } from "../services/driveApi";

export default function DragDropUploadModal({
  isOpen,
  onClose,
  currentVault,
  onUploadSuccess,
}) {
  const [isDraggingOverZone, setIsDraggingOverZone] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({}); // { [fileName]: { progress: 0, error: null, success: false } }

  const resetState = useCallback(() => {
    setIsDraggingOverZone(false);
    setFilesToUpload([]);
    setUploadStatus({});
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Optional: Add any setup when modal opens
    } else {
      // Reset internal state when modal is closed externally
      resetState();
    }
  }, [isOpen, resetState]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverZone(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if the leave is to an element outside the drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDraggingOverZone(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverZone(true); // Keep it true while dragging over
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverZone(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    if (!currentVault) {
      console.error("No active vault for upload.");
      // Optionally, show an error message in the modal
      setUploadStatus(
        droppedFiles.reduce((acc, file) => {
          acc[file.name] = {
            progress: 0,
            error: "No active vault selected.",
            success: false,
          };
          return acc;
        }, {})
      );
      return;
    }

    setFilesToUpload(droppedFiles);
    const initialStatus = droppedFiles.reduce((acc, file) => {
      acc[file.name] = { progress: 0, error: null, success: false };
      return acc;
    }, {});
    setUploadStatus(initialStatus);

    const uploadPromises = droppedFiles.map((file) => {
      return uploadFile(currentVault, file, (percentage) => {
        setUploadStatus((prev) => ({
          ...prev,
          [file.name]: {
            ...prev[file.name],
            progress: percentage,
            error: null,
          },
        }));
      })
        .then(() => {
          setUploadStatus((prev) => ({
            ...prev,
            [file.name]: {
              ...prev[file.name],
              progress: 100,
              success: true,
              error: null,
            },
          }));
          return { name: file.name, success: true };
        })
        .catch((err) => {
          setUploadStatus((prev) => ({
            ...prev,
            [file.name]: {
              ...prev[file.name],
              progress: prev[file.name]?.progress || 0,
              error: err.message || "Upload failed",
              success: false,
            },
          }));
          return { name: file.name, success: false, error: err.message };
        });
    });

    const results = await Promise.all(uploadPromises);
    const allSucceeded = results.every((result) => result.success);

    if (allSucceeded) {
      onUploadSuccess();
      setTimeout(() => {
        onClose();
        resetState();
      }, 2000);
    }
    // If not all succeeded, modal remains open showing errors.
  };

  const handleOverlayDragLeave = (e) => {
    // If dragging leaves the modal overlay entirely, close the modal
    if (
      e.target === e.currentTarget &&
      !e.currentTarget.contains(e.relatedTarget)
    ) {
      onClose();
    }
  };

  const handleOverlayDrop = (e) => {
    // Prevent default for drops on overlay, actual drop handled by dropzone
    e.preventDefault();
    e.stopPropagation();
    // If drop happens on overlay but outside dropzone, it could be handled here or ignored.
    // For simplicity, we assume drop must be on the specific dropzone.
    // If files were dropped on the overlay (not the zone), and we want to close:
    // setIsDraggingOverZone(false); // if it was true
    // onClose(); // This might be too aggressive.
  };

  if (!isOpen) return null;

  const allFilesProcessed =
    filesToUpload.length > 0 &&
    filesToUpload.every((file) => {
      const status = uploadStatus[file.name];
      return status && (status.success || status.error);
    });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onDragOver={handleDragOver} // Allow dragging over the overlay
      onDragLeave={handleOverlayDragLeave} // Detect leaving the overlay
      onDrop={handleOverlayDrop} // Catch drops on overlay (e.g., to prevent default or close)
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-[#1E192B] p-6 rounded-xl shadow-2xl w-full max-w-lg relative text-white border border-purple-500/30"
        // Stop propagation to prevent overlay's dragLeave from firing when moving within modal content
        onDragEnter={(e) => e.stopPropagation()}
        onDragLeave={(e) => e.stopPropagation()}
        onDragOver={(e) => e.stopPropagation()}
        onDrop={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            onClose();
            resetState();
          }}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center">
          Drag & Drop Files
        </h2>

        {filesToUpload.length === 0 ? (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-8 border-2 rounded-lg transition-all duration-200
                        ${
                          isDraggingOverZone
                            ? "border-purple-500 bg-purple-500/20 scale-105"
                            : "border-dashed border-gray-500 hover:border-purple-400 hover:bg-white/5"
                        }`}
          >
            <CloudArrowUpIcon
              className={`h-16 w-16 mb-3 transition-colors ${
                isDraggingOverZone ? "text-purple-400" : "text-gray-400"
              }`}
            />
            <p
              className={`text-lg font-medium ${
                isDraggingOverZone ? "text-purple-300" : "text-gray-300"
              }`}
            >
              Drop files here to upload
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Or click to select (functionality not added to this zone)
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-2">
            {filesToUpload.map((file) => {
              const status = uploadStatus[file.name] || {
                progress: 0,
                error: null,
                success: false,
              };
              const isProcessing =
                !status.success &&
                !status.error &&
                status.progress < 100 &&
                status.progress > 0;
              return (
                <div key={file.name} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[70%]">{file.name}</span>
                    {status.error && (
                      <ExclamationCircleIcon
                        className="h-5 w-5 text-red-400"
                        title={status.error}
                      />
                    )}
                    {status.success && (
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    )}
                    {isProcessing && (
                      <SpinIcon className="h-5 w-5 text-purple-400 animate-spin" />
                    )}
                    {!status.error &&
                      !status.success &&
                      !isProcessing &&
                      status.progress === 0 && (
                        <SpinIcon className="h-5 w-5 text-gray-500 animate-spin" /> // Initial pending state
                      )}
                    {!status.error &&
                      !status.success &&
                      !isProcessing &&
                      status.progress === 100 && (
                        <CheckCircleIcon className="h-5 w-5 text-green-400" /> // Completed but not yet marked success
                      )}
                  </div>
                  {status.error ? (
                    <p className="text-xs text-red-400 mt-1">{status.error}</p>
                  ) : (
                    <div className="w-full bg-gray-600/30 rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <motion.div
                        className={`h-1.5 rounded-full ${
                          status.success
                            ? "bg-green-500"
                            : "bg-gradient-to-r from-purple-500 to-pink-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${status.progress}%` }}
                        transition={{ duration: 0.3, ease: "linear" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {allFilesProcessed && (
          <button
            onClick={() => {
              onClose();
              resetState();
            }}
            className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
