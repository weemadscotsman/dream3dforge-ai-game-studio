export class VoiceSystem {
    private static instance: VoiceSystem;
    private synth: SpeechSynthesis;
    private enabled: boolean = true;
    private voice: SpeechSynthesisVoice | null = null;

    private constructor() {
        this.synth = window.speechSynthesis;
        // Try to load voices immediately
        this.loadVoices();
        // Chrome requires onvoiceschanged
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
    }

    public static getInstance(): VoiceSystem {
        if (!VoiceSystem.instance) {
            VoiceSystem.instance = new VoiceSystem();
        }
        return VoiceSystem.instance;
    }

    private loadVoices() {
        const voices = this.synth.getVoices();
        // Prefer a "tech" sounding voice if available, otherwise just the first English one
        this.voice = voices.find(v => v.name.includes('Google US English')) ||
            voices.find(v => v.name.includes('Microsoft Zira')) ||
            voices.find(v => v.lang.startsWith('en')) ||
            null;
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (!enabled) this.synth.cancel();
    }

    public speak(text: string, priority: 'low' | 'high' = 'low') {
        if (!this.enabled) return;

        // If high priority, cancel current speech
        if (priority === 'high') {
            this.synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) utterance.voice = this.voice;

        // Tech-sounding parameters
        utterance.pitch = 1.0;
        utterance.rate = 1.1; // Slightly faster
        utterance.volume = 0.6; // Not too loud

        this.synth.speak(utterance);
    }

    public stop() {
        this.synth.cancel();
    }
}

export const speak = (text: string, priority: 'low' | 'high' = 'low') => {
    VoiceSystem.getInstance().speak(text, priority);
};
