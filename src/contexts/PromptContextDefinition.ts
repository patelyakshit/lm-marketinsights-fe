import { createContext } from "react";

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

export const PromptContext = createContext<PromptContextType | undefined>(
  undefined,
);
