# Setup guide

How to connect the bot to Instagram, Cloudinary and GitHub. Plan about an hour. Do it before **November 30** so you can test before the first real post (the December roundup, Dec 1 at 14:00 UTC).

Meta changes its dashboard often: if a button has a slightly different name, look for the closest match.

## 1. Instagram account

1. Create the account **@rlesports_simplified**, display name **Rocket League Esports Simplified**.
2. Switch it to a **Business** account. Creator accounts can't publish stories through the API.
   - Settings → *Account type and tools* → *Switch to professional account* → **Business**.
   - Category: for example *Media/news company*. Contact details can be skipped.
3. Keep the account **public**. Meta requires it for API access.
4. Profile picture: run `npm run preview` and upload `out/preview/profile-picture.jpg`.
5. Bio:
   > RLCS made simple 🚀 Upcoming events, big matches & finals, explained for new fans. Unofficial fan account

   Add "· Data: Liquipedia" at the end once Liquipedia data is in use.

## 2. Meta app and Instagram token (Unified Login)

New Meta apps can only use **API setup with Unified login**; the older "Instagram login" setup is closed to new apps. Unified Login needs a **business portfolio**, and the token belongs to that portfolio rather than to your personal account.

1. **Business portfolio:** create one at https://business.facebook.com (free), for example "Rocket League Esports Simplified".
2. **Create the app:** https://developers.facebook.com → **My Apps → Create app**.
   - Use case: **Manage messaging & content on Instagram**.
   - Business portfolio: select the one from step 1. It's required for Unified login.
3. In the app dashboard: **Use cases → Manage messaging & content on Instagram → Customize → API setup with Unified login**.
4. **Configure your app → Create new configuration:**
   - Token type: **System-user access token**.
   - Token expiration: **Never**, if that's offered. Note which options you see either way.
   - Permissions: the bot only needs **`instagram_basic`** and **`instagram_content_publish`**. Untick the others (messaging, comments, ads) if Meta lets you.
   - If it asks for a redirect URL and won't continue without one, stop and tell me: we may need a small one-time login script.
5. **Add the Instagram account as a tester:** click **Add account** and enter @rlesports_simplified. Then accept the invite on Instagram **in a web browser**: Settings → Website permissions → Apps and websites → **Tester invites**.
6. Click **Generate token** and copy it right away: Meta shows it only once.
7. **Give the token's system user access to the Instagram account.** Without this, `npm run check:accounts` says "No Instagram account is assigned to this token".
   - In https://business.facebook.com/settings: **Comptes → Profils Instagram** (Accounts → Instagram profiles) → @rlesports_simplified → **Affecter des personnes** (Assign people).
   - Pick the system user shown on the "token owner" line of `npm run check:accounts` (here named "rlesports_simplified"), with **full access**.
8. Keep the token secret: anyone who has it can post on the account.

The app can stay in **Development mode**: saving the configuration gives Standard Access, which covers accounts that have a role on the app. The test in step 5 below confirms that publishing works.

The system-user token set to **never expire** needs no refresh. To double-check, paste it into Meta's [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/): "Expires" should say **Never**. If it ever leaks, revoke it from the app's Unified login configuration and generate a new one.

## 3. Cloudinary

1. Sign up for the free plan at https://cloudinary.com.
2. In the console: **Settings → API Keys** (or the dashboard home), copy the **API environment variable**. It looks like `cloudinary://123456789:abcdef...@your-cloud-name`.

## 4. GitHub secrets

In the repository: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Value |
|---|---|
| `IG_ACCESS_TOKEN` | the Instagram token from step 2 |
| `CLOUDINARY_URL` | the Cloudinary variable from step 3 (the whole `cloudinary://...` string) |
| `IG_USER_ID` | recommended: the Instagram account ID shown by `npm run check:accounts` (`17841437558281125`). The bot then skips looking the account up, which Meta sometimes answers wrongly |
| `IG_USERNAME` | optional: `rlesports_simplified`, only needed if the token sees several Instagram accounts and `IG_USER_ID` isn't set |

## 5. Test

**On your computer** (from the project folder):

```sh
export IG_ACCESS_TOKEN='...'
export CLOUDINARY_URL='cloudinary://...'
npm run check:accounts
```

Both lines should show ✔ with your username and Cloudinary cloud name. If the token sees several Instagram accounts, also `export IG_USERNAME=rlesports_simplified`. Then publish the welcome carousel and the welcome story, the first real publishing tests. The carousel is the first feed post, so it checks that path before the first scheduled one (the Dec 1 roundup); pin it to the profile afterwards (⋯ → Pin to your profile). On Instagram, check that the carousel shows its 3 slides with the caption. After both, Cloudinary's Media Library should be empty: the bot deletes each image once Instagram has it.

```sh
npm run check:accounts -- --publish-welcome-post
npm run check:accounts -- --publish-welcome-story
```

Open Instagram: the story should be there.

**On GitHub**, after pushing:
1. **Actions → Post → Run workflow**, keep **Dry run** checked. The run should succeed. Nothing is due before Dec 1, so it finds 0 posts; that's expected.
2. **Actions → Keep alive → Run workflow**. It should succeed (and do nothing while the repo has recent commits).

## 6. Running it

There's nothing to start: once pushed, the **Post** workflow runs every 15 minutes and **Keep alive** twice a month.

- **When something fails**, GitHub emails you. Open the failed run in **Actions** to see the error.
- **If the token stops working** (expired, or the account was moved out of the business portfolio), generate a new one as in step 2 and replace the `IG_ACCESS_TOKEN` secret.
- **New events** go in `data/seasons/rlcs-2027.yml`. Run `npm run data:check` after editing, then commit and push.
- **To pause the bot**, go to Actions → Post → ⋯ → **Disable workflow**.
