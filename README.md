# DEMOCaptchaAntiSpam
Serverless Telegram bot on Google infrastructure using [Google App Script Telegram Bot Wrapper](https://github.com/nullifye/telegrambotgoogleappscript) .

This bot is developed to fight spammers/userbot in public group. Meant to be used on single public group and self-hosted on your own Google account.

[DEMO](https://t.me/DEMOCaptchaAntiSpam)

### Setup
  1. Go to [script.google.com/start](https://script.google.com/start) to open the script editor.
  1. Delete any code in the script editor and paste in the code.
  1. Create two (2) new Google Spreadsheets and DO NOT change anything in there.
  1. Replace the constants _tgBotToken_, _botSheet_, _loggerSheet_ (line 1-3) with your own.
  1. Click on the menu item **Libraries** and add [BetterLog](https://github.com/0pete/BetterLog) script ID `1DSyxam1ceq72bMHsE6aOVeOl94X78WCwiYPytKi7chlg4x5GqiNXSw0l`
  1. Choose a version in the dropdown box (usually best to pick the latest version).
  1. Add our core library **Nahfar** script ID `1dPQyiqL_uRGhDvZtgDOEf-RoDdgMtZx6KjfBf-Zzty3HtXp9TuctHET6`
  1. Choose a version in the dropdown box (usually best to pick the latest version).
  1. Save your new script.
  1. Click **Deploy** and select **New Deployment**.
  1. Select Type as **Web app**.
  1. Under execute the app as (**Execute as**), select your account.
  1. Under **Who has access** to the app, select **Anyone**.
  1. Click Deploy.
  1. Copy the URL labeled **Web app URL**.
  1. Replace the constant _webAppURL_ in the script (need to do this on every new deploy).
  1. Replace the constant _botHandlerName_ in the script with your own bot handler.
  1. Run _setWebHook_ function (need to do this on every new deploy).
  1. Run _oneTimeSetup_ function (only do this once).
  1. Run _scheduler_ function (only do this once).
  1. Now your Telegram bot is up and running.


### Current bot commands
  - /start payload
  - /whoami


### Quota for the Google Apps Script
| Feature | Consumer and G Suite free edition (legacy) | Google Workspace accounts |
|:--------|--------:|--------:|
| Script runtime | 6 min / execution | 6 min / execution |
| Custom function runtime | 30 sec / execution | 30 sec / execution |
| Simultaneous executions | 30 | 30 |
| Triggers | 20 / user / script | 20 / user / script |
| Triggers total runtime	| 90 min / day |	6 hr / day |
| URL Fetch calls | 20,000 / day | 100,000 / day |
| URL Fetch response size | 50 MB / call | 50 MB / call |
| URL Fetch headers | 100 / call | 100 / call |
| URL Fetch headers size | 8 KB / call | 8 KB / call |
| URL Fetch POST size | 50 MB / call | 50 MB / call |
| URL Fetch URL length | 2 KB / call | 2 KB / call |
| Properties read/write	| 50,000 / day |	500,000 / day |

Source: [Quotas for Google Services](https://developers.google.com/apps-script/guides/services/quotas)
