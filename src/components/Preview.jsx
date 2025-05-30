import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  XMarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline"; // Added DocumentIcon

export default function PreviewModal({
  file,
  fileContent,
  isLoading,
  error,
  onClose,
}) {
  const [objectUrl, setObjectUrl] = useState(null);

  const isImage = file && /\.(jpe?g|png|gif|webp|svg)$/i.test(file.name);
  const isText = file && /\.txt$/i.test(file.name);

  useEffect(() => {
    if (isImage && fileContent instanceof Blob) {
      const url = URL.createObjectURL(fileContent);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url); // Cleanup
    }
    setObjectUrl(null); // Reset if not an image blob
  }, [fileContent, isImage]);

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          key="previewBackdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 grid place-items-center p-4 bg-[#120E1C]/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="previewModal"
            variants={modalVariants}
            className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl shadow-2xl overflow-hidden bg-[#1E192B] border border-[#4A3F5E]/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#4A3F5E]/50">
              <h3 className="text-lg sm:text-xl font-bold text-[#E8E0FF] tracking-tight truncate">
                {file.name}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-[#BEAEEF] hover:text-[#E8E0FF] hover:bg-[#4A3F5E]/50 transition-colors duration-150"
                aria-label="Close preview"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4 sm:p-5 flex-grow overflow-auto">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full py-10">
                  <ArrowPathIcon className="h-12 w-12 animate-spin mb-4 text-[#A78BFA]" />
                  <p className="text-[#BEAEEF] text-sm">Loading preview...</p>
                </div>
              )}
              {error && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <ExclamationTriangleIcon className="h-12 w-12 mb-4 text-[#F472B6]" />
                  <p className="font-semibold text-lg text-[#F472B6]">
                    Error Loading Preview
                  </p>
                  <p className="text-sm mt-1.5 text-[#BEAEEF]/80">{error}</p>
                </div>
              )}
              {!isLoading && !error && fileContent && (
                <>
                  {isText && (
                    <pre className="whitespace-pre-wrap break-words text-sm p-3 sm:p-4 rounded-lg bg-[#120E1C] text-[#E0D9F4] font-mono max-h-[calc(85vh-150px)] overflow-auto">
                      {typeof fileContent === "string"
                        ? fileContent
                        : "Content is not plain text."}
                    </pre>
                  )}
                  {isImage && objectUrl && (
                    <div className="flex justify-center items-center h-full">
                      <img
                        src={objectUrl}
                        alt={`Preview of ${file.name}`}
                        className="max-w-full max-h-[calc(85vh-120px)] object-contain rounded-md"
                      />
                    </div>
                  )}
                  {isImage && !objectUrl && !(fileContent instanceof Blob) && (
                    <p className="text-[#BEAEEF]/80 text-center py-10">
                      Image content is not in the expected format.
                    </p>
                  )}
                </>
              )}
              {!isLoading && !error && !fileContent && (
                <div className="flex flex-col items-center justify-center h-full py-10">
                  <DocumentIcon className="h-12 w-12 mb-4 text-[#BEAEEF]/70" />
                  <p className="text-[#BEAEEF]/80 text-sm">
                    No content to display for this file.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
