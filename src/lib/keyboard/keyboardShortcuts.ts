export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private enabled = true;
  
  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }
  
  register(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }
  
  unregister(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.delete(key);
  }
  
  enable(): void {
    if (!this.enabled) {
      window.addEventListener('keydown', this.handleKeyDown);
      this.enabled = true;
    }
  }
  
  disable(): void {
    if (this.enabled) {
      window.removeEventListener('keydown', this.handleKeyDown);
      this.enabled = false;
    }
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    // テキスト入力中は無効
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }
    
    const key = this.getEventKey(event);
    const shortcut = this.shortcuts.get(key);
    
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }
  
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.shift) parts.push('shift');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }
  
  private getEventKey(event: KeyboardEvent): string {
    const parts = [];
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  }
  
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }
}

// デフォルトのショートカット
export const defaultShortcuts: KeyboardShortcut[] = [
  {
    key: ' ',
    description: 'Play/Pause',
    action: () => {
      const event = new CustomEvent('shortcut:playPause');
      window.dispatchEvent(event);
    }
  },
  {
    key: 'f',
    description: 'Toggle Fullscreen',
    action: () => {
      const event = new CustomEvent('shortcut:fullscreen');
      window.dispatchEvent(event);
    }
  },
  {
    key: 'v',
    description: 'Toggle VJ Mode',
    action: () => {
      const event = new CustomEvent('shortcut:vjMode');
      window.dispatchEvent(event);
    }
  },
  {
    key: 's',
    ctrl: true,
    description: 'Save Preset',
    action: () => {
      const event = new CustomEvent('shortcut:save');
      window.dispatchEvent(event);
    }
  },
  {
    key: 'o',
    ctrl: true,
    description: 'Load Preset',
    action: () => {
      const event = new CustomEvent('shortcut:load');
      window.dispatchEvent(event);
    }
  },
  {
    key: 'r',
    description: 'Reset Time',
    action: () => {
      const event = new CustomEvent('shortcut:reset');
      window.dispatchEvent(event);
    }
  },
  {
    key: '1',
    description: 'Preset 1',
    action: () => {
      const event = new CustomEvent('shortcut:preset', { detail: 0 });
      window.dispatchEvent(event);
    }
  },
  {
    key: '2',
    description: 'Preset 2',
    action: () => {
      const event = new CustomEvent('shortcut:preset', { detail: 1 });
      window.dispatchEvent(event);
    }
  },
  {
    key: '3',
    description: 'Preset 3',
    action: () => {
      const event = new CustomEvent('shortcut:preset', { detail: 2 });
      window.dispatchEvent(event);
    }
  }
];