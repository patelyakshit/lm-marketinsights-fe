import React, { useState, ReactNode } from "react";
import { PromptContext } from "./PromptContextDefinition";

interface PromptContextType {
  initialPrompt: string | null;
  setInitialPrompt: (prompt: string | null) => void;
  clearInitialPrompt: () => void;
  voiceModeRedirect: boolean;
  setVoiceModeRedirect: (enabled: boolean) => void;
  clearVoiceModeRedirect: () => void;
  voiceModeSupported: boolean;
  setVoiceModeSupported: (supported: boolean) => void;
  hasStartedChat: boolean;
  setHasStartedChat: (started: boolean) => void;
}

interface PromptProviderProps {
  children: ReactNode;
}

export const PromptProvider: React.FC<PromptProviderProps> = ({ children }) => {
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [voiceModeRedirect, setVoiceModeRedirect] = useState<boolean>(false);
  const [voiceModeSupported, setVoiceModeSupported] = useState<boolean>(false);
  const [hasStartedChat, setHasStartedChat] = useState<boolean>(false);

  const clearInitialPrompt = () => {
    console.log("Clearing initial prompt");
    setInitialPrompt(null);
  };

  const setInitialPromptWithLog = (prompt: string | null) => {
    console.log("Setting initial prompt:", prompt);
    setInitialPrompt(prompt);
  };

  const clearVoiceModeRedirect = () => {
    console.log("Clearing voice mode redirect");
    setVoiceModeRedirect(false);
  };

  const setVoiceModeRedirectWithLog = (enabled: boolean) => {
    console.log("Setting voice mode redirect:", enabled);
    setVoiceModeRedirect(enabled);
  };

  const setVoiceModeSupportedWithLog = (supported: boolean) => {
    console.log("Setting voice mode supported:", supported);
    setVoiceModeSupported(supported);
  };

  const value: PromptContextType = {
    initialPrompt,
    setInitialPrompt: setInitialPromptWithLog,
    clearInitialPrompt,
    voiceModeRedirect,
    setVoiceModeRedirect: setVoiceModeRedirectWithLog,
    clearVoiceModeRedirect,
    voiceModeSupported,
    setVoiceModeSupported: setVoiceModeSupportedWithLog,
    hasStartedChat,
    setHasStartedChat,
  };

  return (
    <PromptContext.Provider value={value}>{children}</PromptContext.Provider>
  );
};
