
export const AUDIO_HELPERS = `
/**
 * 8-BIT MUSIC SEQUENCER (Mario-style)
 * Copy-paste this whole block into the audio script.
 */

const NOTE_FREQS = {
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'P': 0 // Pause/Rest
};

class SimpleSequencer {
  constructor(ctx) {
    this.ctx = ctx;
    this.tempo = 120;
    this.tracks = [];
    this.isPlaying = false;
    this.nextNoteTime = 0;
    this.noteIndex = 0;
  }

  playNote(freq, type, duration, time) {
    if (freq <= 0) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    
    // Envelope (Staccato for 8-bit feel)
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration - 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(time);
    osc.stop(time + duration);
  }

  // melody: [['C4', 0.25], ['E4', 0.25]] (Note, Length in beats)
  addTrack(type, melody) {
    this.tracks.push({ type, melody });
  }

  schedule() {
    const lookahead = 0.1;
    const secondsPerBeat = 60.0 / this.tempo;
    
    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      this.tracks.forEach(track => {
        const noteData = track.melody[this.noteIndex % track.melody.length];
        const freq = NOTE_FREQS[noteData[0]] || 0;
        const duration = noteData[1] * secondsPerBeat;
        
        this.playNote(freq, track.type, duration, this.nextNoteTime);
      });
      
      // Advance by the duration of the current step (assuming monophonic unison rhythm for simplicity, 
      // or just taking the first track's rhythm).
      // For simple loops, we usually align everything.
      const stepDuration = this.tracks[0].melody[this.noteIndex % this.tracks[0].melody.length][1] * secondsPerBeat;
      
      this.nextNoteTime += stepDuration;
      this.noteIndex++;
    }
    
    if (this.isPlaying) {
        requestAnimationFrame(() => this.schedule());
    }
  }

  start() {
    this.isPlaying = true;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.schedule();
  }
  
  stop() {
    this.isPlaying = false;
  }
}
`;
