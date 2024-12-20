export interface PluginSettings {
  listName: string;
}

export interface Translations {
  modals: {
    dueDate: {
      title: string;
      createWithoutDate: string;
      setDate: string;
    };
  };
  notices: {
    selectTask: string;
    reminderAdded: string;
    reminderDeleted: string;
    openFile: string;
  };
  errors: {
    addingReminder: string;
  };
} 