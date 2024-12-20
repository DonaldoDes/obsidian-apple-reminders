import { App, PluginSettingTab, Setting, Platform } from 'obsidian';

export class ReminderSettingTab extends PluginSettingTab {
  plugin: Plugin & {
    settings: PluginSettings;
    saveSettings: () => Promise<void>;
    i18n: any;
  };

  constructor(app: App, plugin: Plugin & {
    settings: PluginSettings;
    saveSettings: () => Promise<void>;
    i18n: any;
  }) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName(this.plugin.i18n.t('settings.listName.title'))
      .setDesc(this.plugin.i18n.t('settings.listName.description'))
      .addText(text => text
        .setPlaceholder(this.plugin.i18n.t('settings.listName.placeholder'))
        .setValue(this.plugin.settings.listName || '')
        .onChange(async (value) => {
          this.plugin.settings.listName = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(this.plugin.i18n.t('settings.quickAddButton.title'))
      .setDesc(this.plugin.i18n.t('settings.quickAddButton.description'))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showQuickAddButton || false)
        .onChange(async (value) => {
          this.plugin.settings.showQuickAddButton = value;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl('h3', {
      text: this.plugin.i18n.t('settings.hotkeySection.title'),
      cls: 'setting-item-heading'
    });

    const hotkeyInfo = containerEl.createEl('div', {
      cls: 'setting-item-description'
    });

    hotkeyInfo.createEl('p', {
      text: this.plugin.i18n.t('settings.hotkeySection.defaultHotkey')
    });

    hotkeyInfo.createEl('p', {
      text: this.plugin.i18n.t('settings.hotkeySection.customizeHotkey')
    });

    hotkeyInfo.createEl('p', {
      text: this.plugin.i18n.t('settings.hotkeySection.hotkeyCondition')
    });
  }
} 