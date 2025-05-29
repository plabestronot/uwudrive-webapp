import React, { useState } from "react";
import { motion } from "motion/react";
import FileList from "./FileList";
import Dock from "./Dock";
import NoteEditorModal from "./NoteEditor";
import ChangePinModal from "./ChangePin";
import RenameVaultModal from "./RenameVault";

export default function VaultView({
  currentVault,
  onLogout,
  globalRefreshTrigger,
}) {
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [editingNoteData, setEditingNoteData] = useState(null);
  const [showChangePinForm, setShowChangePinForm] = useState(false);
  const [showRenameVaultForm, setShowRenameVaultForm] = useState(false);

  const handleLocalUploadSuccess = () => {
    setLocalRefreshTrigger((prev) => prev + 1);
  };

  const handleDeleteSuccess = () => {
    // New handler for delete
    setLocalRefreshTrigger((prev) => prev + 1);
  };

  const handleOpenNewNoteEditor = () => {
    setEditingNoteData(null);
    setShowNoteEditor(true);
  };

  const handleOpenEditNoteEditor = (noteData) => {
    setEditingNoteData(noteData);
    setShowNoteEditor(true);
  };
  const handleLogout = () => {
    sessionStorage.removeItem("currentVault");
    onLogout();
  };

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2, ease: "easeInOut" } },
  };

  // Removed unused sidebarItemVariants
  const mainContentVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 90, damping: 16, delay: 0.2 },
    },
  };

  return (
    <motion.div
      className="h-screen flex flex-col bg-[#120E1C] text-[#E8E0FF]"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* The main flex container. Sidebar is removed, main content will take full width initially. Dock will be overlaid. */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {" "}
        {/* Added relative for dock positioning */}
        {/* Main Content - Takes full width now */}
        <motion.main
          className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto bg-[#120E1C]"
          variants={mainContentVariants}
          initial="hidden"
          animate="visible"
        >
          <FileList
            currentVault={currentVault}
            refreshTrigger={localRefreshTrigger} // Pass local trigger
            globalRefreshTrigger={globalRefreshTrigger} // Pass global trigger
            onLogout={handleLogout}
            onEditNote={handleOpenEditNoteEditor}
            onDeleteSuccess={handleDeleteSuccess} // Pass the new handler
            // Pass theme props if FileList is also being restyled
          />

          <NoteEditorModal
            show={showNoteEditor}
            currentVault={currentVault}
            noteToEdit={editingNoteData}
            onClose={() => {
              setShowNoteEditor(false);
              setEditingNoteData(null);
            }}
            onNoteSaved={(wasEdit) => {
              setShowNoteEditor(false);
              setEditingNoteData(null);
              setLocalRefreshTrigger((prev) => prev + 1);
            }}
          />

          <ChangePinModal
            show={showChangePinForm}
            currentVaultName={currentVault}
            onClose={() => setShowChangePinForm(false)}
            onSuccess={() => {
              setShowChangePinForm(false);
              // Optionally, display a global success message or re-authenticate
              // For now, just closing the form.
            }}
          />

          <RenameVaultModal
            show={showRenameVaultForm}
            currentVaultName={currentVault}
            onClose={() => setShowRenameVaultForm(false)}
            onSuccess={(newVaultName) => {
              setShowRenameVaultForm(false);
              // The form itself handles messaging and triggers logout via onRequiresLogout.
            }}
            onRequiresLogout={() => {
              setShowRenameVaultForm(false);
              handleLogout();
            }}
          />
        </motion.main>
        <Dock
          currentVault={currentVault}
          onLogout={handleLogout}
          onUploadSuccess={handleLocalUploadSuccess}
          onOpenNewNoteEditor={handleOpenNewNoteEditor}
          onShowChangePinForm={() => setShowChangePinForm(true)}
          onShowRenameVaultForm={() => setShowRenameVaultForm(true)} // For desktop and mobile click
          localRefreshTrigger={localRefreshTrigger}
          globalRefreshTrigger={globalRefreshTrigger}
        />
      </div>
    </motion.div>
  );
}
