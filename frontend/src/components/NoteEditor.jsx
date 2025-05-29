import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  DocumentPlusIcon,
  XMarkIcon,
  PencilIcon,
} from "@heroicons/react/24/outline"; // From NoteEditor
import { createNote } from "../services/driveApi"; // From NoteEditor

export default function NoteEditorModal({
  show,
  currentVault,
  noteToEdit,
  onClose,
  onNoteSaved,
}) {
  // State and logic from NoteEditor.jsx
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (
      noteToEdit &&
      noteToEdit.name &&
      typeof noteToEdit.content === "string"
    ) {
      const titleWithoutExtension = noteToEdit.name.replace(/\.txt$/i, "");
      setNoteTitle(titleWithoutExtension);
      setNoteContent(noteToEdit.content);
      setIsEditMode(true);
    } else {
      setNoteTitle("");
      setNoteContent("");
      setIsEditMode(false);
    }
  }, [noteToEdit]);

  const handleSaveNote = async () => {
    const titleToSave = isEditMode ? noteTitle : noteTitle.trim();
    if (!titleToSave) {
      setError("Note title cannot be empty.");
      return;
    }
    if (!isEditMode && !noteContent.trim()) {
      setError("Note content cannot be empty for a new note.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const finalTitleForApi = isEditMode
        ? noteToEdit.name.replace(/\.txt$/i, "")
        : noteTitle.trim();

      await createNote(currentVault, finalTitleForApi, noteContent);

      setIsSaving(false);
      if (!isEditMode) {
        setNoteTitle("");
        setNoteContent("");
      }
      if (onNoteSaved) {
        onNoteSaved(isEditMode);
      }
      if (onClose) { // Close modal after saving
        onClose();
      }
    } catch (err) {
      setIsSaving(false);
      setError(
        err.message ||
          `Failed to ${isEditMode ? "update" : "save"} note. Please try again.`
      );
      console.error(`Failed to ${isEditMode ? "update" : "save"} note:`, err);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-0 z-50 grid place-items-center p-4 bg-[#120E1C]/80 backdrop-blur-sm"
        onClick={onClose} // Close modal on backdrop click
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
          className="w-full max-w-xl bg-[#1E192B] rounded-xl shadow-2xl border border-[#4A3F5E]/50 overflow-hidden"
        >
          {/* JSX from NoteEditor.jsx */}
          <div className="p-5 sm:p-6">
            <div className="flex justify-between items-center mb-5 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#E8E0FF] tracking-tight">
                {isEditMode ? "Edit Note" : "Create New Note"}
              </h2>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-[#BEAEEF] hover:text-[#E8E0FF] hover:bg-[#4A3F5E]/50 transition-colors duration-150"
                  aria-label="Close note editor"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-[#F472B6]/10 text-[#F472B6] border border-[#F472B6]/30">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="noteTitle"
                  className="block text-sm font-medium text-[#BEAEEF]/90 mb-1.5"
                >
                  Note Title{" "}
                  {isEditMode && (
                    <span className="text-xs text-[#BEAEEF]/70">
                      (filename - not editable)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  id="noteTitle"
                  value={noteTitle}
                  onChange={(e) => !isEditMode && setNoteTitle(e.target.value)}
                  placeholder="Enter note title (e.g., Meeting Ideas)"
                  className={`w-full px-3.5 py-2.5 rounded-lg outline-none transition-all duration-200 ease-in-out text-base text-[#E8E0FF] placeholder-[#BEAEEF]/60 border 
                                      ${
                                        isEditMode
                                          ? "bg-[#221D30] cursor-not-allowed text-[#BEAEEF]/70 border-[#3B3050]"
                                          : "bg-[#2C253E] border-[#4A3F5E] focus:border-[#A78BFA] focus:ring-2 focus:ring-[#A78BFA]/50 focus:ring-offset-1 focus:ring-offset-[#1E192B]"
                                      }`}
                  disabled={isSaving || isEditMode}
                  readOnly={isEditMode}
                />
              </div>
              <div>
                <label
                  htmlFor="noteContent"
                  className="block text-sm font-medium text-[#BEAEEF]/90 mb-1.5"
                >
                  Note Content
                </label>
                <textarea
                  id="noteContent"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows="10"
                  placeholder="Type your thoughts, reminders, or brilliant ideas here..."
                  className="w-full px-3.5 py-2.5 rounded-lg outline-none transition-all duration-200 ease-in-out text-base bg-[#2C253E] text-[#E8E0FF] placeholder-[#BEAEEF]/60 border border-[#4A3F5E] focus:border-[#A78BFA] focus:ring-2 focus:ring-[#A78BFA]/50 focus:ring-offset-1 focus:ring-offset-[#1E192B]"
                  disabled={isSaving}
                />
              </div>
              <motion.button
                onClick={handleSaveNote}
                disabled={
                  isSaving ||
                  !noteTitle.trim() ||
                  (!isEditMode && !noteContent.trim())
                }
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold
                                   bg-gradient-to-r from-[#8B5CF6] to-[#C084FC] text-white
                                   hover:from-[#7C3AED] hover:to-[#A855F7]
                                   focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/60 focus:ring-offset-2 focus:ring-offset-[#1E192B]
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   transition-all duration-200 ease-in-out transform active:scale-[0.97] shadow-md hover:shadow-lg"
                whileHover={{
                  scale:
                    isSaving ||
                    !noteTitle.trim() ||
                    (!isEditMode && !noteContent.trim())
                      ? 1
                      : 1.02,
                }}
                whileTap={{
                  scale:
                    isSaving ||
                    !noteTitle.trim() ||
                    (!isEditMode && !noteContent.trim())
                      ? 1
                      : 0.98,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {isSaving ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : isEditMode ? (
                  <PencilIcon className="h-5 w-5 mr-2" />
                ) : (
                  <DocumentPlusIcon className="h-5 w-5 mr-2" />
                )}
                {isSaving
                  ? isEditMode
                    ? "Updating Note..."
                    : "Saving Note..."
                  : isEditMode
                  ? "Update Note"
                  : "Save Note"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
