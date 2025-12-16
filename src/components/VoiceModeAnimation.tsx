import React from "react";
import { motion } from "framer-motion";

interface VoiceModeAnimationProps {
  isListening?: boolean;
  isSpeaking?: boolean;
}

const VoiceModeAnimation: React.FC<VoiceModeAnimationProps> = ({
  isListening = false,
  isSpeaking = false,
}) => {
  const getStatusText = () => {
    if (isSpeaking) return "Sharing your map response...";
    if (isListening) return "Listening for your map query...";
    return "Ready to explore - speak your map query!";
  };

  const getStatusColor = () => {
    if (isSpeaking) return "bg-green-500";
    if (isListening) return "bg-blue-500";
    return "bg-gray-500";
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
      <div className="flex items-center space-x-2 mb-4">
        <motion.div
          className={`w-3 h-3 ${getStatusColor()} rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: 0,
          }}
        />
        <motion.div
          className={`w-3 h-3 ${getStatusColor()} rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: 0.2,
          }}
        />
        <motion.div
          className={`w-3 h-3 ${getStatusColor()} rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: 0.4,
          }}
        />
      </div>
      <motion.div
        className="text-sm text-gray-500 text-center px-4"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        {getStatusText()}
      </motion.div>
    </div>
  );
};

export default VoiceModeAnimation;
