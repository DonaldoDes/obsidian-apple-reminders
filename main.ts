declare module "obsidian" {
  interface Vault {
    getName(): string;
  }
}

import { Plugin as ObsidianPlugin, Notice, Editor, TFile, App } from 'obsidian';
import { exec } from 'child_process';
import { DateFormatter } from './utils/DateFormatter';
import { AppleReminderManager } from './managers/AppleReminderManager';
import { ReminderSettingTab } from './settings/ReminderSettingTab';
import { PluginSettings } from './types';
import { DueDateModal } from './modals/DueDateModal';
import { TodoSyncManager } from './managers/TodoSyncManager';

export default class ObsidianToAppleReminders extends ObsidianPlugin {
  settings: PluginSettings;
  private todoSyncManager: TodoSyncManager;

  async onload() {
    await this.loadSettings();
    
    setTimeout(async () => {
      this.todoSyncManager = new TodoSyncManager(this.app, this.app.vault, this.settings);
      await this.todoSyncManager.startPeriodicCheck();
    }, 2000);

    this.addSettingTab(new ReminderSettingTab(this.app, this));

    this.addCommand({
      id: 'send-to-apple-reminders',
      name: 'Send to Apple Reminders',
      editorCallback: (editor, view) => this.sendToAppleReminders(editor, view),
    });
  }

  onunload() {
    if (this.todoSyncManager) {
      this.todoSyncManager.stopPeriodicCheck();
    }
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
      new Notice('Veuillez sélectionner une tâche à envoyer comme rappel.');
      return;
    }

    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const originalLine = line;
    
    editor.setLine(cursor.line, line + " ⏳");

    const dueDate = await this.getDueDate();
    const noteTitle = view.file.basename;
    const listName = this.settings.listName || "Obsidian Reminders";
    
    const date = dueDate ? new Date(dueDate) : null;
    const appleScript = AppleReminderManager.createReminderScript(todoContent, noteTitle, listName, date);
    
    exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
      editor.setLine(cursor.line, originalLine);

      if (error) {
        console.error('AppleScript error:', error);
        console.error('stderr:', stderr);
        new Notice(`Error adding reminder: ${stderr}`);
      } else {
        const reminderId = stdout.trim();
        const backlink = `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(view.file.path)}`;
        
        const updateScript = AppleReminderManager.createBacklinkScript(reminderId, noteTitle, listName, backlink);
        
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
