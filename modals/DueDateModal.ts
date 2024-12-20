import { App, Modal } from 'obsidian';
import { DateFormatter } from '../utils/DateFormatter';
import { i18n } from '../main';

export class DueDateModal extends Modal {
  result: string | null = null;
  onSubmit: (result: string | null) => void;
  private i18n = i18n;
  private reminderCreated = false;
  private inputEl: HTMLInputElement;

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
    container.style.gap = "2rem";
    container.style.padding = "1.5rem";
    container.style.maxWidth = "800px";
    container.style.margin = "0 auto";
    
    // Colonne de gauche (instructions)
    const leftColumn = container.createDiv();
    leftColumn.style.flex = "1";
    
    // Titre avec style
    const title = leftColumn.createEl('h2', { text: this.i18n.t('modals.dueDate.title') });
    title.style.marginBottom = "1.2rem";
    title.style.fontSize = "1.5em";
    title.style.color = "var(--text-accent)";
    
    // Description avec style
    const helpText = leftColumn.createEl('p', { text: this.i18n.t('modals.dueDate.helpText') });
    helpText.style.marginBottom = "1.5rem";
    helpText.style.lineHeight = "1.5";
    helpText.style.color = "var(--text-muted)";
    
    // Section raccourcis clavier
    const optionsList = leftColumn.createEl('div');
    const optionsTitle = optionsList.createEl('p', { text: this.i18n.t('modals.dueDate.options') });
    optionsTitle.style.fontWeight = "bold";
    optionsTitle.style.marginBottom = "0.8rem";
    
    const ul = optionsList.createEl('ul');
    ul.style.listStyleType = "none";
    ul.style.padding = "0";
    
    // Instructions consolidées avec icônes
    const shortcuts = [
      { key: 'escKey', icon: '✖️' },
      { key: 'enterKey', icon: '✓' }
    ];
    
    shortcuts.forEach(({ key, icon }) => {
      const li = ul.createEl('li');
      li.style.marginBottom = "0.6rem";
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.gap = "0.5rem";
      
      const iconSpan = li.createEl('span');
      iconSpan.setText(icon);
      iconSpan.style.fontSize = "1.1em";
      
      const textSpan = li.createEl('span');
      textSpan.setText(this.i18n.t(`modals.dueDate.${key}`));
      textSpan.style.color = "var(--text-normal)";
    });

    // Colonne de droite (calendrier)
    const rightColumn = container.createDiv();
    rightColumn.style.minWidth = "280px";
    rightColumn.style.padding = "1.5rem";
    rightColumn.style.backgroundColor = "var(--background-secondary)";
    rightColumn.style.border = "1px solid var(--background-modifier-border)";
    rightColumn.style.borderRadius = "8px";
    rightColumn.style.boxShadow = "0 2px 8px var(--background-modifier-box-shadow)";
    
    // Conteneur pour l'input date
    const dateContainer = rightColumn.createDiv();
    dateContainer.style.position = "relative";
    dateContainer.style.width = "100%";

    // Bouton stylisé comme un input
    const dateButton = dateContainer.createEl("button", {
      text: this.i18n.t('modals.dueDate.chooseDateButton')
    });
    dateButton.style.width = "100%";
    dateButton.style.padding = "0.8rem";
    dateButton.style.border = "1px solid var(--background-modifier-border)";
    dateButton.style.borderRadius = "4px";
    dateButton.style.backgroundColor = "var(--background-primary)";
    dateButton.style.color = "var(--text-muted)";
    dateButton.style.cursor = "pointer";
    dateButton.style.textAlign = "left";
    dateButton.style.display = "flex";
    dateButton.style.alignItems = "center";
    dateButton.style.justifyContent = "space-between";

    // Icône de calendrier
    const calendarIcon = dateButton.createSpan();
    calendarIcon.innerHTML = "📅";

    // Input date caché
    this.inputEl = dateContainer.createEl("input", {
      type: "date",
      value: DateFormatter.getFormats()[0].formatToPicker
    });
    this.inputEl.style.position = "absolute";
    this.inputEl.style.opacity = "0";
    this.inputEl.style.width = "100%";
    this.inputEl.style.height = "100%";
    this.inputEl.style.top = "0";
    this.inputEl.style.left = "0";
    this.inputEl.style.cursor = "pointer";

    // Mettre à jour le texte du bouton quand une date est sélectionnée
    this.inputEl.addEventListener('change', (e) => {
      const date = new Date(this.inputEl.value);
      const formattedDate = date.toLocaleDateString();
      dateButton.textContent = formattedDate;
      dateButton.appendChild(calendarIcon);
      this.reminderCreated = true;
      this.close();
      this.onSubmit(this.inputEl.value);
    });

    // Ouvrir le sélecteur de date au clic sur le bouton
    dateButton.addEventListener('click', () => {
      this.inputEl.showPicker();
    });

    // Gestionnaires d'événements
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Gestionnaire pour ESC et ENTER
    this.scope.register([], 'Escape', (evt) => {
      evt.preventDefault();
      if (this.isCalendarOpen()) {
        this.inputEl.blur();
      } else {
        this.close();
        this.onSubmit(null);
      }
      return false;
    });

    this.scope.register([], 'Enter', (evt) => {
      evt.preventDefault();
      if (this.isCalendarOpen()) {
        this.reminderCreated = true;
        this.close();
        this.onSubmit(this.inputEl.value);
      } else {
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
    return document.activeElement === this.inputEl;
  }

  onClose() {
    if (!this.reminderCreated) {
      this.onSubmit(null);
    }
  }
}