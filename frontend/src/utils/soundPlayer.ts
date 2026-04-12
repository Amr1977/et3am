type SoundType = 'new_meal' | 'reserved' | 'delivered' | 'message' | 'cancelled';

const soundUrls: Record<SoundType, string> = {
  new_meal: '/sounds/new_meal.mp3',
  reserved: '/sounds/reserved.mp3',
  delivered: '/sounds/delivered.mp3',
  message: '/sounds/message.mp3',
  cancelled: '/sounds/cancelled.mp3',
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

function playTone(frequency: number, duration: number = 0.3): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (err) {
    console.error('Failed to play tone:', err);
  }
}

function playFallbackTone(soundType: SoundType): void {
  const frequencies: Record<SoundType, number> = {
    new_meal: 880,
    reserved: 660,
    delivered: 550,
    message: 770,
    cancelled: 440,
  };
  playTone(frequencies[soundType], 0.3);
}

export function playSound(soundType: SoundType): void {
  const url = soundUrls[soundType];
  
  const audio = new Audio();
  
  audio.addEventListener('error', () => {
    console.log(`MP3 not found for ${soundType}, using fallback tone`);
    playFallbackTone(soundType);
  });
  
  audio.addEventListener('canplaythrough', () => {
    audio.play().catch(() => {
      playFallbackTone(soundType);
    });
  }, { once: true });
  
  audio.preload = 'auto';
  audio.src = url;
  audio.load();
}

export function preloadSounds(): void {
  Object.values(soundUrls).forEach(url => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
  });
}