declare module "obsidian" {
  interface Vault {
    getName(): string;
  }
}

import { Plugin as ObsidianPlugin, Notice, Editor, TFile, App, MarkdownView } from 'obsidian';
import { exec } from 'child_process';
import { DateFormatter } from './utils/DateFormatter';
import { AppleReminderManager } from './managers/AppleReminderManager';
import { ReminderSettingTab } from './settings/ReminderSettingTab';
import { PluginSettings } from './types';
import { DueDateModal } from './modals/DueDateModal';
import { TodoSyncManager } from './managers/TodoSyncManager';
import { TranslationManager } from './managers/TranslationManager';

export const i18n = new TranslationManager();

export default class ObsidianToAppleReminders extends ObsidianPlugin {
  settings: PluginSettings;
  private todoSyncManager: TodoSyncManager;
  private i18n: TranslationManager;

  async onload() {
    await this.loadSettings();
    this.i18n = new TranslationManager();
    
    setTimeout(async () => {
      this.todoSyncManager = new TodoSyncManager(this.app, this.app.vault, this.settings, i18n);
      await this.todoSyncManager.startPeriodicCheck();
    }, 2000);

    this.addSettingTab(new ReminderSettingTab(this.app, this));

    this.addCommand({
      id: 'send-to-apple-reminders',
      name: 'Send to Apple Reminders',
      editorCallback: (editor, view) => this.sendToAppleReminders(editor, view),
    });

    this.addCommand({
      id: 'create-reminder',
      name: this.i18n.t('commands.createReminder'),
      callback: () => this.handleCreateReminder()
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
      new Notice(i18n.t('notices.selectTask'));
      return;
    }

    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const originalLine = line;
    
    editor.setLine(cursor.line, line + " ⏳");

    const dueDate = await this.getDueDate();
    
    if (dueDate === null) {
      editor.setLine(cursor.line, originalLine);
      return;
    }

    const noteTitle = view.file.basename;
    const listName = this.settings.listName || "Obsidian Reminders";
    
    const date = dueDate ? new Date(dueDate) : null;
    const appleScript = AppleReminderManager.createReminderScript(todoContent, noteTitle, listName, date);
    
    exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
      editor.setLine(cursor.line, originalLine);

      if (error) {
        new Notice(i18n.t('errors.addingReminder', { error: stderr }));
      } else {
        const reminderId = stdout.trim();
        const backlink = `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(view.file.path)}`;
        
        const updateScript = AppleReminderManager.createBacklinkScript(reminderId, noteTitle, listName, backlink);
        
        exec(`osascript -e '${updateScript}'`, (updateError) => {
          if (updateError) {
            console.error('Error updating reminder with backlink:', updateError);
          }
        });

        new Notice(i18n.t('notices.reminderAdded', { 
          content: todoContent,
          list: listName 
        }));
        this.markTodoAsSent(editor, todoContent, reminderId, dueDate);
      }
    });
  }

  private removeLoader() {
    const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
    if (editor) {
      const cursor = editor.getCursor();
      const line = editor.getLine(cursor.line);
      if (line.includes('⌛')) {
        const originalLine = line.replace(' ⌛', '');
        editor.setLine(cursor.line, originalLine);
      }
    }
  }

  async getDueDate(): Promise<string | null> {
    return new Promise((resolve) => {
      const modal = new DueDateModal(this.app, (result) => {
        if (result === null) {
          this.removeLoader();
        }
        resolve(result);
      });
      modal.open();
    });
  }

  async onTrigger(editor: Editor, todoContent: string): Promise<void> {
    try {
      const dueDate = await this.getDueDate();
      if (!dueDate) {
        this.removeLoader();
        return;
      }
      // ... reste du code ...
    } catch (error) {
      this.removeLoader();
      console.error('Error:', error);
      new Notice(this.i18n.t('errors.addingReminder', { error: error.message }));
    }
  }

  async addReminder(todoContent: string, dueDate: string | null = null): Promise<string | null> {
    try {
      // ... votre code existant ...
      return reminderId;
    } catch (error) {
      this.removeLoader();
      throw error;
    }
  }

  markTodoAsSent(editor: Editor, todoContent: string, reminderId: string, dueDate: string | null) {
    try {
      const cleanId = reminderId.replace('x-apple-reminder://', '');
      const reminderLink = `x-apple-reminderkit://REMCDReminder/${cleanId}/details`;
      
      let sentTodo = `- [ ] `;
      
      if (dueDate) {
          const dailyNoteLink = `[[${dueDate}]]`;
          sentTodo += `📅 ${dailyNoteLink} `;
      }
      
      sentTodo += `${todoContent} (☑ [Open](${reminderLink}))`;

      const cursor = editor.getCursor();
      const line = editor.getLine(cursor.line);
      const updatedLine = line.replace(`- [ ] ${todoContent}`, sentTodo);

      editor.setLine(cursor.line, updatedLine);
    } catch (error) {
      this.removeLoader();
      throw error;
    }
  }

  private async handleCreateReminder() {
    const editor = this.getActiveEditor();
    if (!editor) {
      this.showError('errors.noActiveEditor');
      return;
    }

    try {
      await this.createReminder(editor);
    } catch (error) {
      this.handleError(error);
    }
  }
}
