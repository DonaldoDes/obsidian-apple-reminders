declare module "obsidian" {
  interface Vault {
    getName(): string;
  }
}

import { Plugin as ObsidianPlugin, PluginSettingTab, Setting, Notice, Editor, TFile, App } from 'obsidian';
import { exec } from 'child_process';

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

  sendToAppleReminders(editor: Editor, view: { file: TFile }) {
    const todoContent = editor.getSelection().trim();
    if (!todoContent) {
      new Notice('Please select a to-do item to send as a reminder.');
      return;
    }

    const noteTitle = view.file.basename;
    const backlink = `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(view.file.path)}`;
    const reminderTitle = todoContent;
    const reminderContent = `Backlink to note: ${backlink}`;

    const listName = this.settings.listName || "Reminders";

    const appleScript = `
      tell application "Reminders"
        tell list "${listName}"
          set newReminder to make new reminder with properties {name:"${reminderTitle}", body:"${reminderContent}"}
          return id of newReminder
        end tell
      end tell
    `;

    exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
      if (error) {
        new Notice(`Error adding reminder: ${stderr}`);
      } else {
        const reminderId = stdout.trim();
        new Notice(`Reminder "${reminderTitle}" added to list "${listName}".`);
        this.markTodoAsDone(editor, todoContent, reminderId);
      }
    });
  }

  markTodoAsDone(editor: Editor, todoContent: string, reminderId: string) {
    const reminderLink = `x-apple-reminderkit://REMCDReminder/${reminderId}`;
    const doneTodo = `- [x] ${todoContent} ([Apple Reminder](${reminderLink}))`;

    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const updatedLine = line.replace(`- [ ] ${todoContent}`, doneTodo);

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

export default ObsidianToAppleReminders;
