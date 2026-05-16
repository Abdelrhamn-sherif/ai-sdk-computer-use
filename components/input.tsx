import { ArrowUp, Square } from "lucide-react";
import { Input as ShadcnInput } from "./ui/input";

interface InputProps {
  input: string;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isInitializing: boolean;
  isLoading: boolean;
  status: string;
  stop: () => void;
}

export const Input = ({
  input,
  handleInputChange,
  isInitializing,
  status,
  stop,
}: InputProps) => {
  const isStreaming = status === "streaming" || status === "submitted";
  const isDisabled = isInitializing;
  const isSubmitDisabled = isStreaming || !input.trim() || isInitializing;

  return (
    <div className="relative w-full">
      <ShadcnInput
        className="bg-secondary py-6 w-full rounded-xl pr-12"
        value={input}
        autoFocus
        placeholder={"Tell me what to do..."}
        onChange={handleInputChange}
        disabled={isDisabled}
      />
      {isStreaming ? (
        <button
          type="button"
          onClick={stop}
          className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors"
          aria-label="Stop generation"
        >
          <Square className="h-4 w-4 text-white fill-white" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 bg-black hover:bg-zinc-800 active:bg-zinc-700 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <ArrowUp className="h-4 w-4 text-white" />
        </button>
      )}
    </div>
  );
};
