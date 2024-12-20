import { App, PluginSettingTab, Setting, Platform } from 'obsidian';

export class ReminderSettingTab extends PluginSettingTab {
  plugin: Plugin & {
    settings: PluginSettings;
    saveSettings: () => Promise<void>;
  };

  constructor(app: App, plugin: Plugin & {
    settings: PluginSettings;
    saveSettings: () => Promise<void>;
  }) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Liste Apple Reminders')
      .setDesc('Définissez la liste par défaut pour les nouveaux rappels.')
      .addText(text => text
        .setPlaceholder('Entrez le nom de la liste')
        .setValue(this.plugin.settings.listName || '')
        .onChange(async (value) => {
          this.plugin.settings.listName = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Afficher le bouton d\'ajout rapide')
      .setDesc('Affiche un bouton à côté des todos pour les ajouter rapidement à Apple Reminders')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showQuickAddButton || false)
        .onChange(async (value) => {
          this.plugin.settings.showQuickAddButton = value;
          await this.plugin.saveSettings();
        }));

    // Section des raccourcis clavier
    containerEl.createEl('h3', {
      text: 'Raccourcis clavier',
      cls: 'setting-item-heading'
    });

    const hotkeyInfo = containerEl.createEl('div', {
      cls: 'setting-item-description'
    });

    hotkeyInfo.createEl('p', {
      text: 'Par défaut, utilisez Ctrl+Enter pour envoyer le todo sur lequel se trouve votre curseur vers Apple Reminders.'
    });

    hotkeyInfo.createEl('p', {
      text: 'Ce raccourci peut être modifié dans Paramètres > Raccourcis clavier > "Ajouter le todo courant à Apple Reminders"'
    });

    hotkeyInfo.createEl('p', {
      text: 'Note : Le raccourci ne fonctionne que sur les todos non synchronisés (lignes commençant par "- [ ]" sans lien Apple Reminders).'
    });
  }
} 