export default {
  modals: {
    dueDate: {
      title: "Ajouter une date d'échéance",
      helpText: "Choisissez une date pour votre rappel, créez-le sans date d'échéance, ou annulez.",
      options: "Raccourcis clavier :",
      escKey: "ESC : Ferme la fenêtre sans créer de reminder",
      enterKey: "ENTER : Valide la date sélectionnée ou crée sans date",
      withoutDate: "Créer sans date",
      cancel: "Annuler",
      chooseDateButton: "Choisir une date"
    }
  },
  commands: {
    createReminder: "Envoyer le todo vers Apple Reminders (Ctrl+Enter)"
  },
  settings: {
    listName: {
      title: "Liste Apple Reminders",
      description: "Définissez la liste par défaut pour les nouveaux rappels.",
      placeholder: "Entrez le nom de la liste"
    },
    quickAddButton: {
      title: "Afficher le bouton d'ajout rapide",
      description: "Affiche un bouton à côté des todos pour les ajouter rapidement à Apple Reminders"
    },
    hotkeySection: {
      title: "Raccourcis clavier",
      defaultHotkey: "Par défaut, utilisez Ctrl+Enter pour envoyer le todo sur lequel se trouve votre curseur vers Apple Reminders.",
      customizeHotkey: "Ce raccourci peut être modifié dans Paramètres > Raccourcis clavier > \"Ajouter le todo courant à Apple Reminders\"",
      hotkeyCondition: "Note : Le raccourci ne fonctionne que sur les todos non synchronisés (lignes commençant par \"- [ ]\" sans lien Apple Reminders)."
    }
  },
  notices: {
    selectTask: "Veuillez sélectionner une tâche à envoyer comme rappel",
    reminderAdded: 'Reminder "{content}" ajouté à la liste "{list}".',
    reminderDeleted: '⚠️ Reminder supprimé: "{content}"',
    openFile: "📄 Ouvrir le fichier"
  },
  errors: {
    addingReminder: "Erreur lors de l'ajout du reminder: {error}",
    noActiveEditor: "Aucun éditeur actif",
    markingTodo: "Erreur lors de la mise à jour du todo: {error}"
  },
  buttons: {
    quickAdd: "Ajouter à Apple Reminders"
  }
} 