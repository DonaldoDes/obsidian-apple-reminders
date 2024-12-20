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
    createReminder: "Create reminder"
  },
  notices: {
    selectTask: "Please select a task to send as a reminder",
    reminderAdded: 'Reminder "{content}" added to list "{list}".',
    reminderDeleted: '⚠️ Reminder deleted: "{content}"',
    openFile: "📄 Open file"
  },
  errors: {
    addingReminder: "Error adding reminder: {error}",
    noActiveEditor: "No active editor"
  }
} 