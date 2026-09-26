/**
 * googleAuth.js — verifies the Google ID token sent by the login page.
 * Checks it was issued for our GOOGLE_CLIENT_ID and that the email is verified by Google, because
 * access is granted by matching that email against our User / EligibleStudent records.
 */

const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google ID token and returns the decoded payload.
 * @param {string} idToken
 * @returns {Promise<{email: string, name: string, picture: string}>}
 */
async function verifyGoogleToken(idToken) {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    // Access is granted by matching the email, so only accept addresses Google has verified
    if (!payload?.email || payload.email_verified !== true) {
        throw new Error('Invalid token: Google account email is not verified');
    }
    return {
        email: payload.email,
        name: payload.name || payload.email,
        picture: payload.picture || '',
    };
}

module.exports = { verifyGoogleToken };
