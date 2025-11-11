import { useEffect } from 'react';

const useKeystrokeSound = () => {
  useEffect(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playSound = () => {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'square';
      oscillator.frequency.value = 160;
      gainNode.gain.value = 0.02;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.08);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.getAttribute('role') === 'textbox';

      if (isEditable && event.key.length === 1) {
        playSound();
      }
    };

    document.addEventListener('keydown', handleKeydown, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeydown, { capture: true } as any);
      audioContext.close();
    };
  }, []);
};

export default useKeystrokeSound;
