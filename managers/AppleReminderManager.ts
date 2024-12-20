export class AppleReminderManager {
  static createReminderScript(
    todoContent: string, 
    noteTitle: string, 
    listName: string, 
    dueDate?: Date
  ): string {
    const baseScript = this.getBaseScript(listName);
    const reminderProperties = this.getReminderProperties(todoContent, noteTitle, dueDate);
    
    return `
      ${baseScript}
        ${reminderProperties}
        return id of newReminder
      end tell
    end tell`;
  }

  private static getBaseScript(listName: string): string {
    return `
      tell application "Reminders"
        tell list "${listName}"`;
  }

  private static getReminderProperties(
    todoContent: string, 
    noteTitle: string, 
    dueDate?: Date
  ): string {
    if (dueDate) {
      return `
        set dueDate to current date
        set year of dueDate to ${dueDate.getFullYear()}
        set month of dueDate to ${dueDate.getMonth() + 1}
        set day of dueDate to ${dueDate.getDate()}
        set newReminder to make new reminder with properties {name:"${todoContent}", body:"From note: ${noteTitle}", due date:dueDate}`;
    }
    
    return `set newReminder to make new reminder with properties {name:"${todoContent}", body:"From note: ${noteTitle}"}`;
  }

  static createBacklinkScript(reminderId: string, noteTitle: string, listName: string, backlink: string) {
    return `
      tell application "Reminders"
        tell list "${listName}"
          set r to reminder id "${reminderId}"
          set body of r to "From note: ${noteTitle}\\n\\nBacklink: ${backlink}"
        end tell
      end tell`;
  }
} 