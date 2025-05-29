import React from "react";
import { motion } from "motion/react";
import {
  LockClosedIcon,
  PencilSquareIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import FileUpload from "./FileUpload";
import StorageUsage from "./StorageUsage";

export default function Dock({
  currentVault,
  onLogout,
  onUploadSuccess,
  onOpenNewNoteEditor,
  onShowChangePinForm,
  onShowRenameVaultForm,
  localRefreshTrigger,
  globalRefreshTrigger,
}) {
  return (
    <motion.div
      className="fixed z-40 flex items-center p-2 bg-[#1A1625]/70 backdrop-blur-lg shadow-2xl bottom-0 left-0 right-0 justify-around rounded-t-xl border-t border-[#4A3F5E]/30 sm:w-fit sm:bottom-5 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:justify-center sm:gap-2 sm:rounded-xl sm:border sm:border-[#4A3F5E]/30"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 100 }}
      transition={{ ease: [0, 1, 0.5, 1], duration: 1, delay: 1 }}
    >
      <motion.div
        title="Tap or Tap to rename vault"
        onClick={onShowRenameVaultForm}
        className="flex items-center justify-center px-3 h-[44px] rounded-lg text-[#A78BFA] bg-[#2C253E]/50 hover:bg-[#2C253E] active:bg-[#3B3050] transition-colors cursor-pointer text-sm font-medium select-none truncate max-w-[100px]"
        whileTap={{ scale: 0.95 }}
      >
        {currentVault}
      </motion.div>

      <FileUpload
        currentVault={currentVault}
        onUploadSuccess={onUploadSuccess}
        isDockIcon={true}
      />

      <motion.button
        title="Create Note"
        onClick={onOpenNewNoteEditor}
        className="flex items-center justify-center p-3 rounded-lg text-[#BEAEEF] hover:bg-[#2C253E] active:bg-[#3B3050] transition-colors h-[44px] w-[44px]"
        whileTap={{ scale: 0.95 }}
      >
        <PencilSquareIcon className="h-7 w-7" />
      </motion.button>

      <motion.button
        title="Change PIN"
        onClick={onShowChangePinForm}
        className="flex items-center justify-center p-3 rounded-lg text-[#BEAEEF] hover:bg-[#2C253E] active:bg-[#3B3050] transition-colors h-[44px] w-[44px]"
        whileTap={{ scale: 0.95 }}
      >
        <KeyIcon className="h-7 w-7" />
      </motion.button>

      <StorageUsage
        currentVault={currentVault}
        refreshTrigger={localRefreshTrigger}
        globalRefreshTrigger={globalRefreshTrigger}
      />

      <div className="sm:block h-9 w-px bg-[#4A3F5E]/50 mx-1 self-center"></div>

      <motion.button
        title="Lock Vault"
        onClick={onLogout}
        className="flex items-center justify-center p-3 rounded-lg text-[#BEAEEF] hover:bg-[#2C253E] active:bg-[#3B3050] transition-colors h-[44px] w-[44px]"
        whileTap={{ scale: 0.95 }}
      >
        <LockClosedIcon className="h-7 w-7" />
      </motion.button>
    </motion.div>
  );
}
