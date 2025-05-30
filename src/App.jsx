import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import PinEntry from "./components/PinEntry";
import VaultView from "./components/Vault";
import DragDropUploadModal from "./components/Drag-Drop";
import "./tailwind.css";

export default function App() {
  const [currentVault, setCurrentVault] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isDragDropModalOpen, setIsDragDropModalOpen] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [globalRefreshTrigger, setGlobalRefreshTrigger] = useState(0);

  const handleUploadSuccess = useCallback(() => {
    setGlobalRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let activeVault = localStorage.getItem("currentVault");
    if (activeVault) {
      setCurrentVault(activeVault);
    } else {
      activeVault = sessionStorage.getItem("currentVault");
      if (activeVault) {
        setCurrentVault(activeVault);
      }
    }
    setIsLoadingSession(false);

    const handleWindowDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter((prev) => prev + 1);
      // Only open modal if files are being dragged
      if (e.dataTransfer.types.includes("Files")) {
        if (currentVault) {
          setIsDragDropModalOpen(true);
        }
      }
    };

    const handleWindowDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.types.includes("Files") && currentVault) {
        e.dataTransfer.dropEffect = "copy";
      } else {
        e.dataTransfer.dropEffect = "none";
      }
    };

    const handleWindowDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter((prev) => Math.max(0, prev - 1));
    };

    const handleWindowDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter(0);
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, [currentVault]);

  useEffect(() => {
    if (dragCounter === 0 && isDragDropModalOpen) {
    }
  }, [dragCounter, isDragDropModalOpen]);

  const handleAuthSuccess = (vaultName) => {
    setCurrentVault(vaultName);
  };

  const handleLogout = () => {
    setCurrentVault(null);
    sessionStorage.removeItem("currentVault");
    localStorage.removeItem("currentVault");
    setIsDragDropModalOpen(false);
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#120E1C] text-[#E8E0FF]">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#120E1C] text-[#E8E0FF] min-h-screen overflow-hidden relative">
      <AnimatePresence mode="wait">
        {currentVault ? (
          <motion.div
            className={`${
              isDragDropModalOpen && currentVault
                ? "filter blur-sm brightness-50"
                : ""
            } transition-all duration-300`}
            key="vaultView"
            initial={{ opacity: 0, x: "100vw" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "-100vw" }}
            transition={{
              type: "tween",
              duration: 0.4,
              ease: [0.42, 0, 0.58, 1],
            }}
            style={{
              width: "100%",
              minHeight: "100vh",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <VaultView
              currentVault={currentVault}
              onLogout={handleLogout}
              globalRefreshTrigger={globalRefreshTrigger}
            />
          </motion.div>
        ) : (
          <motion.div
            key="pinEntry"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 50 }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            style={{
              width: "100%",
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PinEntry onAuthSuccess={handleAuthSuccess} />
          </motion.div>
        )}
      </AnimatePresence>
      <DragDropUploadModal
        isOpen={isDragDropModalOpen && !!currentVault}
        onClose={() => {
          setIsDragDropModalOpen(false);
          setDragCounter(0);
        }}
        currentVault={currentVault}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}