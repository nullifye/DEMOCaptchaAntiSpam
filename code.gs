const tgBotToken = 'Your-Telegram-Bot-Token-Goes-Here';
const botSheet   = 'Your-Bot-Sheet-ID-Goes-Here';
const loggerSheet= 'Your-Logger-Sheet-ID-Goes-Here';
const webAppURL  = 'Your-Web-App-URL';

const botHandlerName = 'Your-Telegram-Bot-Handler-Name';
const timeLimitInSec = 20;
const bannedInSec    = 60;
const botMsgInterval = 180;
// delete service message
const deleteSMJoin   = true;
const deleteSMLeft   = true;

const deleteForward  = true;
// delete these type of message
const deleteGIF      = true;
const deleteGame     = true;
const deleteSticker  = false;
const deletePhoto    = true;
const deleteDocument = true;
const deleteMap      = true;
const deleteAudio    = true;
const deleteVoice    = true;
const deletePoll     = true;
const deleteContact  = true;
const deleteVideo    = true;
const deleteRoundVideo = true;

const removeFromGroup= false;


// https://github.com/peterherrmann/BetterLog
let Logger = BetterLog.useSpreadsheet(loggerSheet);

let Bot = Nahfar.createBot(tgBotToken, botSheet);

const fancynumber = ['0̷','1̶', '2͓̽', '3̷', '4͆', '5͓̽', '6̶', '7͓̽', '8̷', '͓9͓̽'];

let theSSA = SpreadsheetApp.openById(botSheet);
let activeSheet = theSSA.getSheetByName('tmp');


function setWebHook() {
  let payload = {
    url: webAppURL
  };

  let response = Bot.request('setWebhook', payload);
  Logger.log(JSON.stringify(response));
}

function oneTimeSetup() {
  const sheetNames = {
    'tmp': ["UserID", "GroupID", "MessageID", "Answers", "DateTime"]
  };

  for(const key in sheetNames) {
    let activeSheet = theSSA.getSheetByName(key);

    if(activeSheet == null) {
      activeSheet = theSSA.insertSheet().setName(key);
      activeSheet.appendRow(sheetNames[key]);
    }

    Bot.removeEmptyColumns_(key);
    activeSheet.setFrozenRows(1);    
    activeSheet.getRange(1, 1, 1, activeSheet.getLastColumn()).setFontWeight("bold");
  }
}

function deleteMessageInChat_(chatID, messageID) {
  let options = {
    'chat_id': chatID,
    'message_id': messageID
  };

  Bot.request('deleteMessage', options);
}

function removeFromGroup_(chatID, userID) {
  if(removeFromGroup) {
    let options = {
      'chat_id': chatID,
      'user_id': userID,
      'until_date': Math.floor(new Date().getTime()/1000.0) + bannedInSec
    };

    Bot.request('banChatMember', options);
  }
}

function scheduleClearTmp_() {
  let epochNow = Math.floor(new Date().getTime()/1000.0);

  let range   = activeSheet.getDataRange();
  let numRows = range.getNumRows();
  let values  = range.getValues();

  let rem     = 'X';

  let rowsDeleted = 0;
  for (let i = 0; i <= numRows - 1; i++) {
    var row = values[i];

    let epochStart = Math.floor(new Date(row[4]).getTime()/1000.0);

    if (row[0] == rem) {
      activeSheet.deleteRow((parseInt(i)+1) - rowsDeleted);
      rowsDeleted++;
    }
    else if (epochNow - epochStart > timeLimitInSec) {
      // remove from group
      this.removeFromGroup_(row[1], row[0]);

      activeSheet.deleteRow((parseInt(i)+1) - rowsDeleted);
      rowsDeleted++;
    }
  }
}

function scheduler() {
  ScriptApp.newTrigger('scheduleClearTmp_').timeBased().everyMinutes(30).inTimezone("Asia/Kuala_Lumpur").create();
}

function randomNumber_() {
  let rand = (Math.floor(1000000 + Math.random() * 9000000)).toString().substring(1);

  let fancy = fancynumber[rand[0]] +
              fancynumber[rand[1]] +
              fancynumber[rand[2]] +
              fancynumber[rand[3]] +
              fancynumber[rand[4]] +
              fancynumber[rand[5]];

  return {rand, fancy};
}

function postInstructionAndPinnedIt_(key1, key2, chatID) {
  //send message
  let btn = {
    'reply_markup': {
      'inline_keyboard': [
        [ 
          { 'text': 'CAPTCHA', 'url': 'https://t.me/' + botHandlerName + '?start=' + chatID }
        ]
      ]
    }
  };

  let msg = "Anda yang baru menyertai grup perlu selesaikan _captcha_ sebelum *dinyahsenyapkan*.";

  let resultMsg = Bot.sendMessage(msg, btn);

  let tmp = {};
      tmp[key1] = new Date();
      tmp[key2] = resultMsg.result.message_id;
  this.setSProperties_(tmp);

  // pin message
  let options = {
    'chat_id': chatID,
    'message_id': resultMsg.result.message_id,
    'disable_notification': true
  };

  Bot.request('pinChatMessage', options);
}

function getSProperties_() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    return scriptProperties.getProperties();
  } catch (err) {
    Logger.log('Failed get property with error %s', err.message);

    return null;
  }
}

function setSProperties_(obj) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
          scriptProperties.setProperties(obj);
  } catch (err) {
    Logger.log('Failed set properties with error %s', err.message);
  }
}


function doGet(e) {

}


let TelegramJSON;

function doPost(e) {
  if(e.postData.type == "application/json") {
    TelegramJSON = JSON.parse(e.postData.contents);
    Bot.getUpdate(TelegramJSON);

    //Logger.log(JSON.stringify(TelegramJSON));

    if(Bot.isNewChatMember()) {

      let options = {
        'chat_id': Bot.getChatID(),
        'user_id': Bot.getUserID(),
        'permissions': {
          'can_send_messages': false
        }
      };

      Bot.request('restrictChatMember', options);

      // checking properties for the last bot message in the group
      const key1 = Bot.getChatID()+'_LAST_DATETIME';
      const key2 = Bot.getChatID()+'_LAST_MSG_ID';

      let data = this.getSProperties_();
      let lastSentAt = data[key1];

      if(!lastSentAt) {
        this.postInstructionAndPinnedIt_(key1, key2, Bot.getChatID());

      }
      else {
        let epochNow  = Math.floor(new Date().getTime()/1000.0);
        let epochSend = Math.floor(new Date(lastSentAt).getTime()/1000.0);

        if(epochNow - epochSend > botMsgInterval) {
          this.postInstructionAndPinnedIt_(key1, key2, Bot.getChatID());

          //delete last message
          let lastMsgId = data[key2];
          this.deleteMessageInChat_(Bot.getChatID(), lastMsgId);

        }
      }

      activeSheet.appendRow([Bot.getUserID(), Bot.getChatID(), '', '', new Date()]);

      // delete service message
      if(deleteSMJoin) {
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }

    }

    else if(Bot.isLeftChatMember()) {

      // delete service message
      if(deleteSMLeft) {
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }

    }

    else if(Bot.isPinnedMessage()) {

      // delete service message
      if(TelegramJSON.message.pinned_message.from.username == botHandlerName) {
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }

    }

    else if(Bot.isForwarded()) {

      // delete forwarded message
      if(deleteForward) {
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }

    }

    // command message
    else if(Bot.isBotCommand()) {
      let text  = Bot.getTextMessage();
      let split = text.split(/[\s_]+/i);

      if(split.length == 2 && split[0] == '/start' && split[1]) {

        let a = activeSheet.getRange(2, 1, activeSheet.getLastRow(), activeSheet.getLastColumn()).getValues();
        let b = a.find(x => x[0] == Bot.getUserID() && x[1] == split[1]);

        let epochNow   = Math.floor(new Date().getTime()/1000.0);
        let epochStart = Math.floor(new Date(b[4]).getTime()/1000.0);

        // check if already exists 
        if(b && b[3] != '') {
          let msg = "Selesaikan _captcha_ yang telah dihantar sebelum ini (" + (epochNow-epochStart) + " saat yang lalu).";
          Bot.sendMessage(msg);
        }
        else if(b) {
          let generate = this.randomNumber_();

          let c = a.findIndex(x => x[0] == Bot.getUserID() && x[1] == split[1]);

          activeSheet.getRange(c + 2, 4, 1, 2).setValues([["'"+generate.rand, new Date()]]);

          let msg = "Selesaikan _captcha_ supaya anda *dinyahsenyap*.\n\n" +
                    "`" + generate.fancy + "`\n\n" +
                    "Tulis semula nombor di atas dalam masa *" + timeLimitInSec + " saat* dari sekarang.";

          Bot.sendMessage(msg);

        }
      }
      else if(new RegExp('\/whoami(@' + botHandlerName + ')?', 'i').test(text)) {
        let msg = "`ID        :` `" + Bot.getUserID() + "`\n" +
                  "`Username  :` " + Bot.getUsername() + "\n" +
                  "`First Name:` " + Bot.getUserFirstName() + "\n" +
                  "`Last Name :` " + Bot.getUserLastName() + "\n" +
                  "`Language  :` " + (TelegramJSON.message.from.language_code || '') + "\n" +
                  "`Is bot    :` " + TelegramJSON.message.from.is_bot;

        Bot.sendMessage(msg);
      }
    }

    // text message in PM
    else if(Bot.isChatType('private') && Bot.isTextMessage()) {
      let text = Bot.getTextMessage();

      // check if already exists
      let a = activeSheet.getRange(2, 1, activeSheet.getLastRow(), activeSheet.getLastColumn()).getValues();
      let b = a.find(x => x[0] == Bot.getUserID());

      if(b) {
        let epochNow   = Math.floor(new Date().getTime()/1000.0);
        let epochStart = Math.floor(new Date(b[4]).getTime()/1000.0);

        // expired
        if(epochNow - epochStart > timeLimitInSec) {
          Bot.sendMessage('Maaf, masa untuk menyelesaikan _captcha_ telah tamat (melebihi ' + timeLimitInSec + ' saat). Anda akan dikeluarkan dari group.');

          // remove from group
          this.removeFromGroup_(b[1], b[0]);

          let c = a.findIndex(x => x[0] == Bot.getUserID());

          activeSheet.getRange(c + 2, 1).setValue('X');
        }
        else {
          // captcha betul
          if(b[3] == text) {

            // remove restriction
            let options = {
              'chat_id': b[1],
              'user_id': b[0],
              'permissions': {
                'can_send_messages': true,
                'can_send_media_messages': true,
                'can_send_polls': true,
                'can_send_other_messages': true
              }
            };

            Bot.request('restrictChatMember', options);

            Bot.sendMessage('*Tahniah!* Anda telah *dinyahsenyap* dalam grup. Gunakan grup ini untuk manfaat bersama.');

            let c = a.findIndex(x => x[0] == Bot.getUserID());

            activeSheet.getRange(c + 2, 1).setValue('X');

          }
          else {
            Bot.sendMessage('Maaf, _captcha_ tidak tepat. Cuba lagi. Anda hanya ada *' + (timeLimitInSec - (epochNow - epochStart)) + ' saat* sahaja.');
          }
        }
      }
      // tidak wujud
      else {
        Bot.sendMessage('Maaf, maklumat anda tidak ditemui. Berkemungkinan anda telah dinyahsenyap dalam grup atau masa untuk menyelesaikan _captcha_ telah tamat atau anda memang telah dikeluarkan dari group.');
      }
    }

    // message in supergroup
    else if(Bot.isChatType('supergroup') && !Bot.isTextMessage()) {
      // checking message for deletion
      if(Bot.isGIF() && deleteGIF) {
        // delete bot message in group
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }
      else if(Bot.isGame() && deleteGame) {
        // delete bot message in group
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }
      else if(Bot.isSticker() && deleteSticker) {
        // delete bot message in group
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }
      else if(Bot.isPhoto() && deletePhoto) {
        // delete bot message in group
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }
      else if(Bot.isDocument() && deleteDocument) {
        // delete bot message in group
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }
      else if(Bot.isMap() && deleteMap) {
        // delete bot message in group
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }
      else if(Bot.isAudio() && deleteAudio) {
        // delete bot message in group
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }
      else if(Bot.isVoice() && deleteVoice) {
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }
      else if(Bot.isPoll() && deletePoll) {
        // delete bot message in group
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }
      else if(Bot.isContact() && deleteContact) {
        // delete bot message in group
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }
      else if(Bot.isVideo() && deleteVideo) {
        // delete bot message in group
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }
      else if(Bot.isRoundVideo() && deleteRoundVideo) {
        // delete bot message in group
        this.deleteMessageInChat_(Bot.getChatID(), TelegramJSON.message.message_id);
      }

    }
  }
}
