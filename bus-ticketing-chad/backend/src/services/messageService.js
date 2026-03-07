/**
 * French message service
 * All user-facing messages must be defined here
 * Backend returns message keys, frontend displays French text
 */

const messages = {
  // Authentication messages
  AUTH_LOGIN_SUCCESS: 'Connexion réussie',
  AUTH_LOGOUT_SUCCESS: 'Déconnexion réussie',
  AUTH_INVALID_CREDENTIALS: 'Identifiants invalides',
  AUTH_USER_NOT_FOUND: 'Utilisateur non trouvé',
  AUTH_EMAIL_EXISTS: 'Cet email est déjà utilisé',
  AUTH_PHONE_EXISTS: 'Ce numéro de téléphone est déjà utilisé',
  AUTH_REGISTRATION_SUCCESS: 'Inscription réussie',
  AUTH_UNAUTHORIZED: 'Non autorisé',
  AUTH_TOKEN_INVALID: 'Token invalide ou expiré',
  AUTH_OTP_SENT: 'Code OTP envoyé à votre téléphone',
  AUTH_OTP_INVALID: 'Code OTP invalide',
  AUTH_OTP_EXPIRED: 'Code OTP expiré',

  // Booking messages
  BOOKING_CREATED: 'Réservation créée avec succès',
  BOOKING_CONFIRMED: 'Réservation confirmée',
  BOOKING_CANCELLED: 'Réservation annulée',
  BOOKING_NOT_FOUND: 'Réservation introuvable',
  BOOKING_SEATS_UNAVAILABLE: 'Sièges non disponibles',
  BOOKING_TRIP_FULL: 'Ce trajet est complet',
  BOOKING_INVALID_PASSENGER_COUNT: 'Nombre de passagers invalide',
  BOOKING_CODE_SENT: 'Code de réservation envoyé par WhatsApp',

  // Payment messages
  PAYMENT_INITIATED: 'Paiement initié',
  PAYMENT_CONFIRMED: 'Paiement confirmé',
  PAYMENT_FAILED: 'Paiement échoué',
  PAYMENT_PENDING: 'Paiement en attente',
  PAYMENT_ALREADY_CONFIRMED: 'Paiement déjà confirmé',
  PAYMENT_NOT_FOUND: 'Paiement introuvable',
  PAYMENT_MOMO_CHECK_PHONE: 'Veuillez vérifier votre téléphone pour confirmer le paiement',

  // Trip messages
  TRIP_CREATED: 'Trajet créé',
  TRIP_UPDATED: 'Trajet mis à jour',
  TRIP_CANCELLED: 'Trajet annulé',
  TRIP_NOT_FOUND: 'Trajet introuvable',
  TRIP_DEPARTED: 'Le trajet est déjà parti',
  TRIP_NO_SEATS: 'Aucun siège disponible',

  // Route messages
  ROUTE_CREATED: 'Route créée',
  ROUTE_UPDATED: 'Route mise à jour',
  ROUTE_DELETED: 'Route supprimée',
  ROUTE_NOT_FOUND: 'Route introuvable',
  ROUTE_EXISTS: 'Cette route existe déjà',

  // Bus messages
  BUS_CREATED: 'Bus créé',
  BUS_UPDATED: 'Bus mis à jour',
  BUS_DELETED: 'Bus supprimé',
  BUS_NOT_FOUND: 'Bus introuvable',
  BUS_NUMBER_EXISTS: 'Ce numéro de bus existe déjà',

  // Validation messages
  VALIDATION_REQUIRED_FIELD: 'Ce champ est requis',
  VALIDATION_INVALID_EMAIL: 'Email invalide',
  VALIDATION_INVALID_PHONE: 'Numéro de téléphone invalide',
  VALIDATION_INVALID_DATE: 'Date invalide',
  VALIDATION_PASSWORD_TOO_SHORT: 'Le mot de passe doit contenir au moins 6 caractères',
  VALIDATION_PASSWORDS_DONT_MATCH: 'Les mots de passe ne correspondent pas',

  // General messages
  SUCCESS: 'Opération réussie',
  ERROR: 'Une erreur est survenue',
  SERVER_ERROR: 'Erreur serveur',
  NOT_FOUND: 'Ressource introuvable',
  FORBIDDEN: 'Accès refusé',
  INVALID_REQUEST: 'Requête invalide',

  // Notification messages
  NOTIFICATION_SENT: 'Notification envoyée',
  NOTIFICATION_FAILED: 'Échec de l\'envoi de la notification',

  // Seat messages
  SEAT_ALREADY_BOOKED: 'Ce siège est déjà réservé',
  SEAT_SELECTED: 'Siège sélectionné',
  SEAT_AVAILABLE: 'Siège disponible',

  // Luggage messages
  LUGGAGE_LIMIT_EXCEEDED: 'Limite de bagages dépassée',
  LUGGAGE_EXTRA_FEE: 'Frais supplémentaires de bagages appliqués',
};

/**
 * Get French message by key
 * @param {string} key - Message key
 * @param {object} params - Optional parameters for dynamic messages
 * @returns {string} French message
 */
function getMessage(key, params = {}) {
  let message = messages[key] || key;
  
  // Replace parameters in message
  if (params && typeof params === 'object') {
    Object.keys(params).forEach(param => {
      message = message.replace(`{${param}}`, params[param]);
    });
  }
  
  return message;
}

/**
 * Format response with message key and French text
 * @param {string} key - Message key
 * @param {object} data - Additional data to include
 * @param {object} params - Parameters for dynamic messages
 * @returns {object} Response object
 */
function formatResponse(key, data = {}, params = {}) {
  return {
    messageKey: key,
    message: getMessage(key, params),
    ...data,
  };
}

module.exports = {
  messages,
  getMessage,
  formatResponse,
};
