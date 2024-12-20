declare module "obsidian" {
  interface Vault {
    getName(): string;
  }
}

import { Plugin, MarkdownView, Editor, Notice, EditorView, WidgetType, Platform } from 'obsidian';
import { exec } from 'child_process';
import { DateFormatter } from './utils/DateFormatter';
import { AppleReminderManager } from './managers/AppleReminderManager';
import { ReminderSettingTab } from './settings/ReminderSettingTab';
import { PluginSettings } from './types';
import { DueDateModal } from './modals/DueDateModal';
import { TodoSyncManager } from './managers/TodoSyncManager';
import { TranslationManager } from './managers/TranslationManager';
import { ViewPlugin, DecorationSet, Decoration, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

export const i18n = new TranslationManager();

export default class ObsidianToAppleReminders extends Plugin {
  settings: PluginSettings;
  private todoSyncManager: TodoSyncManager;
  private i18n: TranslationManager;
  private initialized = false;
  private keysPressed = new Set<string>();

  async onload() {
    console.log("Plugin loading...");
    await this.loadSettings();
    this.i18n = new TranslationManager();
    
    // Configuration de base
    if (this.settings.showQuickAddButton) {
      this.registerMarkdownPostProcessor(this.addQuickAddButtons.bind(this));
      this.registerEvent(
        this.app.workspace.on('layout-change', () => {
          this.updateButtonsVisibility();
        })
      );
    }

    // Initialisation du TodoSyncManager
    this.todoSyncManager = new TodoSyncManager(this.app, this.app.vault, this.settings, this.i18n);
    await this.todoSyncManager.startPeriodicCheck();

    this.addSettingTab(new ReminderSettingTab(this.app, this));

    // Commande avec raccourci par défaut
    this.addCommand({
      id: 'quick-add-reminder',
      name: this.i18n.t('commands.createReminder'),
      editorCallback: (editor: Editor) => {
        const cursorLine = editor.getCursor().line;
        const lineContent = editor.getLine(cursorLine);

        if (lineContent.match(/^- \[ \]/) && !lineContent.includes('x-apple-reminderkit://')) {
          this.onTrigger(editor, lineContent);
        } else {
          new Notice(this.i18n.t('notices.selectTask'));
        }
      },
      hotkeys: [
        {
          modifiers: ['Ctrl'],
          key: 'Enter'
        }
      ]
    });

    console.log("Plugin loaded with default hotkey: Ctrl+Enter");
  }

  private registerHotkey() {
    if (!this.initialized && this.settings.quickAddHotkey.enabled) {
      console.log("Registering hotkey");
      
      const keydownHandler = (evt: KeyboardEvent) => {
        console.log("Keydown event:", {
          key: evt.key,
          metaKey: evt.metaKey,
          altKey: evt.altKey,
          ctrlKey: evt.ctrlKey
        });
        
        const isHotkeyPressed = Platform.isMacOS
          ? (evt.metaKey && evt.altKey && evt.key === 'Enter')
          : (evt.ctrlKey && evt.altKey && evt.key === 'Enter');

        if (isHotkeyPressed) {
          console.log("Hotkey combination detected!");
          evt.preventDefault();
          evt.stopPropagation();
          this.handleQuickAdd();
        }
      };

      // Nettoyer les touches pressées quand la fenêtre perd le focus
      const clearKeys = () => {
        console.log("Clearing keys state");
      };

      document.addEventListener('keydown', keydownHandler);
      window.addEventListener('blur', clearKeys);

      this.register(() => {
        document.removeEventListener('keydown', keydownHandler);
        window.removeEventListener('blur', clearKeys);
      });
    }
  }

  private handleQuickAdd() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      console.log("No active view");
      return;
    }

    const editor = activeView.editor;
    const cursorLine = editor.getCursor().line;
    const lineContent = editor.getLine(cursorLine);
    console.log("Current line:", lineContent);

    if (lineContent.match(/^- \[ \]/) && !lineContent.includes('x-apple-reminderkit://')) {
      this.onTrigger(editor, lineContent);
    } else {
      new Notice(this.i18n.t('notices.selectTask'));
    }
  }

  onunload() {
    console.log("Plugin unloading...");
    this.initialized = false;
  }

  async loadSettings() {
    const defaultSettings = {
      listName: "Reminders",
      showQuickAddButton: false
    };
    
    this.settings = Object.assign(defaultSettings, await this.loadData());
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
      if (dueDate === null) {
        return;
      }

      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view) {
        new Notice(this.i18n.t('errors.noActiveEditor'));
        return;
      }

      const cursor = editor.getCursor();
      const line = editor.getLine(cursor.line);
      const originalLine = line;
      
      editor.setLine(cursor.line, line + " ⏳");

      const noteTitle = view.file.basename;
      const listName = this.settings.listName || "Obsidian Reminders";
      
      const date = dueDate ? new Date(dueDate) : null;
      const appleScript = AppleReminderManager.createReminderScript(todoContent, noteTitle, listName, date);
      
      exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
        editor.setLine(cursor.line, originalLine);

        if (error) {
          new Notice(this.i18n.t('errors.addingReminder', { error: stderr }));
        } else {
          const reminderId = stdout.trim();
          const backlink = `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(view.file.path)}`;
          
          const updateScript = AppleReminderManager.createBacklinkScript(reminderId, noteTitle, listName, backlink);
          
          exec(`osascript -e '${updateScript}'`, (updateError) => {
            if (updateError) {
              console.error('Error updating reminder with backlink:', updateError);
            }
          });

          new Notice(this.i18n.t('notices.reminderAdded', { 
            content: todoContent,
            list: listName 
          }));
          this.markTodoAsSent(editor, todoContent, reminderId, dueDate);
        }
      });
    } catch (error) {
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
      const cleanId = reminderId.replace('x-apple-reminder://', '').trim();
      const reminderLink = `x-apple-reminderkit://REMCDReminder/${cleanId}/details`;
      
      const cleanContent = todoContent.replace(/^- \[ \]/, '').trim();
      
      let sentTodo = `- [ ]`;
      
      if (dueDate) {
        const formattedDate = dueDate.split('T')[0];
        const dailyNoteLink = `[[${formattedDate}]]`;
        sentTodo += ` 📅 ${dailyNoteLink}`;
      }
      
      sentTodo += ` ${cleanContent} (☑ [Open](${reminderLink}))`;

      const cursor = editor.getCursor();
      editor.setLine(cursor.line, sentTodo);
    } catch (error) {
      console.error('Error marking todo as sent:', error);
      new Notice(this.i18n.t('errors.markingTodo', { error: error.message }));
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

  private updateButtonsVisibility() {
    const buttons = document.querySelectorAll('.quick-add-reminder');
    const isEditMode = this.app.workspace.getActiveViewOfType(MarkdownView)?.getMode() === 'source';
    
    buttons.forEach((button) => {
      (button as HTMLElement).style.display = isEditMode ? 'none' : 'inline-block';
    });
  }

  private addQuickAddButtons(el: HTMLElement) {
    const todoItems = el.querySelectorAll('.task-list-item input[type="checkbox"]');
    
    todoItems.forEach((checkbox: HTMLInputElement) => {
      const parentEl = checkbox.closest('.task-list-item');
      
      if (parentEl && !parentEl.textContent?.includes('x-apple-reminderkit://')) {
        const quickAddButton = document.createElement('button');
        quickAddButton.className = 'quick-add-reminder';
        quickAddButton.innerHTML = '📎';
        quickAddButton.title = this.i18n.t('commands.createReminder');
        
        quickAddButton.onclick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const view = this.app.workspace.getActiveViewOfType(MarkdownView);
          if (view) {
            const todoContent = parentEl.textContent?.trim() || '';
            await this.onTrigger(view.editor, todoContent);
          }
        };
        
        parentEl.appendChild(quickAddButton);
      }
    });
  }

  reloadHotkeys() {
    // Supprimer et recréer la commande avec les nouveaux raccourcis
    this.app.commands.removeCommand(`${this.manifest.id}:quick-add-reminder`);
    
    if (this.settings.quickAddHotkey.enabled) {
      this.addCommand({
        id: 'quick-add-reminder',
        name: this.i18n.t('commands.createReminder'),
        editorCallback: (editor: Editor) => {
          const cursorLine = editor.getCursor().line;
          const lineContent = editor.getLine(cursorLine);

          if (lineContent.match(/^- \[ \]/) && !lineContent.includes('x-apple-reminderkit://')) {
            this.onTrigger(editor, lineContent);
          } else {
            new Notice(this.i18n.t('notices.selectTask'));
          }
        },
        hotkeys: [
          {
            modifiers: ['Ctrl'],
            key: 'Enter'
          }
        ]
      });
    }
  }
}
