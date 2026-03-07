/**
 * French Message Translations
 * All user-facing messages in French for Chad
 */

const messages = {
  // Authentication messages
  AUTH_SUCCESS: 'Connexion réussie',
  AUTH_FAILED: 'Identifiants invalides',
  AUTH_OTP_SENT: 'Code de vérification envoyé à votre numéro',
  AUTH_OTP_INVALID: 'Code de vérification invalide ou expiré',
  AUTH_OTP_VERIFIED: 'Numéro vérifié avec succès',
  AUTH_UNAUTHORIZED: 'Authentification requise',
  AUTH_FORBIDDEN: 'Accès refusé',
  AUTH_TOKEN_INVALID: 'Session expirée. Veuillez vous reconnecter',
  
  // Booking messages
  BOOKING_CREATED: 'Réservation créée avec succès',
  BOOKING_CONFIRMED: 'Votre réservation est confirmée',
  BOOKING_CANCELLED: 'Réservation annulée',
  BOOKING_NOT_FOUND: 'Réservation introuvable',
  BOOKING_EXPIRED: 'Cette réservation a expiré',
  BOOKING_SEATS_UNAVAILABLE: 'Places non disponibles',
  BOOKING_INVALID_PASSENGERS: 'Nombre de passagers invalide',
  
  // Payment messages
  PAYMENT_SUCCESS: 'Paiement effectué avec succès',
  PAYMENT_PENDING: 'Paiement en attente de confirmation',
  PAYMENT_FAILED: 'Le paiement a échoué',
  PAYMENT_ALREADY_PAID: 'Cette réservation est déjà payée',
  PAYMENT_CONFIRMED: 'Paiement confirmé par l\'administrateur',
  PAYMENT_REFUNDED: 'Paiement remboursé',
  
  // Trip messages
  TRIP_CREATED: 'Voyage créé avec succès',
  TRIP_UPDATED: 'Voyage mis à jour',
  TRIP_CANCELLED: 'Voyage annulé',
  TRIP_NOT_FOUND: 'Voyage introuvable',
  TRIP_FULL: 'Ce voyage est complet',
  TRIP_DEPARTED: 'Ce voyage est déjà parti',
  
  // User messages
  USER_CREATED: 'Compte créé avec succès',
  USER_UPDATED: 'Profil mis à jour',
  USER_NOT_FOUND: 'Utilisateur introuvable',
  USER_ALREADY_EXISTS: 'Un compte existe déjà avec ce numéro',
  
  // Route messages
  ROUTE_CREATED: 'Itinéraire créé avec succès',
  ROUTE_UPDATED: 'Itinéraire mis à jour',
  ROUTE_DELETED: 'Itinéraire supprimé',
  ROUTE_NOT_FOUND: 'Itinéraire introuvable',
  
  // Bus messages
  BUS_CREATED: 'Bus ajouté avec succès',
  BUS_UPDATED: 'Informations du bus mises à jour',
  BUS_DELETED: 'Bus supprimé',
  BUS_NOT_FOUND: 'Bus introuvable',
  
  // Validation messages
  VALIDATION_ERROR: 'Données invalides',
  VALIDATION_PHONE_INVALID: 'Numéro de téléphone invalide',
  VALIDATION_EMAIL_INVALID: 'Adresse email invalide',
  VALIDATION_DATE_INVALID: 'Date invalide',
  VALIDATION_REQUIRED_FIELD: 'Ce champ est obligatoire',
  
  // System messages
  SYSTEM_ERROR: 'Erreur système. Veuillez réessayer',
  SYSTEM_MAINTENANCE: 'Système en maintenance',
  SYSTEM_SUCCESS: 'Opération réussie',
  
  // Notification messages
  NOTIFICATION_SENT: 'Notification envoyée',
  NOTIFICATION_FAILED: 'Échec d\'envoi de la notification',
  
  // Luggage messages
  LUGGAGE_EXCESS_FEE: 'Frais de bagages excédentaires',
  LUGGAGE_WITHIN_LIMIT: 'Bagages dans la limite gratuite',
  
  // WhatsApp notification templates
  WHATSAPP_BOOKING_CONFIRMATION: (bookingCode, route, date, time, seats, total) => 
    `🎫 *Confirmation de réservation*\n\n` +
    `Code: *${bookingCode}*\n` +
    `Trajet: ${route}\n` +
    `Date: ${date}\n` +
    `Heure: ${time}\n` +
    `Places: ${seats}\n` +
    `Montant total: ${total} FCFA\n\n` +
    `Présentez ce code au guichet pour obtenir votre billet.`,
  
  WHATSAPP_PAYMENT_CONFIRMATION: (bookingCode, amount, method) =>
    `✅ *Paiement confirmé*\n\n` +
    `Code: *${bookingCode}*\n` +
    `Montant: ${amount} FCFA\n` +
    `Méthode: ${method}\n\n` +
    `Votre billet est prêt. Bon voyage!`,
  
  WHATSAPP_DEPARTURE_REMINDER: (bookingCode, time, boardingPoint) =>
    `⏰ *Rappel de départ*\n\n` +
    `Code: *${bookingCode}*\n` +
    `Départ dans 2 heures à ${time}\n` +
    `Point d'embarquement: ${boardingPoint}\n\n` +
    `N'oubliez pas votre pièce d'identité!`,
  
  WHATSAPP_TRIP_DELAYED: (bookingCode, newTime, reason) =>
    `⚠️ *Retard de voyage*\n\n` +
    `Code: *${bookingCode}*\n` +
    `Nouvelle heure: ${newTime}\n` +
    `Raison: ${reason}\n\n` +
    `Merci de votre compréhension.`,
  
  WHATSAPP_TRIP_CANCELLED: (bookingCode, reason) =>
    `❌ *Voyage annulé*\n\n` +
    `Code: *${bookingCode}*\n` +
    `Raison: ${reason}\n\n` +
    `Contactez-nous pour un remboursement ou un report.`,
  
  // Email templates
  EMAIL_BOOKING_SUBJECT: 'Confirmation de réservation',
  EMAIL_PAYMENT_SUBJECT: 'Confirmation de paiement',
  EMAIL_TICKET_SUBJECT: 'Votre billet de voyage',
};

/**
 * Get message by key with optional parameters
 * @param {string} key - Message key
 * @param {object} params - Parameters for dynamic messages
 * @returns {string} Translated message
 */
const getMessage = (key, params = {}) => {
  const message = messages[key];
  
  if (!message) {
    return messages.SYSTEM_ERROR;
  }
  
  // If message is a function (template), call it with params
  if (typeof message === 'function') {
    return message(...Object.values(params));
  }
  
  return message;
};

module.exports = {
  messages,
  getMessage,
};
