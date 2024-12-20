import { App, Modal } from 'obsidian';
import { DateFormatter } from '../utils/DateFormatter';
import { i18n } from '../main';

export class DueDateModal extends Modal {
  result: string | null = null;
  onSubmit: (result: string | null) => void;
  inputEl: HTMLInputElement;

  constructor(app: App, onSubmit: (result: string | null) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const {contentEl} = this;
    contentEl.createEl("h2", {text: i18n.t('modals.dueDate.title')});

    this.inputEl = contentEl.createEl("input", {
      type: "date",
      value: DateFormatter.getFormats()[0].formatToPicker
    });

    // Focus et ouvre automatiquement le calendrier
    setTimeout(() => {
      this.inputEl.focus();
      this.inputEl.showPicker();
    }, 50);

    const buttonContainer = contentEl.createDiv();
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "space-between";
    buttonContainer.style.marginTop = "1rem";

    const skipButton = buttonContainer.createEl("button", {
      text: i18n.t('modals.dueDate.createWithoutDate'),
      cls: "mod-warning"
    });
    skipButton.onclick = () => {
      this.close();
      this.onSubmit(null);
    };

    const submitButton = buttonContainer.createEl("button", {
      text: i18n.t('modals.dueDate.setDate'),
      cls: "mod-cta"
    });
    submitButton.onclick = () => {
      this.close();
      this.onSubmit(this.inputEl.value);
    };

    // Soumettre automatiquement quand une date est sélectionnée
    this.inputEl.addEventListener('change', () => {
      this.close();
      this.onSubmit(this.inputEl.value);
    });
  }

  onClose() {
    const {contentEl} = this;
    contentEl.empty();
  }
} 