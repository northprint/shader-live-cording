<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as Tone from 'tone';
  
  let synth: Tone.Synth | null = null;
  let isPlaying = false;
  let selectedWaveform: Tone.ToneOscillatorType = 'sine';
  let attack = 0.01;
  let decay = 0.1;
  let sustain = 0.5;
  let release = 1;
  let volume = -10;
  
  // シーケンサー用
  let pattern = [
    { note: 'C4', time: '0:0' },
    { note: 'E4', time: '0:1' },
    { note: 'G4', time: '0:2' },
    { note: 'B4', time: '0:3' }
  ];
  let sequence: Tone.Sequence | null = null;
  let bpm = 120;
  
  onMount(() => {
    // Tone.jsの初期化
    synth = new Tone.Synth({
      oscillator: {
        type: selectedWaveform
      },
      envelope: {
        attack,
        decay,
        sustain,
        release
      },
      volume
    }).toDestination();
  });
  
  onDestroy(() => {
    if (sequence) {
      sequence.dispose();
    }
    if (synth) {
      synth.dispose();
    }
    Tone.Transport.stop();
  });
  
  function updateSynth() {
    if (!synth) return;
    
    synth.set({
      oscillator: {
        type: selectedWaveform
      },
      envelope: {
        attack,
        decay,
        sustain,
        release
      },
      volume
    });
  }
  
  function playNote(note: string) {
    if (!synth) return;
    // パラメータを即座に反映
    updateSynth();
    synth.triggerAttackRelease(note, '8n');
  }
  
  function toggleSequencer() {
    if (!synth) return;
    
    if (isPlaying) {
      Tone.Transport.stop();
      if (sequence) {
        sequence.stop();
      }
      isPlaying = false;
    } else {
      // シーケンスの作成
      if (sequence) {
        sequence.dispose();
      }
      
      sequence = new Tone.Sequence((time, note) => {
        synth?.triggerAttackRelease(note, '8n', time);
      }, pattern.map(p => p.note), '4n');
      
      Tone.Transport.bpm.value = bpm;
      sequence.start(0);
      Tone.Transport.start();
      isPlaying = true;
    }
  }
  
  $: updateSynth();
  $: if (sequence) {
    Tone.Transport.bpm.value = bpm;
  }
</script>

<div class="sound-programming">
  <h3>Sound Programming</h3>
  <p class="description">
    シンセサイザーで音を生成します。パラメータを調整して音色を変更できます。
  </p>
  
  <div class="section">
    <h4>Oscillator</h4>
    <select bind:value={selectedWaveform}>
      <option value="sine">Sine</option>
      <option value="square">Square</option>
      <option value="sawtooth">Sawtooth</option>
      <option value="triangle">Triangle</option>
    </select>
  </div>
  
  <div class="section">
    <h4>Envelope</h4>
    <div class="control">
      <label>Attack: {attack}s</label>
      <input type="range" min="0" max="2" step="0.01" bind:value={attack} />
    </div>
    <div class="control">
      <label>Decay: {decay}s</label>
      <input type="range" min="0" max="2" step="0.01" bind:value={decay} />
    </div>
    <div class="control">
      <label>Sustain: {sustain}</label>
      <input type="range" min="0" max="1" step="0.01" bind:value={sustain} />
    </div>
    <div class="control">
      <label>Release: {release}s</label>
      <input type="range" min="0" max="5" step="0.01" bind:value={release} />
    </div>
  </div>
  
  <div class="section">
    <h4>Volume</h4>
    <div class="control">
      <label>Volume: {volume}dB</label>
      <input type="range" min="-30" max="0" step="1" bind:value={volume} />
    </div>
  </div>
  
  <div class="section">
    <h4>Test Notes</h4>
    <div class="keyboard">
      {#each ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'] as note}
        <button class="key" on:click={() => playNote(note)}>
          {note}
        </button>
      {/each}
    </div>
  </div>
  
  <div class="section">
    <h4>Sequencer</h4>
    <div class="control">
      <label>BPM: {bpm}</label>
      <input type="range" min="60" max="180" step="1" bind:value={bpm} />
    </div>
    <button class="toggle-button" on:click={toggleSequencer}>
      {isPlaying ? 'Stop' : 'Play'} Sequence
    </button>
  </div>
</div>

<style>
  .sound-programming {
    padding: 1rem;
  }
  
  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #ccc;
  }
  
  .description {
    margin: 0 0 1rem 0;
    font-size: 0.85rem;
    color: #888;
    line-height: 1.4;
  }
  
  .section {
    margin-bottom: 1.5rem;
  }
  
  .section h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: #999;
  }
  
  select {
    width: 100%;
    padding: 0.5rem;
    background-color: #2a2a2a;
    color: #fff;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .control {
    margin-bottom: 0.5rem;
  }
  
  .control label {
    display: block;
    font-size: 0.85rem;
    color: #888;
    margin-bottom: 0.25rem;
  }
  
  .control input[type="range"] {
    width: 100%;
    height: 4px;
    background: #3a3a3a;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }
  
  .control input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: #4a9eff;
    cursor: pointer;
    border-radius: 50%;
  }
  
  .keyboard {
    display: flex;
    gap: 0.25rem;
  }
  
  .key {
    flex: 1;
    padding: 0.5rem;
    background-color: #3a3a3a;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: background-color 0.1s;
  }
  
  .key:hover {
    background-color: #4a4a4a;
  }
  
  .key:active {
    background-color: #5a5a5a;
  }
  
  .toggle-button {
    width: 100%;
    padding: 0.5rem;
    background-color: #4a9eff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: opacity 0.2s;
  }
  
  .toggle-button:hover {
    opacity: 0.8;
  }
</style>