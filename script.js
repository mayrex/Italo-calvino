/* ==========================================================================
   LOGICA DI GESTIONE: LA VALIGIA DEI MONDI DI CALVINO
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. MOTORE AUDIO GENERATIVO (Web Audio API)
    // ==========================================
    class CalvinoAudioEngine {
        constructor() {
            this.ctx = null;
            this.masterGain = null;
            this.ambientGain = null;

            // Oscillatori e filtri per il pad di sottofondo
            this.padOscs = [];
            this.padGains = [];
            this.padFilter = null;
            this.padLfo = null;

            // Stato e configurazione
            this.isMuted = false;
            this.chordIndex = 0;
            this.chordInterval = null;

            // Frequenze degli accordi caldi (pad d'atmosfera)
            this.chords = [
                [110.00, 164.81, 220.00, 261.63, 329.63], // Am7 (La, Mi, La, Do, Mi)
                [87.31, 130.81, 174.61, 261.63, 349.23],  // Fmaj7 (Fa, Do, Fa, Do, Fa)
                [98.00, 146.83, 196.00, 293.66, 349.23],  // G7 (Sol, Re, Sol, Re, Fa)
                [65.41, 130.81, 196.00, 261.63, 493.88]   // Cmaj7 (Do, Do, Sol, Do, Si)
            ];

            // Risorse audio attive per i mondi
            this.activeWind = null;
            this.activeRustle = null;
        }

        init() {
            if (this.ctx) return;

            // Creazione contesto audio
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            // Master Gain
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.95; // Volume master aumentato
            this.masterGain.connect(this.ctx.destination);

            // Gain per l'ambiente
            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.value = 0.0; // Inizia a zero per un fade-in morbido
            this.ambientGain.connect(this.masterGain);

            // Inizia il pad di sfondo
            this.startAmbientPad();

            // Fade-in dell'ambiente
            this.ambientGain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 3.0);

            // Avvia la progressione di accordi generativi
            this.chordInterval = setInterval(() => {
                this.nextChord();
            }, 7000);
        }

        startAmbientPad() {
            const now = this.ctx.currentTime;

            // Filtro Passa-Basso caldissimo
            this.padFilter = this.ctx.createBiquadFilter();
            this.padFilter.type = "lowpass";
            this.padFilter.frequency.setValueAtTime(320, now);
            this.padFilter.Q.value = 2.0;
            this.padFilter.connect(this.ambientGain);

            // LFO lento sul filtro per dare movimento
            this.padLfo = this.ctx.createOscillator();
            this.padLfo.frequency.value = 0.08; // 0.08Hz
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.value = 80;

            this.padLfo.connect(lfoGain);
            lfoGain.connect(this.padFilter.frequency);
            this.padLfo.start(now);

            // Inizializza gli oscillatori per le 5 note dell'accordo
            const currentChord = this.chords[this.chordIndex];
            for (let i = 0; i < currentChord.length; i++) {
                const osc = this.ctx.createOscillator();
                // Alterniamo triangolo e seno per calore
                osc.type = (i % 2 === 0) ? "triangle" : "sine";
                osc.frequency.value = currentChord[i];

                const gNode = this.ctx.createGain();
                gNode.gain.setValueAtTime(0, now);
                gNode.gain.linearRampToValueAtTime(0.15 / currentChord.length, now + 1.0 + Math.random());

                osc.connect(gNode);
                gNode.connect(this.padFilter);

                osc.start(now);

                this.padOscs.push(osc);
                this.padGains.push(gNode);
            }
        }

        nextChord() {
            if (!this.ctx || this.isMuted) return;

            const now = this.ctx.currentTime;
            this.chordIndex = (this.chordIndex + 1) % this.chords.length;
            const nextFreqs = this.chords[this.chordIndex];

            // Transizione fluida di frequenze per simulare uno scorrimento di note organico
            for (let i = 0; i < this.padOscs.length; i++) {
                if (this.padOscs[i]) {
                    // Sfuma leggermente il volume
                    this.padGains[i].gain.setValueAtTime(this.padGains[i].gain.value, now);
                    this.padGains[i].gain.exponentialRampToValueAtTime(0.005, now + 1.5);

                    // Cambia frequenza con una leggera discrepanza temporale
                    this.padOscs[i].frequency.setValueAtTime(this.padOscs[i].frequency.value, now + 1.5);
                    this.padOscs[i].frequency.exponentialRampToValueAtTime(nextFreqs[i], now + 3.5);

                    // Risveglia il volume
                    this.padGains[i].gain.exponentialRampToValueAtTime(0.15 / this.padOscs.length, now + 4.0);
                }
            }
        }

        toggleMute() {
            if (!this.ctx) return;
            this.isMuted = !this.isMuted;
            const targetVolume = this.isMuted ? 0 : 0.95;
            this.masterGain.gain.linearRampToValueAtTime(targetVolume, this.ctx.currentTime + 0.5);

            // Silenzia/ripristina l'audio del cavaliere se attivo
            if (this.knightAudio) {
                this.knightAudio.volume = this.isMuted ? 0 : 1;
            }

            return this.isMuted;
        }

        // --- EFFETTI SONORI PROCEDURALI ---

        // Vento caldo di pergamena (Sezione 01)
        startWind() {
            if (!this.ctx || this.activeWind) return;
            const now = this.ctx.currentTime;

            const bufferSize = this.ctx.sampleRate * 2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;

            const filter = this.ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.Q.value = 2.5;
            filter.frequency.setValueAtTime(450, now);

            // LFO sul vento
            const windLfo = this.ctx.createOscillator();
            windLfo.frequency.value = 0.15;
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.value = 180;

            windLfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.18, now + 1.5);

            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            windLfo.start(now);
            source.start(now);

            this.activeWind = { source, lfo: windLfo, filter, gain };
        }

        stopWind() {
            if (this.activeWind) {
                const now = this.ctx.currentTime;
                const wind = this.activeWind;
                wind.gain.gain.linearRampToValueAtTime(0, now + 1.0);
                setTimeout(() => {
                    try {
                        wind.source.stop();
                        wind.lfo.stop();
                    } catch (e) { }
                }, 1100);
                this.activeWind = null;
            }
        }

        // Fruscio di foglie e cinguettio (Sezione 02)
        playBranchRustle() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            // 1. Suono di legno/ramo
            const woodOsc = this.ctx.createOscillator();
            const woodGain = this.ctx.createGain();
            woodOsc.type = "triangle";
            woodOsc.frequency.setValueAtTime(140, now);
            woodOsc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

            woodGain.gain.setValueAtTime(0.45, now);
            woodGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

            woodOsc.connect(woodGain);
            woodGain.connect(this.masterGain);
            woodOsc.start(now);
            woodOsc.stop(now + 0.3);

            // 2. Chime metallico leggero (foglia dorata)
            const chimeOsc = this.ctx.createOscillator();
            const chimeGain = this.ctx.createGain();
            chimeOsc.type = "sine";
            chimeOsc.frequency.setValueAtTime(1200, now);
            chimeOsc.frequency.exponentialRampToValueAtTime(800, now + 0.4);

            chimeGain.gain.setValueAtTime(0.12, now);
            chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

            chimeOsc.connect(chimeGain);
            chimeGain.connect(this.masterGain);
            chimeOsc.start(now);
            chimeOsc.stop(now + 0.6);
        }

        // Chimes cosmici FM (Sezione 03)
        playSpaceBell(freq) {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            const carrier = this.ctx.createOscillator();
            const modulator = this.ctx.createOscillator();
            const modGain = this.ctx.createGain();
            const gainNode = this.ctx.createGain();

            carrier.type = "sine";
            modulator.type = "sine";

            carrier.frequency.value = freq;
            modulator.frequency.value = freq * 1.618; // Rapporto aureo per armoniche magiche
            modGain.gain.value = freq * 1.5;

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.015);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

            modulator.connect(modGain);
            modGain.connect(carrier.frequency);
            carrier.connect(gainNode);
            gainNode.connect(this.masterGain);

            modulator.start(now);
            carrier.start(now);

            modulator.stop(now + 2.6);
            carrier.stop(now + 2.6);
        }

        // Suoni per la macchina da scrivere e glitch (Sezione 04)
        playTypewriterClick() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = "triangle";
            osc.frequency.setValueAtTime(800 + Math.random() * 400, now);

            filter.type = "bandpass";
            filter.Q.value = 5.0;
            filter.frequency.value = 1500;

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 0.05);
        }

        playGlitchZap() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(50, now);
            osc.frequency.linearRampToValueAtTime(1600, now + 0.18);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.25, now + 0.035);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.18);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 0.2);
        }

        // Gong di metallo profondo spettrale (Sezione 05)
        playMetalGong() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            osc1.type = "sawtooth";
            osc2.type = "triangle";

            osc1.frequency.setValueAtTime(50, now); // Nota profonda
            osc2.frequency.setValueAtTime(74, now); // Quarta spettrale

            const filter = this.ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.Q.value = 4.0;
            filter.frequency.setValueAtTime(280, now);
            filter.frequency.exponentialRampToValueAtTime(32, now + 3.0);

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.65, now + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.masterGain);

            osc1.start(now);
            osc2.start(now);

            osc1.stop(now + 4.5);
            osc2.stop(now + 4.5);
        }

        // --- SEZIONE 06: DUAL SOUNDS FOR VISCONTE ---
        playVisconteTone(isLight) {
            if (!this.ctx || this.isMuted) return;
            const now = this.ctx.currentTime;

            if (isLight) {
                // Tono cristallino ad alta armonica (Bene)
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(880, now); // A5

                // Leggera modulazione vibrazionale
                const mod = this.ctx.createOscillator();
                const modGain = this.ctx.createGain();
                mod.frequency.value = 8; // 8Hz vibrazione
                modGain.gain.value = 5;
                mod.connect(modGain);
                modGain.connect(osc.frequency);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

                osc.connect(gain);
                gain.connect(this.masterGain);

                mod.start(now);
                osc.start(now);
                mod.stop(now + 1.3);
                osc.stop(now + 1.3);
            } else {
                // Tono cupo e distorto a bassa frequenza (Male)
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = "triangle";
                osc.frequency.setValueAtTime(65.4, now); // C2

                filter.type = "lowpass";
                filter.Q.value = 8.0;
                filter.frequency.setValueAtTime(250, now);
                filter.frequency.exponentialRampToValueAtTime(50, now + 1.5);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.55, now + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);

                osc.start(now);
                osc.stop(now + 2.0);
            }
        }

        playVisconteReunion() {
            if (!this.ctx || this.isMuted) return;
            const now = this.ctx.currentTime;

            // Accordo di quinta dorato (Recomposizione)
            const frequencies = [220, 330, 440, 554.37, 660]; // A3, E4, A4, C#5, E5 (Accordo Maggiore)
            frequencies.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now + idx * 0.15); // Rintocchi arpeggiati

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.15 + 0.5);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(now);
                osc.stop(now + 5.0);
            });
        }

        // --- SEZIONE 07: PROCEDURAL FOREST SOUNDS ---
        startForestBreeze() {
            if (!this.ctx || this.activeWind) return;
            const now = this.ctx.currentTime;

            const bufferSize = this.ctx.sampleRate * 3;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;

            const filter = this.ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.Q.value = 1.8;
            filter.frequency.setValueAtTime(250, now);

            // LFO super lento per simulare folate di brezza forestale
            const breezeLfo = this.ctx.createOscillator();
            breezeLfo.frequency.value = 0.08;
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.value = 80;

            breezeLfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.25, now + 2.0); // Salita morbida

            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            breezeLfo.start(now);
            source.start(now);

            this.activeWind = { source, lfo: breezeLfo, filter, gain };
        }

        stopForestBreeze() {
            this.stopWind(); // Riutilizza il cleanup generico
        }

        playFootstep() {
            if (!this.ctx || this.isMuted) return;
            const now = this.ctx.currentTime;

            // Rumore granulare di legno che si spezza
            for (let i = 0; i < 2; i++) {
                const clickTime = now + i * 0.15; // Due passi rapidi

                const bufferSize = this.ctx.sampleRate * 0.08;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const output = buffer.getChannelData(0);
                for (let j = 0; j < bufferSize; j++) {
                    output[j] = Math.random() * 2 - 1;
                }

                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = "bandpass";
                filter.frequency.setValueAtTime(1000 + Math.random() * 300, clickTime);
                filter.Q.value = 6.0;

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.15, clickTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, clickTime + 0.06);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);

                noise.start(clickTime);
            }
        }

        // --- SEZIONE 08: CONTEMPLATIVE RISING TIMELINE CHORD ---
        playTimelineChime(stageIndex) {
            if (!this.ctx || this.isMuted) return;
            const now = this.ctx.currentTime;

            const scale = [261.63, 293.66, 329.63, 392.00, 440.00]; // C4, D4, E4, G4, A4
            const baseFreq = scale[stageIndex % scale.length];

            const frequencies = [baseFreq, baseFreq * 2];

            frequencies.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(idx === 0 ? 0.22 : 0.08, now + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0 - idx * 0.5);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(now);
                osc.stop(now + 2.1);
            });
        }

        // --- SEZIONE 09: VOCE NARRANTE DEL CAVALIERE (file MP3) ---
        knightAudio = null;

        playKnightVoice(index) {
            // Ferma l'audio precedente se in riproduzione
            this.stopKnightVoice();

            const audio = new Audio(`public/${index}.mp3`);
            audio.volume = this.isMuted ? 0 : 1;
            audio.play().catch(e => console.warn('Knight audio play failed:', e));
            this.knightAudio = audio;
        }

        stopKnightVoice() {
            if (this.knightAudio) {
                this.knightAudio.pause();
                this.knightAudio.currentTime = 0;
                this.knightAudio = null;
            }
        }
    }

    // Istanza dell'audio engine
    const audioEngine = new CalvinoAudioEngine();

    // ============================================================================
    // 2. CONTROLLO APPLICAZIONE E NAVIGAZIONE
    // ==========================================
    const preloader = document.getElementById("preloader");
    const btnEnter = document.getElementById("btn-enter");
    const hubScreen = document.getElementById("hub-screen");
    const btnMute = document.getElementById("btn-mute");
    const iconSoundOn = document.getElementById("icon-sound-on");
    const iconSoundOff = document.getElementById("icon-sound-off");

    // Canvases dei vari mondi
    const suitcaseCanvas = document.getElementById("suitcase-particles");

    // Riferimenti alle animazioni attive
    let activeCanvasLoops = {
        suitcase: null,
        citta: null,
        barone: null,
        cosmiche: null,
        cavaliere: null,
        visconte: null,
        sentiero: null
    };

    // Sblocco Audio ed Ingresso
    btnEnter.addEventListener("click", () => {
        // Avvio Audio
        audioEngine.init();

        // Transizione visiva
        preloader.classList.remove("active");
        hubScreen.classList.add("active");

        // Avvia particelle della valigia
        startSuitcaseParticles();
    });

    // Toggle Mute
    btnMute.addEventListener("click", () => {
        const isMuted = audioEngine.toggleMute();
        if (isMuted) {
            iconSoundOn.style.display = "none";
            iconSoundOff.style.display = "block";
        } else {
            iconSoundOn.style.display = "block";
            iconSoundOff.style.display = "none";
        }
    });

    // Gestione della transizione nei mondi
    const menuItems = document.querySelectorAll(".menu-item, .suitcase-hotspot");
    const worldSections = document.querySelectorAll(".world-section");
    const backButtons = document.querySelectorAll("[data-back]");

    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetId = item.getAttribute("data-target");
            const targetSection = document.getElementById(targetId);

            // Sfuma la valigia
            hubScreen.classList.remove("active");
            // Rendi attivo il mondo
            targetSection.classList.add("active");

            // Pizazz sonori ed avvio loop grafici specifici
            initializeWorldContext(targetId);
        });
    });

    backButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            // Ottieni la sezione corrente
            const currentSection = btn.closest(".world-section");
            currentSection.classList.remove("active");

            // Disattiva gli effetti del mondo corrente
            teardownWorldContext(currentSection.id);

            // Ripristina l'hub
            hubScreen.classList.add("active");
        });
    });

    // Gestore avvio risorse ed effetti specifici
    function initializeWorldContext(worldId) {
        // Mostra citazione cinemagica di transizione prima di entrare
        triggerTransitionQuote(worldId);

        if (worldId === "sec-pensiero") {
            initializePensiero();
        } else if (worldId === "sec-leggerezza") {
            initializeLeggerezza();
        } else if (worldId === "sec-metalettore") {
            initializeMetalettore();
        } else if (worldId === "sec-castello") {
            initializeCastello();
        } else if (worldId === "sec-barone") {
            startTreeLeaves();
        } else if (worldId === "sec-cosmiche") {
            startGalaxyCanvas();
        } else if (worldId === "sec-viaggiatore") {
            // Sezione 4 ha effetti tipografici e glitch all'occorrenza
        } else if (worldId === "sec-cavaliere") {
            startKnightFog();
            // Avvia la voce narrante iniziale con un leggero ritardo post-transizione
            setTimeout(() => {
                audioEngine.playKnightVoice(1);
            }, 2500);
        } else if (worldId === "sec-visconte") {
            initializeVisconteSection();
        } else if (worldId === "sec-sentiero") {
            audioEngine.startForestBreeze();
            startForestCanvas();
            initializeSentieroSection();
        } else if (worldId === "sec-vita") {
            initializeTimelineSection();
        }
    }

    // Gestore spegnimento risorse per ottimizzare CPU e spegnere oscillatori
    function teardownWorldContext(worldId) {
        if (worldId === "sec-pensiero") {
            // none
        } else if (worldId === "sec-barone") {
            cancelAnimationFrame(activeCanvasLoops.barone);
            activeCanvasLoops.barone = null;
        } else if (worldId === "sec-cosmiche") {
            cancelAnimationFrame(activeCanvasLoops.cosmiche);
            activeCanvasLoops.cosmiche = null;
        } else if (worldId === "sec-cavaliere") {
            cancelAnimationFrame(activeCanvasLoops.cavaliere);
            activeCanvasLoops.cavaliere = null;
            resetArmorState(); // Ripristina l'armatura se era dissolta
            audioEngine.stopKnightVoice();
        } else if (worldId === "sec-visconte") {
            resetVisconteState();
        } else if (worldId === "sec-sentiero") {
            audioEngine.stopForestBreeze();
            cancelAnimationFrame(activeCanvasLoops.sentiero);
            activeCanvasLoops.sentiero = null;
            resetSentieroState();
        } else if (worldId === "sec-vita") {
            teardownTimelineSection();
        }
    }


    // ==========================================
    // 3. PARTICELLE DELLA VALIGIA (HUB CENTRALE)
    // ==========================================
    function startSuitcaseParticles() {
        const canvas = suitcaseCanvas;
        const ctx = canvas.getContext("2d");

        function resize() {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        }
        window.addEventListener("resize", resize);
        resize();

        const particles = [];

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Origine delle particelle (dal centro socchiuso della valigia)
            const sourceX = canvas.width * 0.5;
            const sourceY = canvas.height * 0.58;

            // Genera nuove particelle con parsimonia
            if (particles.length < 25 && Math.random() < 0.1) {
                particles.push({
                    x: sourceX + (Math.random() * 260 - 130),
                    y: sourceY,
                    vx: (Math.random() * 0.6 - 0.3),
                    vy: -(Math.random() * 0.8 + 0.3),
                    size: Math.random() * 2.5 + 0.5,
                    alpha: 1,
                    decay: Math.random() * 0.005 + 0.003
                });
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= p.decay;

                if (p.alpha <= 0) {
                    particles.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(197, 160, 89, ${p.alpha * 0.6})`;
                ctx.shadowBlur = 6;
                ctx.shadowColor = "rgba(197, 160, 89, 0.4)";
                ctx.fill();
            }

            activeCanvasLoops.suitcase = requestAnimationFrame(draw);
        }
        draw();
    }


    // ==========================================
    // 4. NUOVE SEZIONI (Sostituzione Città Invisibili)
    // ==========================================

    // SEC-PENSIERO
    const conceptCards = document.querySelectorAll('.concept-card');
    const pensieroMainQuote = document.getElementById('pensiero-main-quote');

    const pensieroQuotes = {
        'esattezza': "«L'esattezza per me vuol dire tre cose: un disegno dell'opera ben definito e calcolato, l'evocazione di immagini visuali nitide e icastiche, e un linguaggio il più preciso possibile. Di fronte a un mondo in cui il linguaggio si sta appestando, la letteratura è l'unico anticorpo.»",
        'molteplicita': "«La molteplicità è il romanzo come grande enciclopedia, come metodo di conoscenza, come rete di connessioni. In una realtà caotica e sfaccettata, il vero romanziere non riduce la complessità, ma la abbraccia, costruendo trame che s'intersecano all'infinito.»",
        'visibilita': "«Pensare per immagini. Ancora prima di cercare le parole, l'immaginazione visiva si attiva. Per me la fiaba e il mito nascono da qui: vedo un'immagine, la metto a fuoco nella mente, e solo dopo cerco la logica narrativa per darle un senso e un ordine.»",
        'rapidita': "«Un racconto è un'operazione sulla durata, un incantesimo che agisce sullo scorrere del tempo. La rapidità dello stile non significa fretta, ma agilità, mobilità, disinvoltura; tutte qualità che si accordano con la scrittura pronta alle digressioni e ai salti.»"
    };

    function initializePensiero() {
        const currentConceptCards = document.querySelectorAll('.concept-card');
        currentConceptCards.forEach(card => {
            // cleanup vecchi event listeners se presenti clonando il nodo
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            newCard.addEventListener('click', () => {
                document.querySelectorAll('.concept-card').forEach(c => c.classList.remove('selected'));
                newCard.classList.add('selected');
                
                if (pensieroMainQuote) {
                    pensieroMainQuote.style.opacity = 0;
                    setTimeout(() => {
                        pensieroMainQuote.innerText = pensieroQuotes[newCard.dataset.concept];
                        pensieroMainQuote.style.opacity = 1;
                        audioEngine.playTypewriterClick();
                    }, 400);
                }
            });
        });
    }

    // SEC-LEGGEREZZA
    const lightSpheres = document.querySelectorAll('.light-sphere');
    const leggerezzaTitle = document.getElementById('leggerezza-title');
    const leggerezzaText = document.getElementById('leggerezza-text');
    
    const leggerezzaData = {
        'planare': { title: "Planare sulle Cose", text: "«Prendete la vita con leggerezza, che leggerezza non è superficialità, ma planare sulle cose dall'alto, non avere macigni sul cuore. È una reazione al peso del mondo: quando l'umanità mi sembra condannata alla pesantezza, volo in un'altra dimensione per trovare la forza di guardarla da una prospettiva nuova.»" },
        'piuma': { title: "La Piuma e il Peso", text: "«La leggerezza per me si associa con la precisione e la determinazione, non con la vaghezza e l'abbandono al caso. Così come la piuma cade seguendo leggi fisiche complesse e tracciando geometrie nell'aria, anche lo stile di uno scrittore deve essere esatto per poter sollevare l'esperienza umana.»" },
        'lunare': { title: "L'Immagine Lunare", text: "«Alla gravità, al peso, alla staticità, ho sempre cercato di opporre l'agilità, il salto, la corsa. La luna è l'emblema di questa leggerezza luminosa e silenziosa. In ogni racconto cerco sempre l'immagine che possa galleggiare in questo spazio vuoto, staccata dai condizionamenti materiali.»" }
    };

    function initializeLeggerezza() {
        const currentLightSpheres = document.querySelectorAll('.light-sphere');
        currentLightSpheres.forEach(sphere => {
            const newSphere = sphere.cloneNode(true);
            sphere.parentNode.replaceChild(newSphere, sphere);
            
            newSphere.addEventListener('click', () => {
                document.querySelectorAll('.light-sphere').forEach(s => s.classList.remove('selected'));
                newSphere.classList.add('selected');
                
                if(leggerezzaTitle && leggerezzaText) {
                    leggerezzaText.style.opacity = 0;
                    setTimeout(() => {
                        leggerezzaTitle.innerText = leggerezzaData[newSphere.dataset.light].title;
                        leggerezzaText.innerText = leggerezzaData[newSphere.dataset.light].text;
                        leggerezzaText.style.opacity = 1;
                        audioEngine.playGlitchZap();
                    }, 400);
                }
            });
        });
    }

    // SEC-METALETTORE
    function initializeMetalettore() {
        const metaBtns = document.querySelectorAll('.meta-btn');
        metaBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', () => {
                if (newBtn.dataset.action === 'lettore') {
                    metaChoice("L'autore sorride. Sapeva che avresti cercato una via d'uscita. Ma il libro è ormai chiuso intorno a te, lettore.");
                } else {
                    metaChoice("Il testo si ripiega su se stesso. Hai rivendicato il ruolo di creatore, ma sei diventato solo un'altra parola nella frase che stai leggendo.");
                }
            });
        });
    }

    function metaChoice(response) {
        const currentMetaPrompt = document.querySelector('.meta-prompt');
        if(currentMetaPrompt) {
            currentMetaPrompt.style.opacity = 0;
            setTimeout(() => {
                currentMetaPrompt.innerHTML = `<p>${response}</p><p class="italic" style="margin-top: 1rem;">«Forse la vera fine della storia è solo l'inizio della tua consapevolezza di essere letto dal libro.»</p>`;
                currentMetaPrompt.style.opacity = 1;
                audioEngine.playTypewriterClick();
            }, 300);
        }
    }

    // SEC-CASTELLO
    const tarotCards = document.querySelectorAll('.tarot-card');
    const destinyTitle = document.getElementById('destiny-title');
    const destinyNarrative = document.getElementById('destiny-text');
    const destinyCombo = document.querySelector('.destiny-combo-status');
    
    let revealedCards = [];

    const tarotMeanings = {
        'matto': "L'inaspettato sconvolge i piani. Un viaggio inizia senza mappa.",
        'torre': "La rovina delle certezze. Le fondamenta crollano per svelare verità nascoste.",
        'luna': "Illusioni e riflessi ingannevoli. La foresta di notte sussurra segreti.",
        'bagatto': "Il potere della creazione. Gli strumenti sono sul tavolo, pronti all'uso.",
        'appeso': "Il sacrificio e l'attesa. Vedere il mondo da una prospettiva rovesciata.",
        'morte': "La trasformazione inevitabile. La fine di un capitolo che nutre il suolo per il prossimo."
    };

    function initializeCastello() {
        revealedCards = [];
        if(destinyTitle) destinyTitle.innerText = "La Taverna Silenziosa";
        if(destinyNarrative) destinyNarrative.innerText = "Siedi al tavolo, viandante. Non puoi usare la voce, ma le carte parleranno per te. Scegli fino a tre carte dal cerchio per comporre il tuo destino incrociato.";
        if(destinyCombo) destinyCombo.innerText = "CARTE RIVELATE: 0/3";

        const currentTarotCards = document.querySelectorAll('.tarot-card');
        currentTarotCards.forEach(card => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            newCard.classList.remove('revealed', 'slot-1', 'slot-2', 'slot-3');
            newCard.addEventListener('click', () => {
                if(newCard.classList.contains('revealed') || revealedCards.length >= 3) return;
                
                newCard.classList.add('revealed');
                const tarot = newCard.dataset.tarot;
                revealedCards.push(tarot);
                
                newCard.classList.add('slot-' + revealedCards.length);
                
                audioEngine.playTypewriterClick(); // Simulate card flip sound
                
                updateDestinyPanel();
            });
        });
    }

    function updateDestinyPanel() {
        if(destinyCombo) destinyCombo.innerText = `CARTE RIVELATE: ${revealedCards.length}/3`;
        
        if(destinyNarrative) {
            destinyNarrative.style.opacity = 0;
            setTimeout(() => {
                if(revealedCards.length === 1) {
                    destinyTitle.innerText = "Il Primo Passo";
                    destinyNarrative.innerText = tarotMeanings[revealedCards[0]];
                } else if(revealedCards.length === 2) {
                    destinyTitle.innerText = "L'Incrocio dei Destini";
                    destinyNarrative.innerText = `${tarotMeanings[revealedCards[0]]} Poi, all'incrocio, la via muta forma: ${tarotMeanings[revealedCards[1]]}`;
                } else if(revealedCards.length === 3) {
                    destinyTitle.innerText = "La Conclusione Inevitabile";
                    destinyNarrative.innerText = `${tarotMeanings[revealedCards[0]]} Poi, all'incrocio, la via muta forma: ${tarotMeanings[revealedCards[1]]} E infine, la trama si compie: ${tarotMeanings[revealedCards[2]]} \n\nQuesta è la storia che hai raccontato senza aprire bocca.`;
                    
                    // Suono conclusivo
                    audioEngine.playTimelineChime(4);
                }
                destinyNarrative.style.opacity = 1;
            }, 300);
        }
    }


    // ==========================================
    // 5. SEZIONE 02: IL BARONE RAMPANTE
    // ==========================================
    const treeLeavesCanvas = document.getElementById("tree-leaves-canvas");
    const treePanel = document.getElementById("tree-panel");
    const treeThemeTitle = document.getElementById("tree-theme-title");
    const treeQuote = document.getElementById("tree-quote");
    const leafCountSpan = document.getElementById("leaf-count");
    const branches = document.querySelectorAll(".tree-branch");

    let collectedThemes = new Set();

    const branchQuotes = {
        liberta: {
            title: "Il Ramo della Libertà",
            text: "«Si rese conto di questo: che le associazioni rendono l'uomo più forte e mettono in risalto le doti delle singole persone, se sono fondate sulla libertà e sul rispetto di se stessi, vivendo un'esistenza sospesa che non scende mai a compromessi.»"
        },
        ribellione: {
            title: "Il Ramo della Ribellione",
            text: "«Fin quando sarò vivo, sarò lassù. Non scenderò mai più da questi rami, perché lassù c'è il mio mondo, e a chi mi chiede perché rispondo che solo distaccandosi dalla terra si può amare veramente chi vi cammina sopra.»"
        },
        indipendenza: {
            title: "Il Ramo dell'Indipendenza",
            text: "«Capì che chi vuole guardare bene la terra deve tenersi alla distanza necessaria. Guardando la vita dall'alto dei pini e degli elmi, Cosimo disegnò una geografia morale ed eremitica, autonoma e indomita.»"
        },
        distanza: {
            title: "La Distanza dalla Società",
            text: "«Cosimo guardava il mondo dall'alto degli alberi, e tutto gli sembrava diverso, eppure così vicino e comprensibile. Non era una fuga dagli uomini, ma una ricerca del modo migliore per stare con loro rimanendo integro.»"
        }
    };

    // Foglie cadenti via Canvas
    function startTreeLeaves() {
        const canvas = treeLeavesCanvas;
        const ctx = canvas.getContext("2d");

        function resize() {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
        window.addEventListener("resize", resize);
        resize();

        const leaves = [];

        // Funzione per generare foglia
        function createLeaf(x, y, burst = false) {
            return {
                x: x || Math.random() * canvas.width,
                y: y || -20,
                vx: Math.random() * 1.5 - 0.75,
                vy: burst ? (Math.random() * 2.0 + 1.5) : (Math.random() * 1.0 + 0.6),
                size: Math.random() * 6 + 4,
                angle: Math.random() * Math.PI,
                spinSpeed: Math.random() * 0.02 - 0.01,
                color: Math.random() > 0.35 ? "#c5a059" : "#8a1c14", // Foglie oro e rosse
                waveAmplitude: Math.random() * 1.5 + 0.5,
                waveSpeed: Math.random() * 0.04 + 0.01,
                counter: Math.random() * 100
            };
        }

        // Inizializza 20 foglie sparse
        for (let i = 0; i < 20; i++) {
            leaves.push(createLeaf(Math.random() * canvas.width, Math.random() * canvas.height));
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Genera nuove foglie lentamente
            if (leaves.length < 35 && Math.random() < 0.03) {
                leaves.push(createLeaf());
            }

            for (let i = leaves.length - 1; i >= 0; i--) {
                const l = leaves[i];
                l.counter += l.waveSpeed;
                l.x += l.vx + Math.sin(l.counter) * l.waveAmplitude * 0.3;
                l.y += l.vy;
                l.angle += l.spinSpeed;

                if (l.y > canvas.height + 20) {
                    leaves.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.translate(l.x, l.y);
                ctx.rotate(l.angle);

                ctx.beginPath();
                // Forma a foglia (doppio arco)
                ctx.moveTo(0, -l.size);
                ctx.quadraticCurveTo(l.size * 0.7, 0, 0, l.size);
                ctx.quadraticCurveTo(-l.size * 0.7, 0, 0, -l.size);
                ctx.fillStyle = l.color;
                ctx.fill();
                ctx.strokeStyle = "rgba(28,26,23,0.15)";
                ctx.stroke();

                ctx.restore();
            }

            activeCanvasLoops.barone = requestAnimationFrame(draw);
        }

        // Salva la funzione di burst sul canvas come proprietà per chiamarla al click
        canvas.burstLeaves = function (startX, startY) {
            for (let i = 0; i < 12; i++) {
                leaves.push(createLeaf(startX, startY, true));
            }
        };

        draw();
    }

    // Interazione Ramo Albero
    branches.forEach(branch => {
        branch.addEventListener("click", () => {
            branches.forEach(b => b.classList.remove("selected"));
            branch.classList.add("selected");

            const themeKey = branch.getAttribute("data-theme");
            const data = branchQuotes[themeKey];

            // Suono
            audioEngine.playBranchRustle();

            // Animazione Foglie che cadono dal ramo
            const rect = branch.getBoundingClientRect();
            const parentRect = treeLeavesCanvas.getBoundingClientRect();
            const clickX = rect.left - parentRect.left + (rect.width / 2);
            const clickY = rect.top - parentRect.top + (rect.height / 2);

            if (treeLeavesCanvas.burstLeaves) {
                treeLeavesCanvas.burstLeaves(clickX, clickY);
            }

            // Aggiorna Pannello
            collectedThemes.add(themeKey);
            leafCountSpan.innerText = collectedThemes.size;

            // Animazione libro e citazione
            treePanel.style.transform = "translateY(10px) rotate(-1deg)";
            setTimeout(() => {
                treeThemeTitle.innerText = data.title;
                treeQuote.innerHTML = data.text;
                treePanel.style.transform = "none";
            }, 250);
        });
    });


    // ==========================================
    // 6. SEZIONE 03: LE COSMICOMICHE
    // ==========================================
    const galaxyCanvas = document.getElementById("galaxy-canvas");
    const galaxyViewport = document.getElementById("galaxy-viewport");
    const cosmicOutput = document.getElementById("cosmic-output");
    const planets = document.querySelectorAll(".celestial-body");

    const cosmicStories = {
        luna: `> TRASMISSIONE DI QWFWQ DA "LA DISTANZA DELLA LUNA":
               "Un tempo, lo sapete bene, la Luna era vicinissima alla Terra. Bastava una scala per salirci, e vi andavamo a raccogliere il latte lunare con grandi cucchiai. Era denso, simile a una ricotta morbidissima, saporito di stagni e di selce. Ma l'orbita si allargò... e chi rimase sulla luna dovette scegliere tra il vuoto del cosmo e il fango del nostro pianeta."`,
        nebulosa: `> REGISTRAZIONE D'ARCHIVIO "TUTTO IN UN PUNTO":
                   "Quando l'universo era interamente occupato da una sola materia densa ed uniforme, eravamo tutti lì, nello stesso punto. Io, la signora Ph(i)Nk0, il signor De Xauxe... non c'era spazio per muoversi né tempo per annoiarsi. Poi qualcuno disse: 'Ragazzi, se avessi un po' di spazio come mi piacerebbe farvi delle tagliatelle!'. E in quel momento iniziò il Big Bang."`,
        luce: `> SEGNALE PRIMORDIALE "GLI ANNI LUCE":
               "Il primo raggio di luce attraversò lo spazio primordiale, e fu come il primo sguardo. Io tracciai un segno nel vuoto per dire 'Io ti ho visto'. Ma la galassia ruota e le distanze si dilatano. La luce che parte oggi racconterà chi eravamo milioni di anni fa a spettatori che ancora non sono nati."`
    };

    // Rendering Galassia a Spirale via Canvas
    function startGalaxyCanvas() {
        const canvas = galaxyCanvas;
        const ctx = canvas.getContext("2d");

        function resize() {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
        window.addEventListener("resize", resize);
        resize();

        const stars = [];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Crea le braccia della galassia
        const numArms = 3;
        for (let i = 0; i < 220; i++) {
            const r = Math.random() * (canvas.width * 0.35);
            const arm = i % numArms;
            const theta = (arm * (2 * Math.PI / numArms)) + (r * 0.008) + (Math.random() * 0.4 - 0.2);
            stars.push({
                r: r,
                theta: theta,
                size: Math.random() * 1.5 + 0.3,
                speed: (Math.random() * 0.002 + 0.0005) / (r * 0.01 + 1), // Più veloci al centro
                alpha: Math.random() * 0.6 + 0.4,
                color: i % 2 === 0 ? "#ede6d9" : "#c5a059"
            });
        }

        // Stelle di sfondo statiche
        const backgroundStars = [];
        for (let i = 0; i < 80; i++) {
            backgroundStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.2 + 0.2,
                alpha: Math.random() * 0.8 + 0.2,
                twinkle: Math.random() * 0.02
            });
        }

        // Parallasse del mouse
        let mouseX = 0, mouseY = 0;
        galaxyViewport.addEventListener("mousemove", (e) => {
            const rect = galaxyViewport.getBoundingClientRect();
            mouseX = (e.clientX - rect.left - (rect.width / 2)) * 0.04;
            mouseY = (e.clientY - rect.top - (rect.height / 2)) * 0.04;
        });

        function draw() {
            ctx.fillStyle = "#0d0c0b";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Disegna stelle di sfondo statiche
            for (let i = 0; i < backgroundStars.length; i++) {
                const bs = backgroundStars[i];
                bs.alpha += bs.twinkle;
                if (bs.alpha <= 0.2 || bs.alpha >= 1) bs.twinkle = -bs.twinkle;

                ctx.beginPath();
                ctx.arc(bs.x - mouseX * 0.3, bs.y - mouseY * 0.3, bs.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(237, 230, 217, ${bs.alpha})`;
                ctx.fill();
            }

            // Disegna galassia rotante
            ctx.save();
            ctx.translate(canvas.width / 2 - mouseX, canvas.height / 2 - mouseY);

            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];
                s.theta += s.speed;

                const x = s.r * Math.cos(s.theta);
                const y = s.r * Math.sin(s.theta);

                ctx.beginPath();
                ctx.arc(x, y, s.size, 0, Math.PI * 2);
                ctx.fillStyle = s.color;
                ctx.shadowBlur = 4;
                ctx.shadowColor = s.color;
                ctx.fill();
            }
            ctx.restore();

            activeCanvasLoops.cosmiche = requestAnimationFrame(draw);
        }
        draw();
    }

    // Interazione con i Pianeti (Emissione Testo Lettera per Lettera)
    let typingTimeout = null;

    planets.forEach(planet => {
        planet.addEventListener("click", () => {
            planets.forEach(p => p.classList.remove("selected"));
            planet.classList.add("selected");

            const key = planet.getAttribute("data-planet");
            const textToType = cosmicStories[key];

            // Suono
            const freqs = { luna: 523.25, nebulosa: 329.63, luce: 783.99 }; // C5, E4, G5
            audioEngine.playSpaceBell(freqs[key]);

            // Effetto rotazione orbitale aumentata temporaneamente
            const sphere = planet.querySelector(".planet-sphere");
            sphere.style.transform = "rotate(360deg) scale(1.15)";
            setTimeout(() => {
                sphere.style.transform = "none";
            }, 1000);

            // Scrittura a macchina sul terminale
            typeTextInTerminal(textToType);
        });
    });

    function typeTextInTerminal(text) {
        if (typingTimeout) clearInterval(typingTimeout);
        cosmicOutput.innerHTML = "";

        let index = 0;
        typingTimeout = setInterval(() => {
            if (index < text.length) {
                cosmicOutput.innerHTML += text[index];
                index++;

                // Suono di battito leggero per ogni carattere (con parsimonia)
                if (index % 4 === 0) {
                    audioEngine.playTypewriterClick();
                }
            } else {
                clearInterval(typingTimeout);
            }
        }, 12);
    }


    // ==========================================
    // 7. SEZIONE 04: SE UNA NOTTE D'INVERNO... (GLITCH BOOK)
    // ==========================================
    const btnNextPage = document.getElementById("btn-next-page");
    const bookElement = document.getElementById("book-element");
    const rightPageContent = document.getElementById("reading-page-content");
    const storyGlitchText = document.getElementById("story-glitch-text");
    const glitchPanelInfo = document.getElementById("glitch-panel-info");
    const actionBox = document.getElementById("book-action-box");
    const choiceButtons = document.querySelectorAll(".choice-btn");

    const bookStates = {
        0: {
            text: "Il romanzo comincia in una stazione ferroviaria, sbuffa una locomotiva, fischia un vapore. Un uomo cammina nella nebbia fitta, stringendo una valigia logora. Sotto il lampione fumoso, aspetta un contatto che non arriva. Sente dei passi... passi che rimbombano lenti sulle lastre di pietra umide...",
            btnText: "Volta la Pagina..."
        },
        1: {
            text: "Ti accorgi che il capoverso successivo ripete esattamente le stesse righe. Sfogli ansioso. La carta sembra invecchiata all'istante, coperta da macchie d'inchiostro fresche. Le parole iniziano a tremare, a scomporsi in simboli grafici privi di nesso geometrico...",
            btnText: "Ricomponi il Foglio..."
        }
    };

    let currentBookState = 0;

    btnNextPage.addEventListener("click", () => {
        audioEngine.playTypewriterClick();

        if (currentBookState === 0) {
            // Primo step: cambia testo normalmente
            currentBookState = 1;
            storyGlitchText.innerHTML = bookStates[1].text;
            btnNextPage.querySelector(".btn-text").innerText = bookStates[1].btnText;
        } else {
            // Secondo step: innesca il grande glitch cinematico
            triggerBookGlitch();
        }
    });

    function triggerBookGlitch() {
        const parentSec = document.getElementById("sec-viaggiatore");

        // Suono glitch
        audioEngine.playGlitchZap();

        // Attiva animazione glitch visiva
        parentSec.classList.add("glitch-active");
        bookElement.style.transform = "skewX(12deg) scale(0.95)";

        // Corrompi il testo in modo casuale
        const originalText = storyGlitchText.innerText;
        storyGlitchText.classList.add("glitch-text-mode");

        let glitchCounter = 0;
        const glitchInterval = setInterval(() => {
            storyGlitchText.innerHTML = corruptText(originalText);
            glitchCounter++;
            if (glitchCounter % 2 === 0) audioEngine.playTypewriterClick();

            if (glitchCounter > 12) {
                clearInterval(glitchInterval);

                // Fai apparire la meta-narrazione
                parentSec.classList.remove("glitch-active");
                bookElement.style.transform = "none";
                storyGlitchText.classList.remove("glitch-text-mode");

                // Sostituisci il testo con la sparizione
                storyGlitchText.innerHTML = `«ATTENZIONE: Il romanzo che stai leggendo si interrompe qui. Le pagine successive sono andate perdute per un errore tipografico della casa editrice o sono state risucchiate dal labirinto di un altro romanzo...»<br><br>
                <strong>Chi sei tu che leggi? Sei il Lettore o la Lettrice? O sei l'autore stesso smarrito nelle sue pagine?</strong>`;

                // Nascondi pulsante gira pagina e mostra scelte
                actionBox.style.display = "none";
                glitchPanelInfo.classList.add("active");

                // Leggero layout shift
                bookElement.style.borderColor = "var(--color-red)";
            }
        }, 120);
    }

    function corruptText(text) {
        const chars = "▓░█▒ ░░/*#@_+=%&";
        let arr = text.split("");
        for (let i = 0; i < arr.length; i++) {
            if (Math.random() < 0.3 && arr[i] !== " ") {
                arr[i] = chars[Math.floor(Math.random() * chars.length)];
            }
        }
        return arr.join("");
    }

    choiceButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const choice = btn.getAttribute("data-choice");
            audioEngine.playTypewriterClick();

            // Ripristina la pagina con una risposta meta-narrativa specifica
            glitchPanelInfo.classList.remove("active");

            let resultText = "";
            if (choice === "reconstruct") {
                resultText = "«Hai deciso di ricostruire la storia a mente. Il viaggiatore nella nebbia ora ha il tuo volto e la valigia racchiude le tue memorie d'infanzia. Non ci sono più confini tra chi scrive e chi legge. Sei entrato definitivamente nel cerchio magico del libro.»";
            } else if (choice === "author") {
                resultText = "«Hai cercato l'editore fantasma, ma gli uffici della casa editrice sono specchi deformanti. L'autore Italo ti osserva da una grata dorata e sussurra che la storia migliore è quella che non si conclude mai.»";
            } else {
                resultText = "«Hai accettato il vuoto delle pagine strappate. In fondo, la letteratura è solo l'arte di tracciare cornici sul silenzio cosmico. Chiudi il volume con sollievo, pronto per ricominciare un altro romanzo.»";
            }

            storyGlitchText.innerHTML = resultText;

            // Rimetti un pulsante di reset
            actionBox.style.display = "block";
            btnNextPage.querySelector(".btn-text").innerText = "Ricomincia il Viaggio";

            currentBookState = 0;
            // Ripristina bordo libro originale
            bookElement.style.borderColor = "#5a483a";

            // Cambia l'evento del click per ripartire
            btnNextPage.onclick = function () {
                storyGlitchText.innerHTML = bookStates[0].text;
                btnNextPage.querySelector(".btn-text").innerText = bookStates[0].btnText;
                btnNextPage.onclick = null; // Rimuovi il trigger temporaneo
            };
        });
    });


    // ==========================================
    // 8. SEZIONE 05: IL CAVALIERE INESISTENTE (EMPTY ARMOR)
    // ==========================================
    const knightFogCanvas = document.getElementById("knight-fog-canvas");
    const armorWrapper = document.getElementById("armor-wrapper");
    const svgArmor = document.getElementById("svg-armor-element");
    const armorContainer = document.getElementById("armor-container");
    const knightOutputText = document.getElementById("knight-output-text");

    let isArmorDissolved = false;

    // Nebbia fitta via Canvas
    function startKnightFog() {
        const canvas = knightFogCanvas;
        const ctx = canvas.getContext("2d");

        function resize() {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
        window.addEventListener("resize", resize);
        resize();

        // Creazione banchi di nebbia volumetrici
        const fogBanks = [];
        for (let i = 0; i < 8; i++) {
            fogBanks.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: Math.random() * 0.25 + 0.1,
                r: Math.random() * 150 + 100,
                alpha: Math.random() * 0.08 + 0.04
            });
        }

        // Particelle metalliche dell'armatura
        let particles = [];

        function draw() {
            ctx.fillStyle = "#0c0b0a";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 1. RENDERIZZA NEBBIA DI SFONDO
            for (let i = 0; i < fogBanks.length; i++) {
                const f = fogBanks[i];
                f.x += f.vx;
                if (f.x - f.r > canvas.width) {
                    f.x = -f.r;
                }

                const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
                grad.addColorStop(0, `rgba(237, 230, 217, ${f.alpha})`);
                grad.addColorStop(1, "transparent");

                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();
            }

            // 2. RENDERIZZA PARTICELLE DISSOLUZIONE SE ATTIVE
            if (isArmorDissolved && particles.length > 0) {
                const now = Date.now();
                for (let i = 0; i < particles.length; i++) {
                    const p = particles[i];

                    // Movimento spiraleggiante verso l'alto (tornado esistenziale)
                    p.angle += p.orbitSpeed;
                    p.radius += p.vx;
                    p.y += p.vy;

                    // Applica turbolenza
                    p.x = p.centerX + Math.cos(p.angle) * p.radius;

                    // Fade out nel tempo
                    p.alpha -= 0.003;

                    // Riforma o tieni nel canvas
                    if (p.alpha <= 0) {
                        p.alpha = Math.random() * 0.8 + 0.2;
                        p.y = p.originY + (Math.random() * 50 - 25);
                        p.radius = Math.random() * 20;
                    }

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(197, 160, 89, ${p.alpha})`;
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = "rgba(197, 160, 89, 0.6)";
                    ctx.fill();
                }
            }

            activeCanvasLoops.cavaliere = requestAnimationFrame(draw);
        }

        // Salva la possibilità di generare particelle dell'armatura
        canvas.spawnArmorSwarm = function (cx, cy) {
            particles = [];
            for (let i = 0; i < 180; i++) {
                // Spargimento iniziale corrispondente all'area dell'armatura
                const pY = cy - 200 + (Math.random() * 400);
                const pX = cx - 80 + (Math.random() * 160);

                particles.push({
                    x: pX,
                    y: pY,
                    centerX: cx,
                    originY: pY,
                    radius: Math.abs(pX - cx),
                    angle: Math.atan2(pY - cy, pX - cx),
                    orbitSpeed: Math.random() * 0.03 + 0.015,
                    vx: Math.random() * 0.6 - 0.2, // Raggio espansione
                    vy: -(Math.random() * 1.5 + 0.5), // Salita verticale
                    size: Math.random() * 2.2 + 0.8,
                    alpha: Math.random() * 0.8 + 0.2
                });
            }
        };

        canvas.clearArmorSwarm = function () {
            particles = [];
        };

        draw();
    }

    // Effetto di Dissoluzione dell'Armatura
    const armorPaths = document.querySelectorAll(".armor-path");
    const existentialQuotes = [
        "«Io non esisto, diceva Agilulfo. Io esisto solo attraverso la forza di volontà e l'adempimento rigoroso del mio dovere... Se vacillassi, la mia corazza risulterebbe vuota come un elmo abbandonato sul campo.»",
        "«Com'è triste essere un uomo che non c'è, ma che deve compiere imprese eroiche senza corpo, senza labbra per baciare, senza occhi per piangere nella notte gelida delle Fiandre.»",
        "«L'esistere è un mestiere difficile, soprattutto quando si è fatti solo di ferro lucido, vento freddo e intenzione purissima.»"
    ];
    let quoteIndex = 0;

    armorContainer.addEventListener("click", () => {
        if (isArmorDissolved) return; // Impedisci click ripetuti durante l'animazione

        isArmorDissolved = true;

        // Suono Gong Metallico
        audioEngine.playMetalGong();

        // Applica classe Dissolved sui tracciati SVG (si assottigliano e svaniscono)
        armorPaths.forEach(path => {
            path.classList.add("dissolved");
        });

        // Spawna sciame particellare al centro dell'armatura
        const rect = svgArmor.getBoundingClientRect();
        const parentRect = knightFogCanvas.getBoundingClientRect();
        const centerX = rect.left - parentRect.left + (rect.width / 2);
        const centerY = rect.top - parentRect.top + (rect.height / 2);

        if (knightFogCanvas.spawnArmorSwarm) {
            knightFogCanvas.spawnArmorSwarm(centerX, centerY);
        }

        // Cambia frase esistenziale
        quoteIndex = (quoteIndex + 1) % existentialQuotes.length;
        knightOutputText.style.opacity = 0;
        knightOutputText.style.transform = "scale(0.95)";

        setTimeout(() => {
            const nextQuote = existentialQuotes[quoteIndex];
            knightOutputText.innerHTML = nextQuote + `<br><br><span class="action-hint">[ La volontà si disgrega nel vento... Attendiamo che il ferro si ricomponga ]</span>`;
            knightOutputText.style.opacity = 1;
            knightOutputText.style.transform = "none";

            // Avvia la voce narrante per la nuova citazione (audio 2, 3, 4 ciclicamente)
            const knightAudioIndex = (quoteIndex % 3) + 2; // quoteIndex 0->2, 1->3, 2->4
            audioEngine.playKnightVoice(knightAudioIndex);
        }, 600);

        // Dopo 5 secondi ricompone l'armatura
        setTimeout(() => {
            resetArmorState();
        }, 5500);
    });

    function resetArmorState() {
        isArmorDissolved = false;

        // Cancella particelle
        if (knightFogCanvas.clearArmorSwarm) {
            knightFogCanvas.clearArmorSwarm();
        }

        // Ripristina l'SVG
        armorPaths.forEach(path => {
            path.classList.remove("dissolved");
        });

        // Ripristina indicazione originale
        knightOutputText.style.opacity = 0;
        setTimeout(() => {
            knightOutputText.innerHTML = `«Io non esisto, signora. Esisto solo perché la forza della mia volontà sostiene questa armatura. Se perdessi la fede nel mio dovere, svanirei nel nulla.»<br><br>
            <span class="action-hint">[ Clicca sull'armatura per dissolvere la sua presenza di ferro ]</span>`;
            knightOutputText.style.opacity = 1;
        }, 400);
    }

    // ==========================================
    // 9. SEZIONE 06: IL VISCONTE DIMEZZATO
    // ==========================================
    let visconteLeftClicked = false;
    let visconteRightClicked = false;
    let visconteRecomposed = false;

    const visconteQuotes = {
        left: {
            title: "Il Gramo — La Metà Malvagia",
            text: "«O Medardo, saresti felice se ogni cosa intera fosse dimezzata, così che ognuno potesse uscire dalla sua ottusa e ignorante integrità... Io ero intero e ogni cosa per me era confusa... ma il dimezzamento ti rende partecipe del dolore del mondo. Clicca sulla metà destra per tentare la ricomposizione.»"
        },
        right: {
            title: "Il Buono — La Metà Benevola",
            text: "«Ci si incontra per metà, ci si ama per metà, si fa del bene con una mano sola. Ma forse solo essendo dimezzati si capisce la vera natura del mondo, la mutilazione di ogni essere, e si impara la vera compassione. Clicca sulla metà sinistra per tentare la ricomposizione.»"
        },
        recomposed: {
            title: "L'Incompletezza Umana",
            text: "«Così Medardo ritornò uomo intero, né cattivo né buono, un miscuglio di malvagità e bontà... Ma forse avevamo sperato che l'esperienza del dimezzamento avrebbe reso il mondo migliore. Invece, capimmo che l'uomo intero è comunque destinato a camminare tra bene e male, portando per sempre con sé la nostalgia della propria completezza perduta.»"
        }
    };

    function initializeVisconteSection() {
        const halfLeft = document.getElementById("half-left");
        const halfRight = document.getElementById("half-right");
        const visconteTitle = document.getElementById("visconte-title");
        const visconteQuote = document.getElementById("visconte-quote");
        const visconteCount = document.getElementById("visconte-count");

        visconteLeftClicked = false;
        visconteRightClicked = false;
        visconteRecomposed = false;

        // Rimuovi eventuali classi residue
        halfLeft.classList.remove("selected");
        halfRight.classList.remove("selected");
        document.getElementById("fracture-line").classList.remove("glowing");
        document.getElementById("visconte-character").style.transform = "none";
        halfLeft.style.transform = "none";
        halfRight.style.transform = "none";

        const seal = document.getElementById("seal-visconte");
        if (seal) seal.classList.remove("spin");

        visconteTitle.innerText = "La Mutilazione dell'Anima";
        visconteQuote.innerHTML = `Medardo di Terralba fu diviso in due parti da una palla di cannone durante la guerra contro i turchi. Le due metà sopravvissero separatamente: una incarnò la malvagità pura, l'altra la bontà assoluta. Ognuna reclama la sua verità.<br><br>
        <span class="instruction-text">[ Clicca sulle due metà del visconte per esplorare le loro nature opposte ]</span>`;
        visconteCount.innerText = "0";

        halfLeft.onclick = () => {
            if (visconteRecomposed) return;
            visconteLeftClicked = true;
            halfLeft.classList.add("selected");
            audioEngine.playVisconteTone(false); // shadow

            visconteTitle.innerText = visconteQuotes.left.title;
            visconteQuote.innerHTML = visconteQuotes.left.text;
            updateVisconteProgress();
        };

        halfRight.onclick = () => {
            if (visconteRecomposed) return;
            visconteRightClicked = true;
            halfRight.classList.add("selected");
            audioEngine.playVisconteTone(true); // light

            visconteTitle.innerText = visconteQuotes.right.title;
            visconteQuote.innerHTML = visconteQuotes.right.text;
            updateVisconteProgress();
        };
    }

    function updateVisconteProgress() {
        const count = (visconteLeftClicked ? 1 : 0) + (visconteRightClicked ? 1 : 0);
        document.getElementById("visconte-count").innerText = count;

        if (visconteLeftClicked && visconteRightClicked && !visconteRecomposed) {
            triggerVisconteRecomposition();
        }
    }

    function triggerVisconteRecomposition() {
        visconteRecomposed = true;

        const fracture = document.getElementById("fracture-line");
        const halfLeft = document.getElementById("half-left");
        const halfRight = document.getElementById("half-right");
        const visconteTitle = document.getElementById("visconte-title");
        const visconteQuote = document.getElementById("visconte-quote");
        const seal = document.getElementById("seal-visconte");

        // Ritardo sonoro ed effetti
        setTimeout(() => {
            audioEngine.playVisconteReunion();
            if (fracture) fracture.classList.add("glowing");
            if (seal) seal.classList.add("spin");

            // Slide together animation
            halfLeft.style.transform = "translateX(50px)";
            halfRight.style.transform = "translateX(-50px)";

            setTimeout(() => {
                // Riorganizza pannello
                visconteTitle.innerText = visconteQuotes.recomposed.title;
                visconteQuote.innerHTML = visconteQuotes.recomposed.text;
                document.getElementById("visconte-status").innerHTML = "STATO: RICOMPOSTO NELLA MOLTEPLICITÀ";
            }, 1000);
        }, 500);
    }

    function resetVisconteState() {
        const halfLeft = document.getElementById("half-left");
        const halfRight = document.getElementById("half-right");
        if (halfLeft) halfLeft.onclick = null;
        if (halfRight) halfRight.onclick = null;
    }


    // ==========================================
    // 10. SEZIONE 07: IL SENTIERO DEI NIDI DI RAGNO
    // ==========================================
    const forestQuotes = {
        pistola: {
            title: "La Pistola P.38 di Pin",
            text: "«La grossa P.38 è fredda, pesante, lucida. Per Pin rappresenta l'ingresso magico nel mondo degli adulti, un talismano d'acciaio che incute timore e rispetto. Ma gli adulti sono creature incomprensibili, che fanno la guerra per ragioni oscure e lasciano i bambini soli con le loro armi giocattolo.»"
        },
        nido: {
            title: "I Nidi di Ragno Sotto Terra",
            text: "«È l'unico segreto di Pin: un sentiero nascosto nei fossi dove i ragni fanno gallerie d'erba e terra. Lì, in quel piccolo rifugio invisibile agli occhi degli adulti, Pin può nascondere le cose preziose e sognare una complicità pura che il mondo della guerra gli nega continuamente.»"
        },
        fazzoletto: {
            title: "Il Fazzoletto Rosso del Partigiano",
            text: "«Un pezzo di stoffa rossa legato al collo, che profuma di fumo, neve e giovinezza ribelle. I partigiani passano veloci tra i sentieri liguri, cantando canzoni tristi. Combattono per la libertà, eppure ognuno porta dentro una solitudine antica, un segreto dolore di uomo diviso dalla propria casa.»"
        },
        ciliegie: {
            title: "Le Ciliegie Selvatiche",
            text: "«Pin ricorda le ciliegie rubate nei giardini e il sapore aspro dell'infanzia prima della guerra. Nei vicoli di Sanremo, tra osterie e marinai, Pin cerca l'affetto di una sorella distratta e la stima dei compagni, ma trova solo risate di scherno che lo costringono a fuggire nel bosco solitario.»"
        }
    };

    let forestDiscovered = new Set();

    function initializeSentieroSection() {
        const hotspots = document.querySelectorAll(".forest-hotspot");
        const forestTitle = document.getElementById("forest-item-title");
        const forestQuote = document.getElementById("forest-quote");
        const forestCount = document.getElementById("forest-count");

        forestDiscovered.clear();
        if (forestCount) forestCount.innerText = "0";

        if (forestTitle) forestTitle.innerText = "Il Bosco della Resistenza";
        if (forestQuote) forestQuote.innerHTML = `«Forse non c'è altro sentiero oltre a quello in cui camminiamo, e il segreto dei ragni che fanno il nido sotto terra rimarrà custodito per sempre nell'ombra protettiva dei castagni.»<br><br>
        <span class="instruction-text">[ Clicca sugli oggetti nascosti tra le ombre e le fronde del bosco per esplorare i ricordi di Pin ]</span>`;

        hotspots.forEach(hotspot => {
            hotspot.classList.remove("selected");
            hotspot.onclick = (e) => {
                e.stopPropagation();
                hotspots.forEach(h => h.classList.remove("selected"));
                hotspot.classList.add("selected");

                const itemKey = hotspot.getAttribute("data-item");
                const data = forestQuotes[itemKey];

                audioEngine.playFootstep(); // suono del passo

                forestDiscovered.add(itemKey);
                if (forestCount) forestCount.innerText = forestDiscovered.size;

                if (forestTitle) forestTitle.innerText = data.title;
                if (forestQuote) forestQuote.innerHTML = data.text;
            };
        });
    }

    function resetSentieroState() {
        const hotspots = document.querySelectorAll(".forest-hotspot");
        hotspots.forEach(h => h.onclick = null);
    }

    // Canvas Foresta (Lucciole e brezza geometrica)
    function startForestCanvas() {
        const canvas = document.getElementById("spider-forest-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        function resize() {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
        window.addEventListener("resize", resize);
        resize();

        const fireflies = [];
        for (let i = 0; i < 20; i++) {
            fireflies.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: Math.random() * 0.5 - 0.25,
                vy: Math.random() * 0.4 - 0.2,
                r: Math.random() * 2 + 1,
                alpha: Math.random() * 0.7 + 0.3,
                pulseSpeed: Math.random() * 0.03 + 0.01,
                counter: Math.random() * 100
            });
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Disegna lucciole
            for (let i = 0; i < fireflies.length; i++) {
                const f = fireflies[i];
                f.counter += f.pulseSpeed;
                f.x += f.vx + Math.sin(f.counter) * 0.1;
                f.y += f.vy;

                // Repos
                if (f.x < 0) f.x = canvas.width;
                if (f.x > canvas.width) f.x = 0;
                if (f.y < 0) f.y = canvas.height;
                if (f.y > canvas.height) f.y = 0;

                const alpha = Math.abs(Math.sin(f.counter)) * f.alpha;

                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(197, 160, 89, ${alpha})`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = "rgba(197, 160, 89, 0.8)";
                ctx.fill();
                ctx.shadowBlur = 0; // reset
            }

            activeCanvasLoops.sentiero = requestAnimationFrame(draw);
        }
        draw();
    }


    // ==========================================
    // 11. SEZIONE 08: VITA E PENSIERO DI CALVINO
    // ==========================================
    let timelineObserver = null;
    let exploredNodes = new Set();

    const timelineConnections = {
        cuba: "CONNESSO CON: <strong>Il Barone Rampante</strong> (La rigogliosa vegetazione caraibica de L'Avana e la sua fusione con la passione botanica d'infanzia).",
        sanremo: "CONNESSO CON: <strong>Il Sentiero dei Nidi di Ragno</strong> (I sentieri del bosco ligure, le fitte alture di Sanremo e l'impegno partigiano in guerra).",
        torino: "CONNESSO CON: <strong>Il Cavaliere Inesistente</strong> (Il rigore del lavoro editoriale einaudiano a Torino e la precisione geometrica dei nostri antenati).",
        parigi: "CONNESSO CON: <strong>Se una Notte d'Inverno un Viaggiatore</strong> e <strong>Le Città Invisibili</strong> (La passione combinatoria oulipiana a Parigi e la moltiplicazione geometrica).",
        siena: "CONNESSO CON: <strong>Le Cosmicomiche</strong> (La piuma della Leggerezza delle sue lezioni e lo sguardo astronomico rivolto all'universo intero)."
    };

    function initializeTimelineSection() {
        const viewport = document.getElementById("timeline-viewport");
        const nodes = document.querySelectorAll(".timeline-node");
        const nodesCount = document.getElementById("nodes-count");
        const mapConnMsg = document.getElementById("map-conn-msg");

        exploredNodes.clear();
        if (nodesCount) nodesCount.innerText = "0";
        if (mapConnMsg) mapConnMsg.innerHTML = "SCORRI IL DOSSIER PER TRACCIARE LE OPERE CONNESSE...";

        // Pulisci visibilità
        nodes.forEach(n => n.classList.remove("visible"));

        // Configura IntersectionObserver per apparizione nodes cinematici
        const observerOptions = {
            root: viewport,
            threshold: 0.25
        };

        timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const node = entry.target;
                    if (!node.classList.contains("visible")) {
                        node.classList.add("visible");

                        const stageIdx = parseInt(node.getAttribute("data-node"));
                        audioEngine.playTimelineChime(stageIdx); // Suono procedurale timeline

                        // Aggiungi a esplorati
                        const nodeKey = node.id.replace("node-", "");
                        exploredNodes.add(nodeKey);
                        if (nodesCount) nodesCount.innerText = exploredNodes.size;

                        // Modifica messaggio connessione
                        if (mapConnMsg) {
                            mapConnMsg.style.opacity = 0;
                            setTimeout(() => {
                                mapConnMsg.innerHTML = timelineConnections[nodeKey] || "";
                                mapConnMsg.style.opacity = 1;
                            }, 200);
                        }
                    }
                }
            });
        }, observerOptions);

        nodes.forEach(n => timelineObserver.observe(n));
    }

    function teardownTimelineSection() {
        if (timelineObserver) {
            timelineObserver.disconnect();
            timelineObserver = null;
        }
    }


    // ==========================================
    // 12. DYNAMIC TRANSITIONS & EASTER EGGS
    // ==========================================
    const transitionQuotes = {
        "sec-pensiero": "«Il mondo è un vocabolario sterminato dal quale estrarre combinazioni infinite.»",
        "sec-neorealismo": "«Non c'era altro modo di scrivere se non quello di farsi voce di ciò che avevamo vissuto.»",
        "sec-leggerezza": "«Prendete la vita con leggerezza, che leggerezza non è superficialità.»",
        "sec-metalettore": "«Stai per cominciare a leggere il nuovo romanzo. Rilassati. Raccogliti.»",
        "sec-castello": "«Le carte si mescolano, i destini s'incrociano nel silenzio della locanda.»",
        "sec-barone": "«Chi vuole guardare bene la terra deve tenersi alla distanza necessaria.» — Il barone rampante",
        "sec-cosmiche": "«Tutto quello che posso fare è calcolare il tempo che occorrerà perché la mia voce arrivi...» — Le cosmicomiche",
        "sec-viaggiatore": "«Stai per cominciare a leggere il nuovo romanzo di Italo Calvino...» — Se una notte d'inverno un viaggiatore",
        "sec-cavaliere": "«L'arte di abitare l'assenza, sorretta unicamente dalla volontà di esistere.» — Il cavaliere inesistente",
        "sec-visconte": "«Ogni cosa intera è dimezzata, sognante d'essere ricomposta nel dolore dell'altro.» — Il visconte dimezzato",
        "sec-sentiero": "«Forse non c'è altro sentiero, e il segreto dei ragni è la sola complicità concessa.» — Il sentiero dei nidi di ragno",
        "sec-vita": "«La letteratura è la ricerca del labirinto, la piuma della leggerezza che abita il cosmo.» — Italo Calvino"
    };

    function triggerTransitionQuote(worldId) {
        const quote = transitionQuotes[worldId];
        if (!quote) return;

        // Creiamo un elemento ticker sovrapposto temporaneo per transizione cinematografica
        const overlay = document.createElement("div");
        overlay.className = "cinematic-quote-transition";
        overlay.innerHTML = `<div class="quote-transition-text">${quote}</div>`;
        document.body.appendChild(overlay);

        // Fade out e distruzione dopo 2.5 secondi
        setTimeout(() => {
            overlay.classList.add("fade-out");
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 1000);
        }, 2200);
    }

    // Tasto Easter egg del Registro n° 1923-1985
    let registerClicks = 0;
    const registryBtn = document.querySelector(".registry-number");
    if (registryBtn) {
        registryBtn.style.cursor = "pointer";
        registryBtn.addEventListener("click", () => {
            registerClicks++;
            audioEngine.playTypewriterClick();

            if (registerClicks === 3) {
                registerClicks = 0;
                audioEngine.playGlitchZap();

                // Crea un overlay macchina da scrivere segreto
                const modal = document.createElement("div");
                modal.className = "cinematic-quote-transition easter-egg-overlay";
                modal.innerHTML = `
                    <div class="quote-transition-text easter-egg-box">
                        <span class="egg-meta">⚠️ FILE SEGRETO DI ITALO CALVINO SBLOCCATO</span><br>
                        <p class="egg-text"></p>
                        <button class="btn-vintage small close-egg" style="margin-top:20px;">Chiudi Dossier</button>
                    </div>
                `;
                document.body.appendChild(modal);

                const eggText = "«Prendete la vita con leggerezza, che leggerezza non è superficialità, ma planare sulle cose dall'alto, non avere macigni sul cuore. Spero che questa valigia di sogni vi abbia ispirato a tracciare la vostra città invisibile nel cielo dell'immaginazione. Dedicato a chi legge con stupore.»";
                const textNode = modal.querySelector(".egg-text");

                let index = 0;
                const typing = setInterval(() => {
                    if (index < eggText.length) {
                        textNode.innerHTML += eggText[index];
                        index++;
                        if (index % 4 === 0) audioEngine.playTypewriterClick();
                    } else {
                        clearInterval(typing);
                    }
                }, 25);

                modal.querySelector(".close-egg").onclick = () => {
                    modal.classList.add("fade-out");
                    setTimeout(() => modal.remove(), 800);
                };
            }
        });
    }
});

