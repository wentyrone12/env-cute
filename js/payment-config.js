/**
 * OWNER SETUP REQUIRED before accepting real transfers.
 * This file contains ONLY public-facing receiving information (never credentials).
 * The price applies to one-time Premium activation (not recurring billing).
 * Never put your online-banking password, PIN, OTP or Maya API secret here.
 * Security comes from Firebase database.rules.json and manual bank verification.
 */
window.WENV_PAYMENT = Object.freeze({
  premiumPricePHP: 99, // replace 0 with the price you choose, e.g. 79
  maya: { accountName: "Wendell Tyrone Jimenez", accountNumber: "09530862353" }, // Maya wallet receiving details
  gotyme: { accountName: "Wendell Tyrone Jimenez", accountNumber: "010926793920" }, // GoTyme bank receiving details
  adminUid: "KIHS4JDAzacF8YMb9KcDrtM3cU42" // Firebase Authentication UID of the owner/reviewer; not a secret
});
