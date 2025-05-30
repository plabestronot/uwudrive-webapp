import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { changePin } from "../services/driveApi"; // From ChangePinForm

export default function ChangePinModal({
  show,
  currentVaultName, // This is the vaultName for the form
  onClose,
  onSuccess,
}) {
  // State and logic from ChangePinForm.jsx
  const [vaultName, setVaultName] = useState(currentVaultName || ""); // Use prop for initial state
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Effect to update vaultName if currentVaultName prop changes (e.g. if modal is reused for different vaults)
  React.useEffect(() => {
    setVaultName(currentVaultName || "");
  }, [currentVaultName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    if (!vaultName.trim()) {
      setError("Vault name is required.");
      setIsLoading(false);
      return;
    }
    if (!/^\d{6}$/.test(oldPin)) {
      setError("Old PIN must be a 6-digit number.");
      setIsLoading(false);
      return;
    }
    if (!/^\d{6}$/.test(newPin)) {
      setError("New PIN must be a 6-digit number.");
      setIsLoading(false);
      return;
    }
    if (oldPin === newPin) {
      setError("New PIN cannot be the same as the old PIN.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await changePin(vaultName.trim(), oldPin, newPin);
      setMessage(response.message || "PIN changed successfully!");
      setOldPin("");
      setNewPin("");
      // If currentVaultName (original prop) is not provided, it means user might be changing pin for any vault
      // If it is provided, it means they are in a specific vault context, so we don't clear vaultName input
      if (!currentVaultName) {
        // Check against the original prop
        setVaultName("");
      }
      if (onSuccess) {
        onSuccess(vaultName.trim(), newPin); // Prop from VaultView
      }
    } catch (err) {
      setError(err.message || "Failed to change PIN.");
    } finally {
      setIsLoading(false);
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
        onClick={onClose} // Prop for closing modal
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
          className="w-full max-w-md bg-[#1E192B] rounded-xl shadow-2xl border border-[#4A3F5E]/50 overflow-hidden"
        >
          {/* JSX from ChangePinForm.jsx */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-center text-[#E8E0FF]">
              Change Vault PIN{" "}
              {currentVaultName && ( // Display vault name if provided
                <span className="text-indigo-400">for {currentVaultName}</span>
              )}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="vaultName"
                  className="block text-sm font-medium text-[#BEAEEF]"
                >
                  Vault Name
                </label>
                <input
                  type="text"
                  id="vaultName"
                  value={vaultName} // Controlled by state
                  onChange={(e) => setVaultName(e.target.value)}
                  disabled={!!currentVaultName} // Disable if currentVaultName prop is present
                  className="mt-1 block w-full px-3 py-2 bg-[#2C253E] border border-[#4A3F5E] text-[#E8E0FF] rounded-md shadow-sm focus:outline-none focus:ring-[#A78BFA] focus:border-[#A78BFA] sm:text-sm disabled:bg-[#2C253E]/50 disabled:text-gray-400 placeholder-gray-500"
                  placeholder={currentVaultName ? "" : "Enter vault name"}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="oldPin"
                  className="block text-sm font-medium text-[#BEAEEF]"
                >
                  Old PIN (6 digits)
                </label>
                <input
                  type="password"
                  id="oldPin"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  maxLength="6"
                  className="mt-1 block w-full px-3 py-2 bg-[#2C253E] border border-[#4A3F5E] text-[#E8E0FF] rounded-md shadow-sm focus:outline-none focus:ring-[#A78BFA] focus:border-[#A78BFA] sm:text-sm placeholder-gray-500"
                  placeholder="Enter current 6-digit PIN"
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <label
                  htmlFor="newPin"
                  className="block text-sm font-medium text-[#BEAEEF]"
                >
                  New PIN (6 digits)
                </label>
                <input
                  type="password"
                  id="newPin"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  maxLength="6"
                  className="mt-1 block w-full px-3 py-2 bg-[#2C253E] border border-[#4A3F5E] text-[#E8E0FF] rounded-md shadow-sm focus:outline-none focus:ring-[#A78BFA] focus:border-[#A78BFA] sm:text-sm placeholder-gray-500"
                  placeholder="Enter new 6-digit PIN"
                  required
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#1E192B] disabled:bg-indigo-400/50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Changing PIN..." : "Change PIN"}
              </button>
            </form>
            {message && (
              <p className="mt-4 text-sm text-green-400 bg-green-500/10 border border-green-500/30 p-3 rounded-md text-center">
                {message}
              </p>
            )}
            {error && (
              <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-md text-center">
                {error}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
