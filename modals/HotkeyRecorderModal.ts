import { Modal, Platform } from 'obsidian';

interface Hotkey {
  modifiers: string[];
  key: string;
}

export class HotkeyRecorderModal extends Modal {
  private onSubmit: (hotkey: Hotkey | null) => void;
  private currentHotkey: Hotkey | null = null;
  private recordingDiv: HTMLDivElement;

  constructor(app: any, onSubmit: (hotkey: Hotkey | null) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Record new hotkey' });
    
    this.recordingDiv = contentEl.createEl('div', {
      text: 'Press a key combination...',
      cls: 'hotkey-recorder'
    });

    const buttonContainer = contentEl.createEl('div', {
      cls: 'hotkey-recorder-buttons'
    });

    buttonContainer.createEl('button', {
      text: 'Cancel',
      cls: 'mod-warning'
    }).addEventListener('click', () => {
      this.close();
      this.onSubmit(null);
    });

    this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
      evt.preventDefault();
      evt.stopPropagation();

      const modifiers: string[] = [];
      if (evt.ctrlKey) modifiers.push('Ctrl');
      if (evt.metaKey) modifiers.push('Meta');
      if (evt.altKey) modifiers.push('Alt');
      if (evt.shiftKey) modifiers.push('Shift');

      const key = evt.key === ' ' ? 'Space' : evt.key;
      if (!['Control', 'Meta', 'Alt', 'Shift'].includes(key)) {
        this.currentHotkey = {
          modifiers,
          key: key.length === 1 ? key.toUpperCase() : key
        };

        this.recordingDiv.setText(this.formatHotkey(this.currentHotkey));
        this.close();
        this.onSubmit(this.currentHotkey);
      }
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  private formatHotkey(hotkey: Hotkey): string {
    if (Platform.isMacOS) {
      const macModifiers = hotkey.modifiers.map(mod => 
        mod === 'Meta' ? '⌘' : 
        mod === 'Alt' ? '⌥' : 
        mod === 'Ctrl' ? '⌃' : 
        mod === 'Shift' ? '⇧' : mod
      );
      return [...macModifiers, hotkey.key].join(' + ');
    }
    return [...hotkey.modifiers, hotkey.key].join(' + ');
  }
} 