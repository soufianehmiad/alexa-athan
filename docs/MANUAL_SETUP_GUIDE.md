# Manual Setup Guide -- Athan for Alexa

This guide walks you through every manual step required to get Athan for Alexa running end-to-end. Complete these steps in order. Each step builds on the previous one.

---

## Prerequisites Checklist

Before starting, make sure you have all of the following:

- [ ] **Amazon Developer Account** (free) -- [Sign up here](https://developer.amazon.com/)
- [ ] **Apple Developer Account** -- Required for running on a physical iPhone (free account works for personal device testing; paid $99/year account required for App Store distribution)
- [ ] **macOS with Xcode 15+** installed (download from Mac App Store)
- [ ] **Node.js 18+** and **npm** -- Verify with `node --version` and `npm --version`
- [ ] **AWS CLI** installed and configured with credentials -- Verify with `aws sts get-caller-identity`
- [ ] **Serverless Framework v3** installed globally -- `npm install -g serverless`
- [ ] **An Amazon Echo device** (any model) registered to the same Amazon account you will use for the developer console
- [ ] **A physical iPhone** running iOS 17+ (simulator works for UI testing but cannot test Alexa integration)

**AWS IAM Permissions Required:**

Your AWS CLI user/role needs at minimum:
- Lambda: CreateFunction, UpdateFunctionCode, InvokeFunction
- API Gateway: full access
- DynamoDB: CreateTable, PutItem, GetItem, Scan, DeleteItem, Query, UpdateItem
- CloudWatch Logs: CreateLogGroup, PutLogEvents
- CloudWatch Events: PutRule, PutTargets
- IAM: CreateRole, AttachRolePolicy, PassRole (for Serverless to create Lambda execution roles)

If you have `AdministratorAccess`, all of the above are covered.

---

## Step 1: Create Login with Amazon (LWA) Credentials

Login with Amazon (LWA) provides the OAuth flow that lets users link their Amazon account in the iOS app to discover and control their Alexa devices.

### 1.1 Create a Security Profile

1. Go to the [Login with Amazon Console](https://developer.amazon.com/loginwithamazon/console/site/lwa/overview.html).
2. Click **Create a New Security Profile**.
3. Fill in the fields:
   - **Security Profile Name:** `Athan for Alexa`
   - **Security Profile Description:** `Privacy-first prayer time reminders for Alexa`
   - **Consent Privacy Notice URL:** Your privacy policy URL. For development, you can use a placeholder like `https://github.com/YOUR_USERNAME/alexa-athan/blob/main/PRIVACY.md`
4. Click **Save**.

### 1.2 Get Client Credentials

5. After creation, find your new profile in the list.
6. Hover over the **gear icon** on the right side and select **Web Settings**.
7. Click **Show Client ID and Client Secret**.
8. **Copy both values** -- you will need them in Step 2.

The Client ID looks like: `amzn1.application-oa2-client.XXXXXXXXXXXXXXXXXXXX`

### 1.3 Configure Allowed URLs

9. Still on the Web Settings page, click **Edit**.
10. Under **Allowed Origins**, add:
    ```
    http://localhost:3000
    ```
11. Under **Allowed Return URLs**, add the iOS app's custom URL scheme callback:
    ```
    athanforalexa://auth
    ```
12. Click **Save**.

> **Note:** The `athanforalexa://` scheme is defined in the iOS app's `Info.plist` at `ios-app/AthanForAlexa/Info.plist`. If you change it there, update the return URL here to match.

### 1.4 Configure iOS Settings (for LWA SDK)

13. Go back to the Security Profile list and hover over the gear icon again.
14. Select **iOS Settings**.
15. Add a new entry:
    - **API Key Name:** `Athan iOS Dev`
    - **Bundle ID:** The bundle identifier you will use in Xcode (e.g., `com.yourname.AthanForAlexa`)
16. Click **Generate New Key** and save the API key value.

---

## Step 2: Set Up Environment Variables

### 2.1 Create the .env File

```bash
cd backend
cp .env.example .env
```

### 2.2 Generate an Encryption Key

The encryption key is used for AES-256-GCM encryption of LWA refresh tokens stored in DynamoDB. Generate a cryptographically secure key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This outputs a 64-character hex string. Copy it.

### 2.3 Fill In Environment Variables

Open `backend/.env` and fill in all three values:

```env
# Encryption key for LWA tokens (the 64-char hex string you just generated)
ENCRYPTION_KEY=paste_your_generated_key_here

# Login with Amazon credentials (from Step 1.2)
LWA_CLIENT_ID=amzn1.application-oa2-client.XXXXXXXXXXXXXXXXXXXX
LWA_CLIENT_SECRET=paste_your_client_secret_here
```

**Important:**
- Never commit the `.env` file to source control. It is already in `.gitignore`.
- For production deployment, use a different encryption key and store it in AWS Secrets Manager or SSM Parameter Store.
- The `LWA_CLIENT_ID` and `LWA_CLIENT_SECRET` must match exactly what the LWA console shows.

---

## Step 3: Deploy the Backend

### 3.1 Install Dependencies

```bash
cd backend
npm install
```

### 3.2 Run Tests

Verify everything works before deploying:

```bash
npm test
```

You should see all 60 tests passing across 9 test suites.

### 3.3 Deploy to AWS

```bash
npx serverless deploy --stage dev
```

This creates:
- **4 Lambda functions:** `syncConfig`, `getDevices`, `health`, `dailyCron`
- **1 API Gateway** with three HTTP endpoints
- **1 DynamoDB table:** `athan-backend-dev`
- **1 CloudWatch cron rule** (fires daily at 02:00 UTC)

### 3.4 Record the Deployment Outputs

After successful deployment, Serverless prints output similar to:

```
Service Information
service: athan-backend
stage: dev
region: us-east-1
stack: athan-backend-dev

endpoints:
  POST - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/api/config
  GET  - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/api/devices
  GET  - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/api/health

functions:
  syncConfig:  athan-backend-dev-syncConfig
  getDevices:  athan-backend-dev-getDevices
  health:      athan-backend-dev-health
  dailyCron:   athan-backend-dev-dailyCron
```

**Save these values -- you will need them:**
- The **API Gateway base URL** (e.g., `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev`)
- The **Lambda function ARNs** -- get the full ARN for the Alexa skill handler:
  ```bash
  aws lambda get-function --function-name athan-backend-dev-syncConfig --query 'Configuration.FunctionArn' --output text
  ```

### 3.5 Verify the Deployment

Test the health endpoint:

```bash
curl https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/api/health
```

You should get a 200 response.

---

## Step 4: Deploy the Alexa Skill Lambda

The Alexa skill has its own Lambda function separate from the backend API.

### 4.1 Install and Build

```bash
cd alexa-skill
npm install
npm run build
```

### 4.2 Run Tests

```bash
npm test
```

You should see all 28 tests passing across 2 test suites.

### 4.3 Deploy the Skill Lambda

The Alexa skill Lambda is deployed separately. You can deploy it manually via AWS CLI or add it to `serverless.yml`. For manual deployment:

1. Package the built code:
   ```bash
   cd alexa-skill
   zip -r alexa-skill.zip dist/ node_modules/ package.json
   ```

2. Create or update the Lambda function:
   ```bash
   aws lambda create-function \
     --function-name athan-alexa-skill \
     --runtime nodejs20.x \
     --handler dist/lambda/index.handler \
     --role arn:aws:iam::YOUR_ACCOUNT_ID:role/athan-alexa-lambda-role \
     --zip-file fileb://alexa-skill.zip \
     --region us-east-1 \
     --timeout 10 \
     --memory-size 256
   ```

3. Note the Lambda ARN from the output (e.g., `arn:aws:lambda:us-east-1:123456789012:function:athan-alexa-skill`).

4. Add an Alexa Skills Kit trigger permission:
   ```bash
   aws lambda add-permission \
     --function-name athan-alexa-skill \
     --statement-id alexa-skill-trigger \
     --action lambda:InvokeFunction \
     --principal alexa-appkit.amazon.com
   ```

---

## Step 5: Create the Alexa Skill in the Developer Console

### 5.1 Create the Skill

1. Go to the [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask).
2. Click **Create Skill**.
3. Configure:
   - **Skill name:** `Athan`
   - **Primary locale:** English (US)
   - **Model:** Custom
   - **Hosting:** Provision your own
4. Click **Create Skill**, then select **Start from Scratch** as the template.

### 5.2 Upload the Interaction Model

5. In the left sidebar, go to **Interaction Model > JSON Editor**.
6. Open the file `alexa-skill/skill-package/interactionModels/custom/en-US.json` from this repository.
7. Paste its full contents into the JSON Editor, replacing whatever is there.
8. Click **Save Model**.
9. Click **Build Model** and wait for completion (1-2 minutes).

The interaction model defines these voice intents:
- `PlayAthanIntent` -- "Alexa, ask Athan to play the athan"
- `GetPrayerTimesIntent` -- "Alexa, ask Athan for prayer times"
- `SetCityIntent` -- "Alexa, tell Athan to set my city to {CityName}"
- Built-in: Help, Stop, Cancel, FallbackIntent

### 5.3 Set the Endpoint

10. In the left sidebar, go to **Endpoint**.
11. Select **AWS Lambda ARN**.
12. In the **Default Region** field, paste the Lambda ARN from Step 4.3:
    ```
    arn:aws:lambda:us-east-1:123456789012:function:athan-alexa-skill
    ```
13. Click **Save Endpoints**.

### 5.4 Enable Permissions

14. In the left sidebar, go to **Permissions**.
15. Toggle on **Reminders** -- this grants the skill `alexa::alerts:reminders:skill:readwrite` permission so it can schedule prayer time reminders.

### 5.5 Enable Interfaces

16. In the left sidebar, go to **Interfaces**.
17. Toggle on **Audio Player** -- this allows the skill to stream Athan audio via the AudioPlayer directive.
18. Click **Save Interfaces**.
19. If prompted, rebuild the model.

### 5.6 Enable Testing

20. Go to the **Test** tab at the top of the console.
21. Change the dropdown from **Off** to **Development**.
22. You can now test in the simulator by typing: `open athan`

> **Important:** The skill in Development mode is only available on Echo devices registered to the **same Amazon account** you used to create the skill. Other accounts cannot see or use it until the skill is published.

---

## Step 6: Build and Run the iOS App in Xcode

### 6.1 Create the Xcode Project

Since there is no `.xcodeproj` file in the repository yet, you need to create one:

1. Open **Xcode**.
2. Go to **File > New > Project**.
3. Choose **iOS > App** and click **Next**.
4. Configure:
   - **Product Name:** `AthanForAlexa`
   - **Team:** Select your Apple Developer team
   - **Organization Identifier:** `com.yourname` (forms the bundle ID `com.yourname.AthanForAlexa`)
   - **Interface:** SwiftUI
   - **Language:** Swift
   - **Storage:** SwiftData
5. Save to a temporary location (e.g., Desktop) and click **Create**.

### 6.2 Replace Generated Files with Project Source

6. In the Xcode project navigator, delete all auto-generated Swift files:
   - `ContentView.swift`
   - `AthanForAlexaApp.swift`
   - `Item.swift` (if present)
   - Move them to Trash when prompted.
7. Drag all files and folders from `ios-app/AthanForAlexa/` (in this repository) into the Xcode project navigator.
   - Make sure **Copy items if needed** is checked.
   - Make sure the **AthanForAlexa** target is selected.
   - Preserve the folder structure (select **Create groups**).

### 6.3 Add the Adhan Swift Package

8. Go to **File > Add Package Dependencies**.
9. In the search field, enter: `https://github.com/batoulapps/adhan-swift`
10. Set the version rule to **Up to Next Major Version** from `2.0.0`.
11. Click **Add Package**.
12. Select the **Adhan** library product and click **Add Package**.

### 6.4 Configure the LWA Client ID

13. Open `ios-app/AthanForAlexa/Services/AmazonAuthService.swift`.
14. Find line 9:
    ```swift
    private let clientId = "amzn1.application-oa2-client.PLACEHOLDER"
    ```
15. Replace `PLACEHOLDER` with your actual LWA Client ID from Step 1.2.

### 6.5 Configure the Backend URL

16. Open `ios-app/AthanForAlexa/Services/AlexaSyncService.swift`.
17. Find line 8:
    ```swift
    private let baseURL = URL(string: "https://api.athanforalexa.com")!
    ```
18. Replace the URL with your API Gateway URL from Step 3.4:
    ```swift
    private let baseURL = URL(string: "https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev")!
    ```

### 6.6 Configure Signing

19. Select the **AthanForAlexa** project in the navigator.
20. Go to the **Signing & Capabilities** tab.
21. Select your **Team**.
22. The **Bundle Identifier** should be `com.yourname.AthanForAlexa` (must match what you entered in the LWA iOS Settings in Step 1.4).
23. Set **Minimum Deployment Target** to **iOS 17.0**.

### 6.7 Verify Info.plist URL Scheme

The custom URL scheme `athanforalexa://` is required for the LWA OAuth callback. Verify it exists:

24. Open `Info.plist` in the project.
25. Confirm the `CFBundleURLSchemes` array contains `athanforalexa`.
26. This should already be set from the source files, but verify after copying.

### 6.8 Build and Run

27. Select your physical iPhone (or a simulator) as the run destination.
28. Press **Cmd+R** to build and run.

> **Troubleshooting build errors:**
> - "No such module 'Adhan'" -- Go to **File > Packages > Resolve Package Versions**.
> - "No such module 'AthanPrayerEngine'" -- The `Package.swift` in `ios-app/` references a local Swift package at `../core-prayer-engine/swift`. For the Xcode project, you use the Adhan package directly instead (Step 6.3).
> - Signing errors -- Make sure you selected a valid Team in Step 6.6.
> - If the build still fails, close Xcode, delete `~/Library/Developer/Xcode/DerivedData/AthanForAlexa-*`, and reopen.

---

## Step 7: End-to-End Testing

This verifies that the iOS app, backend, Alexa skill, and Echo device all work together.

### 7a. iOS App Onboarding

1. Launch the app on your device.
2. Walk through the onboarding flow:
   - **Welcome screen** -- tap Continue.
   - **Location** -- select your city (or enter coordinates manually).
   - **Calculation method** -- choose your preferred method (e.g., ISNA for North America, MWL for Europe, Umm al-Qura for Saudi Arabia).
   - **Madhab** -- select Shafi/Hanbali/Maliki or Hanafi (affects Asr time).
3. The app should display today's five prayer times plus sunrise.
4. Verify the times look reasonable for your location. Cross-reference with a trusted source.

### 7b. Link Your Amazon Account

5. In the app, tap the option to link your Amazon account.
6. A browser sheet opens to Amazon's login page.
7. Sign in with the **same Amazon account** your Echo device is registered to.
8. Grant the requested permissions (device access and reminders).
9. You should be redirected back to the app with a success message.

### 7c. Select Your Echo Device

10. After linking, the app fetches your Alexa devices from the backend.
11. You should see a list of your Echo devices by name.
12. Select the device(s) you want to receive Athan reminders.
13. Optionally toggle individual prayers per device (e.g., disable Fajr on the living room Echo).

### 7d. Sync Configuration

14. After selecting devices, tap the sync/save button.
15. The app sends your configuration (city, method, madhab, offsets, selected devices) to the backend via `POST /api/config`.
16. Confirm you see a success message.

### 7e. Trigger a Reminder Manually

The daily cron fires automatically at 02:00 UTC. To test immediately without waiting:

17. Go to the [AWS Lambda Console](https://console.aws.amazon.com/lambda/).
18. Find the `athan-backend-dev-dailyCron` function.
19. Click the **Test** tab.
20. Create a test event with any name and an empty JSON body: `{}`
21. Click **Test** to invoke it.
22. Check the execution result -- it should succeed.

Alternatively, invoke from the CLI:

```bash
aws lambda invoke \
  --function-name athan-backend-dev-dailyCron \
  --payload '{}' \
  /dev/stdout
```

23. Within a few minutes, your Echo should announce the next prayer time reminder (e.g., "It is time for Dhuhr prayer").

### 7f. Test Voice Commands

24. Say to your Echo: **"Alexa, open Athan"**
    - Expected: The skill greets you and tells you the next prayer time.
25. Say: **"What are today's prayer times?"**
    - Expected: The skill reads all five prayer times for your configured city.
26. Say: **"Play the athan"**
    - Expected: The Athan audio begins playing through the AudioPlayer.
27. Say: **"Alexa, stop"**
    - Expected: Audio stops.

### 7g. Test Prayer Tracking (V1 Feature)

28. Open the app and navigate to the tracking view.
29. Tap a past prayer to mark it as **Prayed**, **Prayed Late**, or **Missed**.
30. Verify the status is saved and persists after closing and reopening the app.
31. Check the weekly grid view to see completion indicators across 7 days.

### 7h. Verify Daily Overview

32. On the main prayer times screen, confirm:
    - The next upcoming prayer is highlighted.
    - A countdown to the next prayer is displayed.
    - Past prayers show their tracking status.

---

## Troubleshooting

### LWA / OAuth Issues

| Problem | Solution |
|---------|----------|
| "Invalid redirect URI" during Amazon login | The callback URL must match exactly. Verify `athanforalexa://auth` is listed under **Allowed Return URLs** in the LWA console (Step 1.3). |
| "Unauthorized client" error | Double-check `LWA_CLIENT_ID` and `LWA_CLIENT_SECRET` in `backend/.env` match the LWA console values. Redeploy the backend after changing `.env`. |
| OAuth flow opens but never returns to the app | Verify the custom URL scheme `athanforalexa` is registered in `Info.plist` under `CFBundleURLSchemes`. |
| "No access token received" error in app | The LWA OAuth response type is set to `token` (implicit flow). Confirm the security profile's Web Settings are saved correctly. |

### Alexa Skill Issues

| Problem | Solution |
|---------|----------|
| "I don't know that skill" when saying "Alexa, open Athan" | (1) Make sure testing is set to **Development** in the Test tab. (2) Ensure your Echo is on the **same Amazon account** as the developer console. (3) Try "Alexa, enable Athan skill" first. |
| Skill responds but reminders never appear | (1) Check that **Reminders** permission is toggled on in the skill's Permissions page. (2) The user must grant reminder access -- the skill should show a permission card on first use. (3) Check CloudWatch logs for the `dailyCron` function for errors. |
| "There was a problem with the requested skill's response" | Check the skill Lambda's CloudWatch logs. Common causes: missing environment variables, incorrect Lambda ARN in the endpoint config, or the Lambda function timing out. |
| Audio does not play when saying "play the athan" | (1) Confirm **Audio Player** is enabled under Interfaces. (2) Audio file URLs must be HTTPS and publicly accessible. (3) Check that audio files are uploaded to S3 and the CloudFront distribution is active. |
| Skill works in simulator but not on Echo | The simulator bypasses some permission checks. Ensure your Echo has the skill enabled. Try saying "Alexa, enable Athan". |

### iOS App Issues

| Problem | Solution |
|---------|----------|
| Build fails with "No such module 'Adhan'" | Go to **File > Packages > Resolve Package Versions**. If that fails, close Xcode, delete `~/Library/Developer/Xcode/DerivedData/`, and reopen. |
| Build fails with "No such module 'AthanPrayerEngine'" | The `Package.swift` references a local package. In Xcode, you should use the remote Adhan package instead (Step 6.3). Remove any local package reference. |
| App crashes on launch | Check the Xcode console. Common causes: missing `Info.plist` entries, `ModelContainer` initialization failure (check the SwiftData schema in `AthanApp.swift`). |
| Location not working in simulator | In the simulator menu, go to **Features > Location** and select a city or enter custom coordinates. |
| Prayer times seem wrong | (1) Verify the calculation method -- different methods produce times that can vary by 5-15 minutes. (2) Check the coordinates are correct for your city. (3) Manual offsets may be applied. |
| Cannot run on physical device | You need a paid Apple Developer account or a free account with the device registered. Go to **Signing & Capabilities** and ensure your Team is selected. |
| "athanforalexa" URL scheme not working | Verify `Info.plist` has the `CFBundleURLTypes` entry with `CFBundleURLSchemes` containing `athanforalexa`. |

### Backend / Lambda Issues

| Problem | Solution |
|---------|----------|
| `serverless deploy` fails | (1) Verify AWS CLI credentials: `aws sts get-caller-identity`. (2) Check IAM permissions (see Prerequisites). (3) Ensure Serverless Framework v3 is installed: `serverless --version`. |
| Lambda timeout errors | The `dailyCron` function has a 300-second (5-minute) timeout. If processing many users, this may not be enough. Check CloudWatch logs for the execution duration. Increase `timeout` in `serverless.yml` if needed. |
| "ENCRYPTION_KEY is not set" in logs | Verify `backend/.env` contains `ENCRYPTION_KEY` with a valid value. Redeploy: `npx serverless deploy --stage dev`. |
| DynamoDB errors | Verify the table `athan-backend-dev` was created: `aws dynamodb describe-table --table-name athan-backend-dev`. Check that the table name in `serverless.yml` matches what the code expects. |
| Health endpoint returns 500 | Check the Lambda's CloudWatch logs. Likely a misconfiguration in environment variables or IAM permissions. |
| API Gateway returns 403 | CORS may not be configured. Verify `cors: true` is set in `serverless.yml` for each HTTP event. |

### General

| Problem | Solution |
|---------|----------|
| Everything was working but reminders stopped | (1) Check if the DynamoDB record expired (90-day TTL). Open the app and re-sync. (2) The LWA refresh token may have been revoked -- re-link Amazon in the app. (3) Check the `dailyCron` CloudWatch logs for errors. |
| Need to start fresh | Delete the DynamoDB item for your device token, unlink the skill from your Amazon account, and re-run the setup flow in the iOS app. |

---

## Environment Variable Reference

| Variable | Location | Description | How to Get It |
|----------|----------|-------------|---------------|
| `ENCRYPTION_KEY` | `backend/.env` | AES-256-GCM key for encrypting LWA tokens | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `LWA_CLIENT_ID` | `backend/.env` | Login with Amazon OAuth client identifier | LWA Console > Security Profile > Web Settings |
| `LWA_CLIENT_SECRET` | `backend/.env` | Login with Amazon OAuth client secret | LWA Console > Security Profile > Web Settings |
| LWA Client ID (iOS) | `AmazonAuthService.swift` line 9 | Same Client ID, hardcoded in iOS app | Same as `LWA_CLIENT_ID` above |
| Backend URL (iOS) | `AlexaSyncService.swift` line 8 | API Gateway base URL | `serverless deploy` output or AWS Console |

---

## Architecture Quick Reference

```
iOS App  --(HTTPS)-->  API Gateway  -->  Lambda (syncConfig, getDevices, health)
                                                    |
                                               DynamoDB (athan-backend-dev)
                                                    |
CloudWatch Cron (02:00 UTC)  -->  Lambda (dailyCron)
                                       |
                                  Alexa Reminders API  -->  Echo Device
                                                              |
User: "Alexa, open Athan"  -->  Lambda (alexa-skill)  -->  AudioPlayer
```

**Key files:**
- Backend config: `backend/serverless.yml`
- Backend env: `backend/.env`
- Alexa interaction model: `alexa-skill/skill-package/interactionModels/custom/en-US.json`
- Alexa skill manifest: `alexa-skill/skill-package/skill.json`
- iOS entry point: `ios-app/AthanForAlexa/AthanApp.swift`
- iOS OAuth: `ios-app/AthanForAlexa/Services/AmazonAuthService.swift`
- iOS backend client: `ios-app/AthanForAlexa/Services/AlexaSyncService.swift`
- iOS URL scheme: `ios-app/AthanForAlexa/Info.plist`

---

## Next Steps

After completing all steps and verifying everything works:

1. **Upload Athan audio to S3** -- Place your audio files in an S3 bucket behind CloudFront. Update the audio URL resolution in `alexa-skill/lambda/services/AudioService.ts`.
2. **Invite beta testers** -- In the Alexa Developer Console, add other Amazon account emails as beta testers so they can enable the skill in Development mode.
3. **Submit for Alexa certification** -- When ready, submit the skill for Amazon's certification review to make it publicly available in the Alexa Skills Store.
4. **Submit iOS app to App Store** -- Configure App Store Connect with screenshots, description, privacy nutrition labels, and submit for Apple review.
5. **Set up monitoring** -- Configure CloudWatch alarms for cron failures, Lambda errors, and API latency as described in `docs/RELEASE_READINESS_REVIEW.md`.
