# discord-status-webhook
Webhook monitoring discord API status updates

## How to setup
1. Clone the repository onto your local system
2. Generate a webhook in the channel you woule like it to send notifications to. Copy the webhook url. (DO NOT SHARE THIS URL)
3. Get the webhook id and token from the url. The format of the url should be is https://discord.com/api/webhooks/WEBHOOKID/WEBHOOKTOKEN
4. Rename `.env.example` to `.env` and fill in the variables
5. Make sure you have npm and node installed. If not, go to https://nodejs.org/en/
6. Run `npm install` to get all dependencies
7. To start it, do `npm run build; npm start`
