import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { LockClosedIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { authenticateVault } from "../services/driveApi";

const PIN_LENGTH = 6;

export default function PinEntry({ onAuthSuccess }) {
  const [pin, setPin] = useState(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // Added state for Remember Me
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, PIN_LENGTH);
  }, []);

  const handleChange = (e, index) => {
    const { value } = e.target;
    if (!/^\d?$/.test(value)) return; // Allow only single digit or empty

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Focus next input if a digit is entered
    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newPin = [...pin];
      if (newPin[index]) {
        newPin[index] = "";
        setPin(newPin);
        // Keep focus on current input after clearing it
      } else if (index > 0) {
        // If current is empty and backspace is pressed, focus previous
        inputRefs.current[index - 1]?.focus();
        newPin[index - 1] = ""; // Also clear the previous one if user intends to re-enter
        setPin(newPin);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text/plain")
      .slice(0, PIN_LENGTH);
    if (/^\d+$/.test(pastedData)) {
      const newPin = Array(PIN_LENGTH).fill("");
      for (let i = 0; i < Math.min(pastedData.length, PIN_LENGTH); i++) {
        newPin[i] = pastedData[i];
      }
      setPin(newPin);
      const lastFilledIndex = Math.min(pastedData.length, PIN_LENGTH) - 1;
      if (lastFilledIndex < PIN_LENGTH - 1 && pastedData.length <= PIN_LENGTH) {
        inputRefs.current[lastFilledIndex + 1]?.focus();
      } else {
        inputRefs.current[lastFilledIndex]?.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const enteredPin = pin.join("");
    if (!/^\d{6}$/.test(enteredPin)) {
      setError("PIN must be a 6-digit number.");
      setIsLoading(false);
      return;
    }
    try {
      const data = await authenticateVault(enteredPin);
      if (data.success && data.vaultName) {
        if (rememberMe) {
          localStorage.setItem("currentVault", data.vaultName);
        } else {
          sessionStorage.setItem("currentVault", data.vaultName);
        }
        onAuthSuccess(data.vaultName);
      } else {
        setError(
          data.error || "Authentication failed. Invalid PIN or server issue."
        );
      }
    } catch (err) {
      setError(
        err.message || "Authentication failed. Please check vault and PIN."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: "circOut" },
    },
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-gradient-to-br from-[#120E1C] to-[#2A203A]">
      <motion.div
        className="w-full max-w-xs sm:max-w-sm p-6 sm:p-8 rounded-2xl shadow-2xl bg-[#1E192B]/80 backdrop-blur-md border border-[#4A3F5E]/50"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <LockClosedIcon
              className="h-14 w-14 sm:h-16 sm:w-16 mb-4 sm:mb-5 text-[#A78BFA]" // Vibrant purple
            />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-[#E8E0FF] tracking-tight">
            Enter PIN
          </h1>
          <p className="text-sm text-[#BEAEEF]">Access your secure vault.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div
              className="flex justify-center space-x-2 sm:space-x-3"
              onPaste={handlePaste}
            >
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="password" // Changed to password to hide input
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={`w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl text-center rounded-lg outline-none transition-all duration-200 ease-in-out bg-[#2C253E] text-[#E8E0FF] placeholder-gray-500
                    border ${error ? "border-[#F472B6]" : "border-[#4A3F5E]"}
                    focus:border-[#A78BFA] focus:ring-2 focus:ring-[#A78BFA]/50 shadow-inner appearance-none`}
                  // Using appearance-none to remove default number input spinners if type="number" was used
                  required
                  disabled={isLoading}
                  autoComplete="one-time-code" // Helps password managers and OTP auto-fill
                />
              ))}
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg text-center bg-[#F472B6]/10 text-[#F472B6] border border-[#F472B6]/30"
            >
              <p className="text-xs font-semibold">{error}</p>
            </motion.div>
          )}

          {/* Remember Me Checkbox */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="flex items-center justify-center space-x-2"
          >
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-[#A78BFA]"
              disabled={isLoading}
            />
            <label
              htmlFor="rememberMe"
              className="text-sm text-[#BEAEEF] select-none"
            >
              Remember Me
            </label>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center px-5 py-3.5 text-md font-semibold rounded-xl shadow-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
                         bg-gradient-to-r from-[#8B5CF6] to-[#C084FC] text-white hover:from-[#7C3AED] hover:to-[#A855F7]
                         focus:ring-4 focus:ring-[#A78BFA]/40 transition-all duration-200 ease-in-out transform active:scale-[0.98]"
              whileHover={{
                scale: 1.02,
                boxShadow: "0px 5px 15px rgba(167, 139, 250, 0.4)",
              }}
              whileTap={{
                scale: 0.98,
                boxShadow: "0px 2px 8px rgba(167, 139, 250, 0.3)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {isLoading ? "Verifying..." : "Unlock Vault"}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
      <footer className="text-center mt-10 text-xs text-[#BEAEEF]/70">
        <p>&copy; {new Date().getFullYear()} UwU Drive by Shahriar Nafis.</p>
      </footer>
    </div>
  );
}
