import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  DocumentIcon, // Keep as fallback
  FolderOpenIcon,
  PhotoIcon, // For images
  DocumentTextIcon, // For text files (notes)
  EyeIcon, // For preview button
  PencilIcon as PencilSquareOutlineIcon, // For Edit button (Heroicons v24 outline has PencilIcon, but let's alias to avoid confusion if PencilSquareIcon is used elsewhere)
} from "@heroicons/react/24/outline";
import PreviewModal from "./Preview";
import {
  listFiles,
  getDownloadFileUrl,
  deleteFile,
} from "../services/driveApi";

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function FileList({
  currentVault,
  refreshTrigger, // This is the local one from VaultView
  globalRefreshTrigger, // This is the one from App.jsx
  onLogout,
  onEditNote,
  onDeleteSuccess, // Added new prop
}) {
  // Added onEditNote prop
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingFileName, setDeletingFileName] = useState(null);

  // State for preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // Stores { name, type (derived) }
  const [previewFileContent, setPreviewFileContent] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [editingNoteName, setEditingNoteName] = useState(null); // To show loading on edit button

  const fetchFiles = async (showLoading = true) => {
    if (!currentVault) return;
    if (showLoading) setIsLoading(true);
    setError("");
    try {
      const data = await listFiles(currentVault);
      setFiles(data.files || []);
    } catch (err) {
      setError(err.message || "Failed to load files.");
      if (
        err.message &&
        (err.message.includes("Invalid PIN") ||
          err.message.includes("Unauthorized") ||
          err.message.includes("Invalid vault name"))
      ) {
        if (onLogout) onLogout();
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentVault, refreshTrigger, globalRefreshTrigger]); // Add globalRefreshTrigger to dependency array

  const handleDownload = (fileName) => {
    const url = getDownloadFileUrl(currentVault, fileName);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (fileName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${fileName}"? This action cannot be undone.`
      )
    )
      return;
    setDeletingFileName(fileName);
    setError(""); // Clear main error for this specific action
    try {
      await deleteFile(currentVault, fileName);
      await fetchFiles(false); // Refresh list without full loading spinner
      if (onDeleteSuccess) {
        onDeleteSuccess(); // Call the new prop function
      }
    } catch (err) {
      setError(err.message || `Failed to delete ${fileName}.`);
    } finally {
      setDeletingFileName(null);
    }
  };

  const isPreviewable = (fileName) => {
    return /\.(txt|jpe?g|png|gif|webp|svg)$/i.test(fileName);
  };

  const getFileIcon = (fileName) => {
    const baseClasses = "h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0";
    if (/\.(jpe?g|png|gif|webp|svg)$/i.test(fileName)) {
      return <PhotoIcon className={`${baseClasses} text-[#8B5CF6]`} />; // Vibrant purple for images
    }
    if (/\.txt$/i.test(fileName)) {
      return <DocumentTextIcon className={`${baseClasses} text-[#A78BFA]`} />; // Another vibrant purple/pink for notes
    }
    return <DocumentIcon className={`${baseClasses} text-[#BEAEEF]`} />; // Lighter purple for generic files
  };

  const handlePreview = async (file) => {
    if (!isPreviewable(file.name)) return;

    setPreviewFile(file);
    setShowPreviewModal(true);
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewFileContent(null);

    try {
      const downloadUrl = getDownloadFileUrl(currentVault, file.name);
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        throw new Error(
          errorData.message || `Failed to fetch file: ${response.statusText}`
        );
      }

      if (/\.txt$/i.test(file.name)) {
        const textContent = await response.text();
        setPreviewFileContent(textContent);
      } else if (/\.(jpe?g|png|gif|webp|svg)$/i.test(file.name)) {
        const blobContent = await response.blob();
        setPreviewFileContent(blobContent);
      }
    } catch (err) {
      console.error("Preview error:", err);
      setPreviewError(err.message || "Could not load preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleEditNote = async (file) => {
    if (!/\.txt$/i.test(file.name) || !onEditNote) return;

    setEditingNoteName(file.name); // Show loading state on edit button
    setError(""); // Clear main error for this action
    try {
      const downloadUrl = getDownloadFileUrl(currentVault, file.name);
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        throw new Error(
          errorData.message ||
            `Failed to fetch note content: ${response.statusText}`
        );
      }
      const textContent = await response.text();
      onEditNote({ name: file.name, content: textContent });
    } catch (err) {
      console.error("Edit note error:", err);
      setError(`Failed to load note for editing: ${err.message}`);
    } finally {
      setEditingNoteName(null);
    }
  };

  const listContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };
  const listItemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 110, damping: 16 },
    },
  };

  if (isLoading && files.length === 0) {
    return (
      <motion.div
        className="mt-6 p-8 rounded-xl text-center bg-[#1E192B] shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ArrowPathIcon className="h-10 w-10 animate-spin mx-auto mb-3 text-[#A78BFA]" />
        <p className="text-md text-[#E8E0FF]">Loading files...</p>
      </motion.div>
    );
  }

  const initialLoadError = error && files.length === 0 && !isLoading;
  if (initialLoadError) {
    return (
      <motion.div
        className="mt-6 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between bg-[#F472B6]/10 text-[#F472B6] border border-[#F472B6]/30 shadow-md"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center mb-2 sm:mb-0">
          <ExclamationTriangleIcon className="h-6 w-6 mr-2.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <motion.button
          onClick={() => fetchFiles()}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#C084FC] text-white
                     hover:from-[#7C3AED] hover:to-[#A855F7] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/50
                     disabled:opacity-60 transition-all duration-150 ease-in-out"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isLoading}
        >
          {isLoading ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            "Retry"
          )}
        </motion.button>
      </motion.div>
    );
  }

  if (files.length === 0 && !isLoading) {
    return (
      <motion.div
        className="mt-6 p-10 rounded-xl text-center bg-[#1E192B] shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <FolderOpenIcon className="h-16 w-16 mx-auto mb-4 text-[#BEAEEF]/70" />
        <p className="text-xl font-semibold text-[#E8E0FF] mb-1.5">
          Vault is Empty
        </p>
        <p className="text-sm text-[#BEAEEF]/80">
          Upload some files or create a note to get started.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-[#1E192B] p-4 sm:p-5 rounded-xl shadow-2xl border border-[#4A3F5E]/30"
      variants={listContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex justify-between items-center mb-4 sm:mb-5 pt-1 px-1">
        <h3 className="text-xl sm:text-2xl font-bold text-[#E8E0FF] tracking-tight">
          My Files
        </h3>
        <motion.button
          onClick={() => fetchFiles()}
          className="p-2 rounded-full text-[#BEAEEF] hover:text-[#C084FC] hover:bg-[#4A3F5E]/40 transition-colors duration-150"
          whileHover={{ scale: 1.1, rotate: 45 }}
          whileTap={{ scale: 0.9, rotate: 0 }}
          title="Refresh File List"
          disabled={isLoading || !!deletingFileName}
        >
          <ArrowPathIcon
            className={`h-5 w-5 ${
              (isLoading || !!deletingFileName) && files.length > 0
                ? "animate-spin"
                : ""
            }`}
          />
        </motion.button>
      </div>
      <AnimatePresence>
        {error && !initialLoadError && (
          <motion.div
            key="filelist-action-error"
            className="mb-3 p-3 rounded-lg text-xs flex items-center bg-[#F472B6]/10 text-[#F472B6] border border-[#F472B6]/30"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.ul className="space-y-1.5" variants={listContainerVariants}>
        {files.map((file, index) => (
          <motion.li
            key={file.name}
            className="flex items-center justify-between group p-2.5 sm:p-3 rounded-lg hover:bg-[#2C253E]/70 transition-colors duration-150"
            variants={listItemVariants}
            // Removed whileHover from here as direct style manipulation is not preferred with Tailwind
            // border-b border-[#4A3F5E]/30 last:border-b-0
          >
            <div
              className="flex items-center min-w-0 space-x-3 sm:space-x-3.5 flex-grow cursor-pointer"
              onClick={() =>
                isPreviewable(file.name)
                  ? handlePreview(file)
                  : handleDownload(file.name)
              }
              title={
                isPreviewable(file.name)
                  ? `Preview ${file.name}`
                  : `Download ${file.name}`
              }
            >
              {getFileIcon(file.name)}
              <div className="min-w-0">
                <p className="font-semibold truncate text-sm sm:text-base text-[#E8E0FF] group-hover:text-[#C084FC] transition-colors duration-150">
                  {file.name}
                </p>
                <p className="text-xs sm:text-sm text-[#BEAEEF]/80">
                  {formatBytes(file.size)} &bull;{" "}
                  {new Date(file.uploaded).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center ml-2 space-x-0.5 sm:space-x-1">
              {/\.txt$/i.test(file.name) && onEditNote && (
                <motion.button
                  onClick={() => handleEditNote(file)}
                  className="p-2 rounded-full text-[#BEAEEF] hover:text-[#A78BFA] hover:bg-[#4A3F5E]/30 disabled:opacity-40 transition-all duration-150"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={
                    deletingFileName === file.name ||
                    editingNoteName === file.name
                  }
                  title="Edit note"
                >
                  {editingNoteName === file.name ? (
                    <ArrowPathIcon className="h-4 sm:h-5 w-4 sm:w-5 animate-spin" />
                  ) : (
                    <PencilSquareOutlineIcon className="h-4 sm:h-5 w-4 sm:w-5" />
                  )}
                </motion.button>
              )}
              {isPreviewable(file.name) && (
                <motion.button
                  onClick={() => handlePreview(file)}
                  className="p-2 rounded-full text-[#BEAEEF] hover:text-[#8B5CF6] hover:bg-[#4A3F5E]/30 disabled:opacity-40 transition-all duration-150"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={
                    deletingFileName === file.name ||
                    editingNoteName === file.name
                  }
                  title="Preview file"
                >
                  <EyeIcon className="h-4 sm:h-5 w-4 sm:w-5" />
                </motion.button>
              )}
              <motion.button
                onClick={() => handleDownload(file.name)}
                className="p-2 rounded-full text-[#BEAEEF] hover:text-[#C084FC] hover:bg-[#4A3F5E]/30 disabled:opacity-40 transition-all duration-150"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                disabled={
                  deletingFileName === file.name ||
                  editingNoteName === file.name
                }
                title="Download file"
              >
                <DocumentArrowDownIcon className="h-4 sm:h-5 w-4 sm:w-5" />
              </motion.button>
              <motion.button
                onClick={() => handleDelete(file.name)}
                className="p-2 rounded-full text-[#BEAEEF] hover:text-[#F472B6] hover:bg-[#F472B6]/20 disabled:opacity-40 transition-all duration-150"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                disabled={
                  deletingFileName === file.name ||
                  isLoading ||
                  editingNoteName === file.name
                }
                title="Delete file"
              >
                {deletingFileName === file.name ? (
                  <ArrowPathIcon className="h-4 sm:h-5 w-4 sm:w-5 animate-spin" />
                ) : (
                  <TrashIcon className="h-4 sm:h-5 w-4 sm:w-5" />
                )}
              </motion.button>
            </div>
          </motion.li>
        ))}
      </motion.ul>
      <PreviewModal
        file={previewFile}
        fileContent={previewFileContent}
        isLoading={previewLoading}
        error={previewError}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewFile(null);
          setPreviewFileContent(null);
          setPreviewError("");
        }}
      />
    </motion.div>
  );
}
