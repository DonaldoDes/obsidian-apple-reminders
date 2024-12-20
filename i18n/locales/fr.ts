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
    createReminder: "Créer un rappel"
  },
  notices: {
    selectTask: "Veuillez sélectionner une tâche à envoyer comme rappel",
    reminderAdded: 'Reminder "{content}" ajouté à la liste "{list}".',
    reminderDeleted: '⚠️ Reminder supprimé: "{content}"',
    openFile: "📄 Ouvrir le fichier"
  },
  errors: {
    addingReminder: "Erreur lors de l'ajout du reminder: {error}",
    noActiveEditor: "Aucun éditeur actif"
  }
} 