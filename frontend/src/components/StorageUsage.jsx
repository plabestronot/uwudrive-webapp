import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { getVaultUsage } from "../services/driveApi";

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function StorageUsage({ currentVault, refreshTrigger }) {
  const [usage, setUsage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchUsage = useCallback(async () => {
    if (!currentVault) return;
    // Only set loading to true if there's no usage data yet (initial load)
    if (!usage) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const data = await getVaultUsage(currentVault);
      setUsage(data);
    } catch (err) {
      console.error("Failed to fetch vault usage:", err);
      setError(err.message || "Could not load storage data.");
    } finally {
      setIsLoading(false);
    }
  }, [currentVault]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center px-3 h-[44px] rounded-lg text-xs text-[#BEAEEF]/70 bg-[#2C253E]/40 animate-pulse">
        Loading storage...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center px-3 h-[44px] rounded-lg text-xs text-red-400 bg-red-900/30 cursor-pointer"
        onClick={fetchUsage}
        title="Error loading storage. Click to retry."
      >
        Error!
      </div>
    );
  }

  if (!usage) return null;

  const percentage =
    usage.limit > 0 ? (usage.currentSize / usage.limit) * 100 : 0;

  return (
    <>
      <motion.div
        title={`Storage: ${formatBytes(usage.currentSize)} / ${formatBytes(
          usage.limit
        )} (${percentage.toFixed(1)}%). Click for details.`}
        onClick={() => setShowModal(true)}
        className="flex items-center justify-center px-3 h-[44px] w-32 sm:w-40 rounded-lg bg-[#2C253E]/50 hover:bg-[#2C253E] transition-colors cursor-pointer select-none"
        whileHover={{ scale: 1.15, y: -6 }}
        whileTap={{ scale: 1.05 }}
      >
        <div className="w-full bg-[#1A1625] rounded-full h-2.5 overflow-hidden">
          <motion.div
            className={`h-2.5 rounded-full ${
              percentage > 85
                ? "bg-red-500"
                : percentage > 60
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
        <InformationCircleIcon className="h-5 w-5 ml-2 text-[#BEAEEF]/70" />
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-[60] grid place-items-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 0 }}
              animate={{ scale: 1, opacity: 1, y: -150 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1E192B] rounded-xl shadow-2xl border border-[#4A3F5E]/50 overflow-hidden p-6 text-[#E8E0FF]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-[#A78BFA]">
                  Storage Overview
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-md hover:bg-[#2C253E] text-[#BEAEEF]"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Used: {formatBytes(usage.currentSize)}</span>
                    <span>Limit: {formatBytes(usage.limit)}</span>
                  </div>
                  <div className="w-full bg-[#120E1C] rounded-full h-4 overflow-hidden border border-[#4A3F5E]/30">
                    <div
                      className={`h-4 rounded-full ${
                        percentage > 85
                          ? "bg-red-600"
                          : percentage > 60
                          ? "bg-yellow-500"
                          : "bg-green-600"
                      } transition-all duration-500 ease-out`}
                      style={{ width: `${percentage}%` }}
                    >
                      <span className="text-xs font-medium text-white/80 pl-2 flex items-center h-full">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#BEAEEF]/80">
                  This vault is using {formatBytes(usage.currentSize)} of the
                  total {formatBytes(usage.limit)} available.
                </p>
                {percentage > 85 && (
                  <p className="text-sm text-red-400">
                    Warning: You are approaching your storage limit. Consider
                    deleting some files.
                  </p>
                )}
                {percentage > 99.9 && (
                  <p className="text-sm text-red-400 font-bold">
                    Storage limit reached! You will not be able to upload new
                    files until space is freed.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
