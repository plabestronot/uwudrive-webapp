import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CloudArrowUpIcon,
  ArrowPathIcon as SpinIcon,
  ArrowUpTrayIcon, // For mobile icon
} from "@heroicons/react/24/solid";
import { uploadFile } from "../services/driveApi";

export default function FileUpload({
  currentVault,
  onUploadSuccess,
  isMobile = false,
  isDesktopGrid = false,
  isDockIcon = false,
}) {
  const [processingFile, setProcessingFile] = useState(null); // File currently being processed
  const [isBatchUploading, setIsBatchUploading] = useState(false); // True if any file in a batch is uploading
  const [currentFileProgress, setCurrentFileProgress] = useState(0); // Progress of the current file
  const [currentFileError, setCurrentFileError] = useState(""); // Error for the current file
  const [currentFileSuccessMessage, setCurrentFileSuccessMessage] =
    useState(""); // Success message for the current file
  const fileInputRef = useRef(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handles the logic for uploading a single file
  const handleUploadLogic = async (fileToUpload) => {
    if (!fileToUpload) {
      setCurrentFileError("No file selected for upload.");
      return;
    }
    if (!currentVault) {
      setCurrentFileError("No active vault.");
      return;
    }
    // Batch uploading state is managed by handleFileChange
    setProcessingFile(fileToUpload);
    setCurrentFileError("");
    setCurrentFileSuccessMessage("");
    setCurrentFileProgress(0);
    try {
      const onProgress = (percentage) => setCurrentFileProgress(percentage);
      await uploadFile(currentVault, fileToUpload, onProgress);
      setCurrentFileSuccessMessage(`Uploaded: ${fileToUpload.name}`);
      onUploadSuccess(); // Callback for overall success indication
    } catch (err) {
      setCurrentFileError(err.message || "Upload failed.");
    } finally {
      setCurrentFileProgress(100); // Mark current file progress as complete
      // Clearing of fileInputRef.current.value is handled after the whole batch
      setTimeout(() => {
        // Clear messages for this specific file
        setCurrentFileSuccessMessage("");
        setCurrentFileError("");
        // setProcessingFile(null); // Don't nullify here, wait for next file or batch end
      }, 4000);
    }
  };

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      setIsBatchUploading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Clear messages and details for the new file to be processed
        setCurrentFileError("");
        setCurrentFileSuccessMessage("");
        setProcessingFile(null);

        await handleUploadLogic(file);
      }
      setIsBatchUploading(false);
      setProcessingFile(null); // Clear details after the entire batch is done
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input to allow re-uploading same files
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 5, height: 0 },
    visible: {
      opacity: 1,
      y: 0,
      height: "auto",
      transition: { duration: 0.25 },
    },
    exit: { opacity: 0, y: -5, height: 0, transition: { duration: 0.2 } },
  };

  let buttonClassName = `flex items-center justify-center w-full px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#C084FC] text-white hover:from-[#7C3AED] hover:to-[#A855F7] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/60 focus:ring-offset-2 focus:ring-offset-[#1E192B] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform active:scale-[0.97] shadow-md hover:shadow-lg`;
  let iconClassName = `h-5 w-5 mr-2 text-white`;
  let textContent = isBatchUploading ? `Uploading...` : "Upload Files"; // Changed text
  let whileHoverProps = {
    scale: isBatchUploading ? 1 : 1.03,
    y: isBatchUploading ? 0 : -1,
  };
  let whileTapProps = {
    scale: isBatchUploading ? 1 : 0.97,
    y: isBatchUploading ? 0 : 0,
  };
  let mainDivClassName = "flex flex-col items-start w-full";
  let iconToShow = isBatchUploading ? (
    <SpinIcon className={`animate-spin ${iconClassName}`} />
  ) : (
    <CloudArrowUpIcon className={iconClassName} />
  );

  if (isDockIcon) {
    buttonClassName = `p-3 rounded-lg text-[#BEAEEF] hover:bg-[#2C253E] transition-colors disabled:opacity-60 disabled:cursor-not-allowed`;
    iconClassName = `h-7 w-7`; // Match other dock icons
    textContent = null; // Icon only for dock
    iconToShow = isBatchUploading ? (
      <SpinIcon className={`animate-spin ${iconClassName}`} />
    ) : (
      <CloudArrowUpIcon className={iconClassName} />
    );
    whileHoverProps = { scale: 1.2, y: -8 };
    whileTapProps = { scale: 1.1 };
    mainDivClassName = "flex flex-col items-center w-auto"; // Allow it to shrink in the dock
  } else if (isMobile) {
    buttonClassName = `flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium text-[#BEAEEF] hover:bg-[#3B3050] hover:text-[#E8E0FF] focus:outline-none focus:ring-1 focus:ring-[#A78BFA]/60 disabled:opacity-60 disabled:cursor-not-allowed h-full w-full`;
    iconClassName = `h-5 w-5 mb-0.5`;
    textContent = isBatchUploading ? (
      <span className="mt-0.5">Sending</span>
    ) : (
      <span className="mt-0.5">Upload</span>
    ); // Kept "Upload" for brevity
    iconToShow = isBatchUploading ? (
      <SpinIcon className={`animate-spin ${iconClassName}`} />
    ) : (
      <ArrowUpTrayIcon className={iconClassName} />
    );
    whileHoverProps = {};
    whileTapProps = { scale: 0.95 };
    mainDivClassName = "flex flex-col items-center w-auto h-full";
  } else if (isDesktopGrid) {
    buttonClassName = `flex flex-col items-center justify-center p-3 rounded-lg text-xs font-medium bg-[#2C253E] text-[#BEAEEF] hover:bg-[#3B3050] hover:text-[#E8E0FF] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/60 focus:ring-offset-2 focus:ring-offset-[#1E192B] disabled:opacity-60 disabled:cursor-not-allowed h-full w-full transition-colors duration-150 ease-in-out`;
    iconClassName = `h-6 w-6 mb-1`;
    textContent = isBatchUploading ? (
      <span className="mt-0.5">Sending</span>
    ) : (
      <span className="mt-0.5">Upload</span>
    ); // Kept "Upload" for brevity
    iconToShow = isBatchUploading ? (
      <SpinIcon className={`animate-spin ${iconClassName}`} />
    ) : (
      <CloudArrowUpIcon className={iconClassName} />
    );
    whileHoverProps = { scale: 1.05 };
    whileTapProps = { scale: 0.95 };
    mainDivClassName = "flex flex-col items-center w-full h-full";
  }

  const motionButtonProps = {
    onClick: triggerFileInput,
    disabled: isBatchUploading, // Use batch state
    className: buttonClassName,
    whileHover: whileHoverProps,
    whileTap: whileTapProps,
    transition: { type: "spring", stiffness: 500, damping: 15 },
    ...(isDockIcon && { title: "Upload Files" }), // Add title for dock icon, pluralized
  };

  return (
    <div className={mainDivClassName}>
      <motion.button {...motionButtonProps}>
        {iconToShow}
        {textContent}
      </motion.button>
      <input
        id={`file-upload-input-gdrive-${
          isDockIcon
            ? "dock"
            : isMobile
            ? "mobile"
            : isDesktopGrid
            ? "desktop-grid"
            : "desktop-full"
        }`} // Unique ID
        name={`file-upload-input-gdrive-${
          isDockIcon
            ? "dock"
            : isMobile
            ? "mobile"
            : isDesktopGrid
            ? "desktop-grid"
            : "desktop-full"
        }`}
        type="file"
        multiple // Allow multiple file selection
        className="sr-only"
        onChange={handleFileChange}
        ref={fileInputRef}
        disabled={isBatchUploading} // Use batch state
      />

      {!isMobile &&
        !isDesktopGrid &&
        !isDockIcon && ( // Only show progress/messages for default version
          <div className="mt-2.5 w-full text-left space-y-1.5">
            <AnimatePresence mode="popLayout">
              {currentFileError && ( // Use current file error state
                <motion.div
                  key="upload-error"
                  className="p-2.5 rounded-md text-xs font-medium bg-[#F472B6]/10 text-[#F472B6] border border-[#F472B6]/30"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {currentFileError}
                </motion.div>
              )}
              {currentFileSuccessMessage && ( // Use current file success state
                <motion.div
                  key="upload-success"
                  className="p-2.5 rounded-md text-xs font-medium bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/30"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {currentFileSuccessMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {isBatchUploading &&
              processingFile && ( // Show progress if batch uploading and a file is being processed
                <motion.div
                  className="text-left p-2.5 rounded-md bg-[#2C253E] space-y-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-xs text-[#BEAEEF]/90 truncate">
                    Sending: {processingFile.name}{" "}
                    {/* Use processing file name */}
                  </p>
                  <div className="w-full bg-[#4A3F5E]/50 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-[#8B5CF6] to-[#C084FC] h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${currentFileProgress}%` }} // Use current file progress
                      transition={{ duration: 0.2, ease: "linear" }}
                    ></motion.div>
                  </div>
                </motion.div>
              )}
          </div>
        )}
    </div>
  );
}
