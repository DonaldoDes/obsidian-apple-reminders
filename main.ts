declare module "obsidian" {
  interface Vault {
    getName(): string;
  }
}

import { Plugin as ObsidianPlugin, PluginSettingTab, Setting, Notice, Editor, TFile, App, getIcon } from 'obsidian';
import { exec } from 'child_process';
import { Modal } from 'obsidian';

interface PluginSettings {
  listName: string;
}

class ObsidianToAppleReminders extends ObsidianPlugin {
  settings: PluginSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new ReminderSettingTab(this.app, this));

    this.addCommand({
      id: 'send-to-apple-reminders',
      name: 'Send to Apple Reminders',
      editorCallback: (editor, view) => this.sendToAppleReminders(editor, view),
    });
  }

  async loadSettings() {
    this.settings = Object.assign({ listName: "Reminders" }, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async sendToAppleReminders(editor: Editor, view: { file: TFile }) {
    const todoContent = editor.getSelection().trim();
    
    if (!todoContent) {
      new Notice('Please select a to-do item to send as a reminder.');
      return;
    }

    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const originalLine = line;
    
    // Ajouter l'indicateur de chargement à la fin de la ligne
    editor.setLine(cursor.line, line + " ⏳");

    const dueDate = await this.getDueDate();
    if (!dueDate) {
        editor.setLine(cursor.line, originalLine);
        return;
    }

    const noteTitle = view.file.basename;
    const listName = this.settings.listName || "Obsidian Reminders";
    
    let appleScript = `
      tell application "Reminders"
        tell list "${listName}"`;
    
    if (dueDate) {
      const date = new Date(dueDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      appleScript += `
          set dueDate to current date
          set year of dueDate to ${year}
          set month of dueDate to ${month}
          set day of dueDate to ${day}
          set newReminder to make new reminder with properties {name:"${todoContent}", body:"From note: ${noteTitle}", due date:dueDate}`;
    } else {
      appleScript += `
          set newReminder to make new reminder with properties {name:"${todoContent}", body:"From note: ${noteTitle}"}`;
    }
    
    appleScript += `
          return id of newReminder
        end tell
      end tell`;
    
    exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
        // Restaurer la ligne originale
        editor.setLine(cursor.line, originalLine);

        if (error) {
            console.error('AppleScript error:', error);
            console.error('stderr:', stderr);
            new Notice(`Error adding reminder: ${stderr}`);
        } else {
            const reminderId = stdout.trim();
            const cleanId = reminderId.replace('x-apple-reminder://', '');
            const backlink = `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(view.file.path)}`;
            
            const updateScript = `
              tell application "Reminders"
                tell list "${listName}"
                  set r to reminder id "${reminderId}"
                  set body of r to "From note: ${noteTitle}\\n\\nBacklink: ${backlink}"
                end tell
              end tell`;
            
            exec(`osascript -e '${updateScript}'`, (updateError) => {
              if (updateError) {
                console.error('Error updating reminder with backlink:', updateError);
              }
            });

            new Notice(`Reminder "${todoContent}" added to list "${listName}".`);
            this.markTodoAsSent(editor, todoContent, reminderId, dueDate);
        }
    });
  }

  async getDueDate(): Promise<string | null> {
    return new Promise((resolve) => {
      const modal = new DueDateModal(this.app, (result) => {
        resolve(result);
      });
      modal.open();
    });
  }

  markTodoAsSent(editor: Editor, todoContent: string, reminderId: string, dueDate: string | null) {
    const cleanId = reminderId.replace('x-apple-reminder://', '');
    const reminderLink = `x-apple-reminderkit://REMCDReminder/${cleanId}/details`;
    
    let sentTodo = `- [ ] `;
    
    // Ajouter la date au début s'il y en a une
    if (dueDate) {
        const dailyNoteLink = `[[${dueDate}]]`;
        sentTodo += `📅 ${dailyNoteLink} `;
    }
    
    // Ajouter le contenu du todo et le lien vers Reminders
    sentTodo += `${todoContent} (☑ [Open](${reminderLink}))`;

    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const updatedLine = line.replace(`- [ ] ${todoContent}`, sentTodo);

    editor.setLine(cursor.line, updatedLine);
  }
}

class ReminderSettingTab extends PluginSettingTab {
  plugin: ObsidianToAppleReminders;

  constructor(app: App, plugin: ObsidianToAppleReminders) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Apple Reminders List')
      .setDesc('Set the default list for new reminders.')
      .addText(text => text
        .setPlaceholder('Enter list name')
        .setValue(this.plugin.settings.listName || '')
        .onChange(async (value) => {
          this.plugin.settings.listName = value;
          await this.plugin.saveSettings();
        }));
  }
}

class DueDateModal extends Modal {
  result: string | null = null;
  onSubmit: (result: string | null) => void;
  inputEl: HTMLInputElement;

  constructor(app: App, onSubmit: (result: string | null) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const {contentEl} = this;
    contentEl.createEl("h2", {text: "Set Due Date"});

    this.inputEl = contentEl.createEl("input", {
      type: "date",
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

    const skipButton = buttonContainer.createEl("button", {text: "Skip"});
    skipButton.onclick = () => {
      this.close();
      this.onSubmit(null);
    };

    const submitButton = buttonContainer.createEl("button", {text: "Set Date"});
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

export default ObsidianToAppleReminders;
