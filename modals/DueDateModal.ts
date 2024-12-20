import { App, Modal } from 'obsidian';
import { DateFormatter } from '../utils/DateFormatter';
import { i18n } from '../main';

export class DueDateModal extends Modal {
  result: string | null = null;
  onSubmit: (result: string | null) => void;
  inputEl: HTMLInputElement;
  private i18n = i18n;
  private reminderCreated = false;

  constructor(app: App, onSubmit: (result: string | null) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    // Conteneur principal avec flexbox
    const container = contentEl.createDiv();
    container.style.display = "flex";
    container.style.gap = "20px";
    container.style.alignItems = "flex-start";
    container.style.padding = "10px";
    
    // Colonne de gauche (instructions)
    const leftColumn = container.createDiv();
    leftColumn.style.flex = "1";
    
    // Titre
    leftColumn.createEl('h2', { text: this.i18n.t('modals.dueDate.title') });
    leftColumn.createEl('p', { text: this.i18n.t('modals.dueDate.helpText') });
    
    const optionsList = leftColumn.createEl('div');
    optionsList.createEl('p', { text: this.i18n.t('modals.dueDate.options') });
    const ul = optionsList.createEl('ul');
    
    // Instructions consolidées
    ul.createEl('li', { text: this.i18n.t('modals.dueDate.escKey') });
    ul.createEl('li', { text: this.i18n.t('modals.dueDate.enterKey') });

    // Colonne de droite (calendrier)
    const rightColumn = container.createDiv();
    rightColumn.style.minWidth = "250px";
    rightColumn.style.padding = "10px";
    rightColumn.style.border = "1px solid var(--background-modifier-border)";
    rightColumn.style.borderRadius = "5px";
    
    // Input date
    this.inputEl = rightColumn.createEl("input", {
      type: "date",
      value: DateFormatter.getFormats()[0].formatToPicker
    });
    this.inputEl.style.width = "100%";
    
    // Gestionnaires d'événements
    this.inputEl.addEventListener('change', () => {
      this.reminderCreated = true;
      this.close();
      this.onSubmit(this.inputEl.value);
    });

    // Gestionnaire pour ESC et ENTER
    this.scope.register([], 'Escape', (evt) => {
      evt.preventDefault();
      if (this.isCalendarOpen()) {
        this.inputEl.blur();
      } else {
        document.querySelectorAll('.loader').forEach(loader => loader.remove());
        this.close();
        this.onSubmit(null);
      }
      return false;
    });

    this.scope.register([], 'Enter', (evt) => {
      evt.preventDefault();
      if (this.isCalendarOpen()) {
        // Valide la date sélectionnée
        this.reminderCreated = true;
        this.close();
        this.onSubmit(this.inputEl.value);
      } else {
        // Crée un reminder avec la date affichée
        this.reminderCreated = true;
        this.close();
        this.onSubmit(this.inputEl.value);
      }
      return false;
    });

    // Focus et ouvre automatiquement le calendrier
    setTimeout(() => {
      this.inputEl.focus();
      this.inputEl.showPicker();
    }, 50);
  }

  private isCalendarOpen(): boolean {
    // Vérifie si le calendrier natif est ouvert
    return document.activeElement === this.inputEl;
  }

  onClose() {
    if (!this.reminderCreated) {
      this.onSubmit(null);
    }
  }
}