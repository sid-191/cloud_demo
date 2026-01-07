import { Firestore } from '@google-cloud/firestore';
import fetch from 'node-fetch';

const firestore = new Firestore();

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_SCOPE = process.env.ZOHO_SCOPE || "ZohoProjects.timesheet.ALL";
const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI;
const ZOHO_AUTH_DOMAIN = process.env.ZOHO_AUTH_DOMAIN || "https://accounts.zoho.com";

/**
 * Cloud Run HTTP handler for Zoho OAuth
 */
export async function helloHttp(req, res) {
  try {
    const path = req.path.toLowerCase();

    // -----------------------------
    // Step 1: Redirect user to Zoho OAuth
    // -----------------------------
    if (path === '/zohoauth') {
      const email = req.query.email;
      if (!email) return res.status(400).send("Missing 'email' query param.");

      const state = Buffer.from(email).toString('base64');
      const authUrl = `${ZOHO_AUTH_DOMAIN}/oauth/v2/auth?scope=${encodeURIComponent(
        ZOHO_SCOPE
      )}&client_id=${ZOHO_CLIENT_ID}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(
        ZOHO_REDIRECT_URI
      )}&state=${state}&prompt=consent`;

      console.log(`[Zoho OAuth] Redirecting user ${email} to Zoho`);
      return res.redirect(authUrl);
    }

    // -----------------------------
    // Step 2: Zoho OAuth Callback
    // -----------------------------
    if (path === '/zoho/callback') {
      const { code, state } = req.query;
      if (!code || !state) return res.status(400).send("Missing code or state.");

      const userEmail = Buffer.from(state, 'base64').toString().trim().toLowerCase();

      // Exchange code for tokens
      const tokenUrl = `${ZOHO_AUTH_DOMAIN}/oauth/v2/token`;
      const params = new URLSearchParams({
        code,
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        redirect_uri: ZOHO_REDIRECT_URI,
        grant_type: 'authorization_code',
      });

      const tokenResp = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });

      const tokenData = await tokenResp.json();
      if (!tokenData.access_token) {
        console.error('[Zoho OAuth] No access_token returned', tokenData);
        return res.status(500).send("<h3>Zoho authentication failed.</h3>");
      }

      // Store tokens in Firestore
      await firestore.collection('zoho_tokens').doc(userEmail).set({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        api_domain: tokenData.api_domain,
        time: new Date().toISOString(),
      });

      console.log(`[Zoho OAuth] Successfully stored tokens for ${userEmail}`);
      return res.send(
        `<h3>✅ Zoho successfully connected!</h3><div>You may close this page and return to chat.</div>`
      );
    }

    // -----------------------------
    // Default handler: unknown path
    // -----------------------------
    res.status(404).send("Endpoint not found.");
  } catch (err) {
    console.error('[standyOAuth] Error', err);
    res.status(500).send("<h3>Internal Server Error</h3>");
  }
}
