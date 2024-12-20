export class AppleReminderManager {
  static createReminderScript(todoContent: string, noteTitle: string, listName: string, dueDate?: Date) {
    let appleScript = `
      tell application "Reminders"
        tell list "${listName}"`;
    
    if (dueDate) {
      const year = dueDate.getFullYear();
      const month = dueDate.getMonth() + 1;
      const day = dueDate.getDate();
      
      appleScript += `
          set dueDate to current date
          set year of dueDate to ${year}
          set month of dueDate to ${month}
          set day of dueDate to ${day}
          set newReminder to make new reminder with properties {name:"${todoContent}", body:"From note: ${noteTitle}", due date:dueDate}`;
    } else {
      appleScript += `
          set newReminder to make new reminder with properties {name:"${todoContent}", body:"From note: ${noteTitle}"}`;
    }
    
    appleScript += `
          return id of newReminder
        end tell
      end tell`;
      
    return appleScript;
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