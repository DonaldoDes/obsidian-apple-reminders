export default {
  modals: {
    dueDate: {
      title: "Add due date",
      helpText: "Choose a date for your reminder, create it without a due date, or cancel.",
      options: "Keyboard shortcuts:",
      escKey: "ESC: Close window without creating reminder",
      enterKey: "ENTER: Validate selected date or create without date",
      withoutDate: "Create without date",
      cancel: "Cancel",
      chooseDateButton: "Choose a date"
    }
  },
  commands: {
    createReminder: "Send todo to Apple Reminders (Ctrl+Enter)"
  },
  settings: {
    listName: {
      title: "Apple Reminders List",
      description: "Set the default list for new reminders.",
      placeholder: "Enter list name"
    },
    quickAddButton: {
      title: "Show quick add button",
      description: "Display a button next to todos to quickly add them to Apple Reminders"
    },
    hotkeySection: {
      title: "Keyboard Shortcuts",
      defaultHotkey: "By default, use Ctrl+Enter to send the todo under your cursor to Apple Reminders.",
      customizeHotkey: "This shortcut can be modified in Settings > Hotkeys > \"Send current todo to Apple Reminders\"",
      hotkeyCondition: "Note: The shortcut only works on unsynchronized todos (lines starting with \"- [ ]\" without Apple Reminders link)."
    },
    markAsDone: {
      title: "Mark as done after sending",
      description: "Automatically check todos once they are sent to Apple Reminders"
    }
  },
  notices: {
    selectTask: "Please select a task to send as a reminder",
    reminderAdded: 'Reminder "{content}" added to list "{list}".',
    reminderDeleted: '⚠️ Reminder deleted: "{content}"',
    openFile: "📄 Open file"
  },
  errors: {
    addingReminder: "Error adding reminder: {error}",
    noActiveEditor: "No active editor",
    markingTodo: "Error updating todo: {error}"
  },
  buttons: {
    quickAdd: "Add to Apple Reminders"
  }
} 