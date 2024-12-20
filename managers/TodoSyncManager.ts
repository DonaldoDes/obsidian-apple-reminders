import { TFile, Vault, Notice } from 'obsidian';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PluginSettings } from '../types';
import { App } from 'obsidian';
import { TranslationManager } from './TranslationManager';

const execAsync = promisify(exec);

export class TodoSyncManager {
  private vault: Vault;
  private settings: PluginSettings;
  private app: App;
  private checkInterval: number = 60 * 60 * 1000; // 1 heure en millisecondes
  private readonly REMINDER_URL_REGEX = /\[.*?\]\(x-apple-reminderkit:\/\/REMCDReminder\/([^\/]+)\/details\)/;
  private intervalId: NodeJS.Timeout | null = null;
  private i18n: TranslationManager;

  constructor(app: App, vault: Vault, settings: PluginSettings, i18n: TranslationManager) {
    this.app = app;
    this.vault = vault;
    this.settings = settings;
    this.i18n = i18n;
  }

  async startPeriodicCheck() {
    // Attendre que le vault soit prêt
    if (this.vault.getFiles().length === 0) {
      this.vault.on('resolve', async () => {
        await this.checkAllTodos();
        this.setupInterval();
      });
    } else {
      await this.checkAllTodos();
      this.setupInterval();
    }
  }

  private setupInterval() {
    this.intervalId = setInterval(() => this.checkAllTodos(), this.checkInterval);
  }

  private async checkAllTodos() {
    // Récupérer tous les fichiers du vault
    const files = this.vault.getFiles();
    // Filtrer pour ne garder que les fichiers markdown
    const markdownFiles = files.filter(file => file.extension === 'md');
    
    for (const file of markdownFiles) {
      try {
        const content = await this.vault.read(file);
        await this.checkTodosInFile(file, content);
      } catch (error) {
        // Garder cette erreur pour le debugging en production
        console.error(`Erreur lors de la lecture du fichier ${file.path}:`, error);
      }
    }
  }

  private async checkTodosInFile(file: TFile, content: string) {
    const lines = content.split('\n');
    let modified = false;
    let todoCount = 0;
    let checkedCount = 0;
    let modifiedCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('- [ ]')) {
        if (this.REMINDER_URL_REGEX.test(line)) {
          todoCount++;
          const match = line.match(this.REMINDER_URL_REGEX);
          if (match) {
            const reminderId = match[1];
            
            checkedCount++;
            const exists = await this.checkReminderExists(reminderId);
            
            if (!exists) {
              modifiedCount++;
              const todoContent = line.replace(/\s*\(☑ \[Open\].*\)/, '').trim();
              
              const notice = new Notice(
                this.i18n.t('notices.reminderDeleted', { content: todoContent }), 
                10000
              );
              
              notice.noticeEl.createEl('button', {
                text: this.i18n.t('notices.openFile'),
                cls: 'mod-cta'
              }).onclick = () => {
                this.app.workspace.openLinkText(file.path, '', false);
              };

              lines[i] = line.replace(
                /\s*\(☑ \[Open\]\(x-apple-reminderkit:\/\/REMCDReminder\/[^)]+\)\)/g,
                ' (⚠️ Reminder supprimé)'
              );
              modified = true;
            }
          }
        }
      }
    }
    
    if (modified) {
      await this.vault.modify(file, lines.join('\n'));
    }
  }

  private async checkReminderExists(reminderId: string): Promise<boolean> {
    const listName = this.settings.listName || "Obsidian Reminders";
    
    const script = `
      tell application "Reminders"
        try
          set foundList to list "${listName}"
          log "Liste trouvée: " & (name of foundList)
          try
            set foundReminder to false
            set reminders_list to reminders in foundList
            repeat with r in reminders_list
              log "Vérification du reminder: " & (id of r)
              if id of r contains "${reminderId}" then
                log "Reminder trouvé: " & (name of r) & " (ID: " & (id of r) & ")"
                set foundReminder to true
                exit repeat
              end if
            end repeat
            return foundReminder
          on error reminderError
            log "Erreur lors de la recherche du reminder: " & reminderError
            return false
          end try
        on error listError
          log "Erreur lors de la recherche de la liste: " & listError
          return false
        end try
      end tell`;

    try {
      const { stdout, stderr } = await execAsync(`osascript -e '${script}'`);

      if (stdout.includes('true') || stderr.includes('Reminder trouvé:')) {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
} 