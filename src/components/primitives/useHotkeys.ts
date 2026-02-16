"use client";

import { useHotkeys as useHotkeysHook, Options } from "react-hotkeys-hook";
import { useCallback } from "react";

export function useHotkeys(
  keys: string,
  callback: () => void,
  options?: Options
) {
  const memoizedCallback = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault();
      callback();
    },
    [callback]
  );

  return useHotkeysHook(keys, memoizedCallback, {
    enableOnFormTags: false,
    ...options,
  });
}

// Common keyboard shortcuts
export const SHORTCUTS = {
  // Navigation
  nextPage: "j",
  prevPage: "k",
  firstPage: "g g",
  lastPage: "shift+g",
  toggleSidebar: "h",
  expandSidebar: "l",

  // Command palette
  commandPalette: "mod+k",
  quickOpen: "mod+p",
  showHelp: "mod+/",

  // AI Chat
  focusChat: "mod+j",
  sendMessage: "mod+enter",
  toggleContext: "c",

  // Notes
  newNote: "n",
  saveNote: "mod+s",
  toggleNotes: "mod+shift+n",

  // Reading
  pass1: "1",
  pass2: "2",
  pass3: "3",
  markComplete: "m",
  zenMode: "z",

  // Library
  addPaper: "mod+n",
  search: "/",
};
