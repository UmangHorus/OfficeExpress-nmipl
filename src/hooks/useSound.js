// hooks/useSound.js
import { useEffect, useRef } from "react";

export const useSound = (soundFile) => {
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio(soundFile);
    audioRef.current.load();

    return () => {
      // Cleanup
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [soundFile]);

  const play = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Rewind to start
      audioRef.current
        .play()
        .catch((e) => console.error("Audio play failed:", e));
    }
  };

  return play;
};
