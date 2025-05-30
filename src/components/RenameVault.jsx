import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { renameVault } from '../services/driveApi'; // Imported from RenameVaultForm

const VAULT_NAME_REGEX = /^[a-zA-Z0-9_-]{3,50}$/; // From RenameVaultForm

export default function RenameVaultModal({
  show,
  currentVaultName,
  onClose,
  onSuccess,
  onRequiresLogout,
}) {
  // State and logic from RenameVaultForm
  const [newVaultName, setNewVaultName] = useState('');
  const [pin, setPin] = useState(''); // currentPin prop was optional, defaulting to ''
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!currentVaultName) {
        setError('Current vault name is missing. This form cannot be submitted.');
        return;
    }
    if (!newVaultName.trim()) {
        setError('New vault name is required.');
        return;
    }
    if (!VAULT_NAME_REGEX.test(newVaultName.trim())) {
        setError('New vault name is invalid. Use 3-50 alphanumeric characters, underscores, or hyphens.');
        return;
    }
    if (currentVaultName === newVaultName.trim()) {
        setError('New vault name must be different from the current name.');
        return;
    }
    if (!/^\d{6}$/.test(pin)) {
        setError('PIN must be a 6-digit number for verification.');
        return;
    }
    
    setIsLoading(true);
    try {
      const response = await renameVault(currentVaultName, newVaultName.trim(), pin);
      setMessage(response.message || `Vault '${currentVaultName}' renamed to '${newVaultName.trim()}' successfully! You will be logged out.`);
      setNewVaultName('');
      setPin(''); // Clear pin after use

      if (onSuccess) {
        onSuccess(newVaultName.trim()); // This prop is passed from VaultView
      }
      
      setTimeout(() => {
        if (onRequiresLogout) onRequiresLogout(); // This prop is passed from VaultView
      }, 3000); 

    } catch (err) {
      setError(err.message || 'Failed to rename vault.');
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
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#1E192B] rounded-xl shadow-2xl border border-[#4A3F5E]/50 overflow-hidden"
        >
          {/* JSX from RenameVaultForm, adapted slightly for context */}
          <div className="p-6"> 
            <h2 className="text-xl font-semibold mb-6 text-center text-[#E8E0FF]">Rename Vault: <span className="text-orange-400">{currentVaultName}</span></h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="newVaultName" className="block text-sm font-medium text-[#BEAEEF]">
                  New Vault Name
                </label>
                <input
                  type="text"
                  id="newVaultName"
                  value={newVaultName}
                  onChange={(e) => setNewVaultName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-[#2C253E] border border-[#4A3F5E] text-[#E8E0FF] rounded-md shadow-sm focus:outline-none focus:ring-[#A78BFA] focus:border-[#A78BFA] sm:text-sm placeholder-gray-500"
                  placeholder="Enter new vault name"
                  required
                />
              </div>
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-[#BEAEEF]">
                  Current PIN (for verification)
                </label>
                <input
                  type="password"
                  id="pin"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength="6"
                  className="mt-1 block w-full px-3 py-2 bg-[#2C253E] border border-[#4A3F5E] text-[#E8E0FF] rounded-md shadow-sm focus:outline-none focus:ring-[#A78BFA] focus:border-[#A78BFA] sm:text-sm placeholder-gray-500"
                  placeholder="Enter 6-digit PIN"
                  required
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-[#1E192B] disabled:bg-orange-400/50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Renaming Vault...' : 'Rename Vault'}
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
            {message && ( 
              <p className="mt-2 text-sm text-blue-400 text-center">
                You will be logged out of the vault shortly.
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
