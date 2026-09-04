# About

A webhook project polling for statuspage updates and mirroring them in a discord channel.

# Get Going

Rerequisite: Make sure node.js is available on your system.

1. Clone the repository to make a local copy.
2. Make a copy of `.env.example` and name it `.env`.
3. Create a webhook in the Discord channel you want to publish the updates to.
4. Fill in `.env`. Discord webhooks have the following format: `/webhooks/{webhook.id}/{webhook.token}`.
5. Install dependencies: `npm install`
6. Build the project: `npm build`
7. Run the app `npm start`

> [!NOTE]
> The initial backfill will be quite spammy. Make sure you are ready and the webhook is where you want it to be!

