import { App, PluginSettingTab, Setting, Plugin } from 'obsidian';
import { PluginSettings } from '../types';

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