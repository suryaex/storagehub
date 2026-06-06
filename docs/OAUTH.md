# StorageHub — Real OAuth Login Setup

StorageHub supports **real online accounts** via Google, GitHub, Microsoft, and
generic OIDC. Once you add a provider's credentials, its button appears on the login
screen automatically and the local dev login can be turned off.

The OAuth **callback URL** for every provider is:

```
<BACKEND_URL>/api/v1/auth/callback/<provider>
```

Where `<BACKEND_URL>` is what you set in `.env` (e.g. `http://192.168.1.50` on a LAN,
or `https://storage.example.com` in production). `<provider>` is one of:
`google`, `github`, `microsoft`, `oidc`.

---

## GitHub

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. **Homepage URL:** `https://storage.example.com`
3. **Authorization callback URL:**
   `https://storage.example.com/api/v1/auth/callback/github`
4. Copy the **Client ID** and generate a **Client secret**, then in `.env`:
   ```env
   GITHUB_CLIENT_ID=Iv1xxxxxxxx
   GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxx
   ```

## Google

1. Google Cloud Console → **APIs & Services → Credentials → Create OAuth client ID**
   (type: **Web application**).
2. **Authorized redirect URI:**
   `https://storage.example.com/api/v1/auth/callback/google`
3. In `.env`:
   ```env
   GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxxxxxx
   ```

## Microsoft

1. Entra ID (Azure AD) → **App registrations → New registration**.
2. **Redirect URI (Web):**
   `https://storage.example.com/api/v1/auth/callback/microsoft`
3. Create a **client secret**, then in `.env`:
   ```env
   MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx
   MICROSOFT_CLIENT_SECRET=xxxxxxxx
   MICROSOFT_TENANT=common
   ```

## Generic OIDC (Keycloak, Authentik, Authelia, …)

```env
OIDC_CLIENT_ID=storagehub
OIDC_CLIENT_SECRET=xxxxxxxx
OIDC_DISCOVERY_URL=https://idp.example.com/.well-known/openid-configuration
```
Redirect URI: `https://storage.example.com/api/v1/auth/callback/oidc`

---

## Apply & harden

```bash
# after editing .env
./install.sh --rebuild        # Docker     (.\install.ps1 -Rebuild on Windows)
# or, bare-metal:
sudo systemctl restart storagehub-backend
```

For production, disable the passwordless dev login so only OAuth works:

```env
ALLOW_LOCAL_LOGIN=false
```

**Notes**
- The **first user** to log in (any method) becomes **admin**.
- A user is matched by `provider + subject`, falling back to email — so the same
  person can link Google and GitHub to one account if the email matches.
- Always use **HTTPS** in production (providers require it for non-localhost).
