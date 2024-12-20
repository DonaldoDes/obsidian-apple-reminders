import { TFile, Vault, Events, Notice } from 'obsidian';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PluginSettings } from '../types';
import { App } from 'obsidian';

const execAsync = promisify(exec);

export class TodoSyncManager {
  private vault: Vault;
  private settings: PluginSettings;
  private app: App;
  private checkInterval: number = 60 * 60 * 1000; // 1 heure en millisecondes
  private readonly REMINDER_URL_REGEX = /\[.*?\]\(x-apple-reminderkit:\/\/REMCDReminder\/([^\/]+)\/details\)/;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(app: App, vault: Vault, settings: PluginSettings) {
    this.app = app;
    this.vault = vault;
    this.settings = settings;
    console.log('TodoSyncManager initialisé avec la liste:', this.settings.listName);
  }

  async startPeriodicCheck() {
    console.log('Démarrage de la vérification périodique');
    
    // Attendre que le vault soit prêt
    if (this.vault.getFiles().length === 0) {
      console.log('Vault non prêt, attente...');
      this.vault.on('resolve', async () => {
        console.log('Vault prêt, démarrage de la vérification');
        await this.checkAllTodos();
        this.setupInterval();
      });
    } else {
      await this.checkAllTodos();
      this.setupInterval();
    }
  }

  private setupInterval() {
    console.log(`Configuration de l'intervalle de vérification: ${this.checkInterval}ms`);
    this.intervalId = setInterval(() => this.checkAllTodos(), this.checkInterval);
  }

  private async checkAllTodos() {
    console.log("=== Début de la vérification des reminders ===");
    
    // Récupérer tous les fichiers du vault
    const files = this.vault.getFiles();
    // Filtrer pour ne garder que les fichiers markdown
    const markdownFiles = files.filter(file => file.extension === 'md');
    
    console.log(`Nombre total de fichiers: ${files.length}`);
    console.log(`Nombre de fichiers markdown trouvés: ${markdownFiles.length}`);
    console.log('Fichiers markdown trouvés:', markdownFiles.map(f => f.path));
    
    for (const file of markdownFiles) {
      console.log(`\nVérification du fichier: ${file.path}`);
      try {
        const content = await this.vault.read(file);
        await this.checkTodosInFile(file, content);
      } catch (error) {
        console.error(`Erreur lors de la lecture du fichier ${file.path}:`, error);
      }
    }
    console.log("=== Vérification des reminders terminée ===\n");
  }

  private async checkTodosInFile(file: TFile, content: string) {
    const lines = content.split('\n');
    let modified = false;
    let todoCount = 0;
    let checkedCount = 0;
    let modifiedCount = 0;
    
    console.log(`Analyse de ${lines.length} lignes dans ${file.path}`);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('- [ ]')) {
        console.log(`Todo trouvé: ${line}`);
        if (this.REMINDER_URL_REGEX.test(line)) {
          todoCount++;
          const match = line.match(this.REMINDER_URL_REGEX);
          if (match) {
            const reminderId = match[1];
            console.log(`\nTodo avec reminder trouvé, ID: ${reminderId}`);
            console.log(`Ligne originale: ${line}`);
            
            checkedCount++;
            const exists = await this.checkReminderExists(reminderId);
            console.log(`Reminder existe: ${exists}`);
            
            if (!exists) {
              modifiedCount++;
              const todoContent = line.replace(/\s*\(☑ \[Open\].*\)/, '').trim();
              
              const notice = new Notice(
                `⚠️ Reminder supprimé: "${todoContent}"`, 
                10000 // 10 secondes
              );
              
              notice.noticeEl.createEl('button', {
                text: '📄 Ouvrir le fichier',
                cls: 'mod-cta'
              }).onclick = () => {
                this.app.workspace.openLinkText(file.path, '', false);
              };

              lines[i] = line.replace(
                /\s*\(☑ \[Open\]\(x-apple-reminderkit:\/\/REMCDReminder\/[^)]+\)\)/g,
                ' (⚠️ Reminder supprimé)'
              );
              console.log(`Ligne modifiée: ${lines[i]}`);
              modified = true;
            }
          }
        }
      }
    }

    console.log(`\nRésumé pour ${file.path}:`);
    console.log(`- Todos avec reminder trouvés: ${todoCount}`);
    console.log(`- Reminders vérifiés: ${checkedCount}`);
    console.log(`- Todos modifiés: ${modifiedCount}`);
    
    if (modified) {
      console.log('Sauvegarde des modifications...');
      await this.vault.modify(file, lines.join('\n'));
      console.log('Modifications sauvegardées');
    }
  }

  private async checkReminderExists(reminderId: string): Promise<boolean> {
    const listName = this.settings.listName || "Obsidian Reminders";
    console.log(`Vérification du reminder ${reminderId} dans la liste "${listName}"`);
    
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
      console.log('Exécution du script AppleScript:');
      console.log(script);
      
      const { stdout, stderr } = await execAsync(`osascript -e '${script}'`);
      console.log('Sortie brute AppleScript:', stdout);
      if (stderr) {
        console.log('Logs AppleScript:', stderr);
      }

      // Vérifions si la sortie contient des informations utiles
      if (stdout.includes('true') || stderr.includes('Reminder trouvé:')) {
        console.log('Reminder trouvé');
        return true;
      }

      console.log(`Résultat final de la vérification: false`);
      return false;
    } catch (error) {
      console.error('Erreur lors de l\'exécution du script:', error);
      if (error instanceof Error) {
        console.error('Message d\'erreur:', error.message);
        console.error('Stack trace:', error.stack);
      }
      return false;
    }
  }

  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
} 