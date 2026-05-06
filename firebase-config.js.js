/* ============================================================
 * PRICETAG WARS — your config lives here.
 *
 * This file is loaded BEFORE index.html runs. Future updates to
 * index.html will NOT touch this file, so you only need to set
 * these values once.
 *
 * GET YOUR FIREBASE VALUES:
 *   1. https://console.firebase.google.com → your project
 *   2. Gear icon → Project settings → scroll to "Your apps"
 *   3. Click the "Config" radio button under SDK setup
 *   4. Copy the values from the firebaseConfig object Firebase shows you
 *      and paste them into the matching keys below.
 *
 * GET YOUR AMAZON ASSOCIATES TAG (optional, for affiliate revenue):
 *   1. Sign up at https://affiliate-program.amazon.com
 *   2. Replace "yourtag-20" with the tracking ID Amazon gives you
 *
 * NOTE ON SECURITY:
 *   Firebase web API keys are designed to be public. Real security
 *   comes from your Realtime Database rules (firebase-rules.json)
 *   and authorized domains in your Firebase project, not from
 *   hiding the API key. So it's safe to commit this file to git.
 * ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyDoAhW5wF2KUmT7-7w-TypOudfx2CDHtsw",
  authDomain: "pricetag-wars.firebaseapp.com",
  databaseURL: "https://pricetag-wars-default-rtdb.firebaseio.com",
  projectId: "pricetag-wars",
  storageBucket: "pricetag-wars.firebasestorage.app",
  messagingSenderId: "71945708079",
  appId: "1:71945708079:web:40397719846ea370a25cda"
};