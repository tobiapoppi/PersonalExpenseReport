/**
 * edit by:
 * @author Tobia Poppi
 * @year 2024
 * @repository https://github.com/tobiapoppi/PersonalExpenseReport
 * @version 1.0.1

 * original file is from:
 * @author Davide Garino
 * @year 2022
 * @email davidegarino@libero.it
 * @repository https://github.com/R3D4NG3L/PersonalExpenseReport
 * @version 1.0.1
*/




// ---------------------------------------------------------------------------------------------------
// Script initialization - User must compile this part with own tokens
// ---------------------------------------------------------------------------------------------------
/**
 * @var token
 * @brief 1. Fill with your own Telegram Bot Token Id
 *        (e.g. 521xxxx7165:AAHxxxxxxxxjbHr5l-m8rGxxxxxxwbk)
 */
var token = "";
/**
 * @var webAppUrl
 * @brief 2. Fill with your google web app address
 *        (e.g. https://script.google.com/macros/s/AKfycbXXXXLHeAY-07_A2dmXftSX0JNR8gTxxxEQmzo2j2aWmItIuSsFSYzlB1bJNw0Dovd3qw/exec)
 */
var webAppUrl = "";
/**
 * @var ssId
 * @brief 3. Fill with Google Spreadsheet Id
 *        (e.g. 1f_IT_kAFIG0TUOZyXXXXW67fxvdxxxxaw6gbAbtxzEo)
 */
var ssId = "";
/**
 * @var locale
 * @brief 4. Set your locale for date time parsing
 *           e.g. it-IT
 *           e.g. en-US
 */
var locale = "";
/**
 * @var timeZone
 * @brief 5. Set your timezone for proper date formatting
 *           e.g. "Europe/Rome"
 *           e.g. "America/New_York"
 */
var timeZone = "";
/**
 * @var currency
 * @brief 6. Set your currency
 *           e.g. "$"
 *           e.g. "€"
 */
var currency = "";
/**
 * @var adminID
 * @brief 7. Admin Telegram Chat Id. 
 *           Used to debug in case of problems, error will be sent as a telegram message
 *           to the chat here mentioned.
 *           (e.g. 875276202)
 */
var adminID = "";   // 4. Fill in your own Telegram ID for debugging
// ---------------------------------------------------------------------------------------------------
// Script initialization finish
// ---------------------------------------------------------------------------------------------------

var month_names = { 0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun", 6: "Jul", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec" };

/**
* @var telegramUrl
* @brief Telegram Bot Url
*/
var telegramUrl = "https://api.telegram.org/bot" + token;

/*!
 * @fn getMe
 * @brief Get Telegram Bot
*/
function getMe() {
  var url = telegramUrl + "/getMe";
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

/*!
 * @fn setWebhook
 * @brief Set Telegram Webhook
*/
function setWebhook() {
  var url = telegramUrl + "/setWebhook?url=" + webAppUrl;
  var response = UrlFetchApp.fetch(url);
}

/*!
 * @fn sendText
 * @brief Send Text to Telegram Chat
*/
function sendText(chatId, text, keyBoard) {
  var data = {
    method: "post",
    payload: {
      method: "sendMessage",
      chat_id: String(chatId),
      text: text,
      parse_mode: "HTML",
      reply_markup: JSON.stringify(keyBoard)
    }
  };
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/', data);
}

/**
 * @fn deleteMessage
 * @param {*} chatId 
 * @param {*} messageId 
 */
function deleteMessage(chatId, messageId) {
  var data = {
    method: "post",
    payload: {
      method: "deleteMessage",
      chat_id: String(chatId),
      message_id: String(messageId)
    }
  };
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/', data);
}


/*!
 * @fn doGet
 * @brief HTML Web Service Page
*/
function doGet(e) {
  return HtmlService.createHtmlOutput("<img src='https://i.kym-cdn.com/photos/images/facebook/001/005/935/ef1.jpg'>");
}

/**
 * @fn debugMessage
 * @param {*} e 
 */
function debugMessage(e) {
  // Debug
  var data = JSON.parse(e.postData.contents);
  if (data.callback_query) {
    var id = data.callback_query.from.id;
    sendText(id, "<pre>" + JSON.stringify(e.postData.contents) + "</pre>");
  }
  else {
    var id = data.message.chat.id;
    sendText(id, "<pre>" + JSON.stringify(e.postData.contents) + "</pre>");
  }
  // End of Debug
}

/**
 * @fn logMessage
 * @param {@} e: Telegram Message
 */
function logMessage(e) {
  // Log Message
  var data = e.postData.contents;

  // Google Sheet
  var googleSheet = SpreadsheetApp.openById(ssId);
  var telegramLog = googleSheet.getSheetByName("Logs");
  var lr = telegramLog.getDataRange().getLastRow();
  telegramLog.getRange(lr + 1, 1).setValue(data);
}

/**
 * @fn clearLogs
 * @param {*} e
 */
function clearLogs() {
  // Google Sheet
  var googleSheet = SpreadsheetApp.openById(ssId);
  var telegramLog = googleSheet.getSheetByName("Logs");
  var lr = telegramLog.getDataRange().getLastRow();
  for (var i = 2; i < lr + 1; i++)
    telegramLog.getRange(i, 1).clearContent();
}

/**
 * @fn isNumber
 * @brief Checks if a value is a valid number
*/
function isNumber(n) {
  'use strict';
  n = n.replace(/\./g, '').replace(',', '.');
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * @fn sendTotalExpensesList
 * @param {@} id ID of telegram user that asked for the service
 */
function sendTotalExpensesList(id) {
  // Google Sheet
  var expenseSheet = SpreadsheetApp.openById(ssId);

  var expenses = [];
  var dashboardSheet = expenseSheet.getSheetByName("Expenses Short");
  //  var lr = dashboardSheet.getDataRange().getLastRow();
  // modify lr to be the index of row which has value "None" in the first column
  var lr = dashboardSheet.getRange("A:A").getValues().flat().indexOf("None");
  var total_row = dashboardSheet.getRange("A:A").getValues().flat().indexOf("Total") + 1;

  for (var i = 2; i <= lr; i++) {
    var category = dashboardSheet.getRange(i, 1).getValue();
    var month_index = new Date().getMonth() + 2; //index of month in range [2-13]
    var total = dashboardSheet.getRange(i, month_index).getValue();
    if (total == "")
      continue;
    expenses.push("\n<b>" + category + "</b>:  " + currency + " " + Number(total).toFixed(2));
  }
  var expenseList = expenses.join("\n");
  sendText(id, decodeURI("<b>Here are your total expenses this month (" + month_names[month_index - 2] + "):</b> <span class=\"tg-spoiler\">%0A " + expenseList) + "\n\n--------------------\n" + "<b><u>💵 TOTAL: " + currency + " " + dashboardSheet.getRange(total_row, month_index).getValue() + "</u></b></span>");
  sendMainMenuKeyboard(id);
}

/**
 * @fn sendLast5Expenses
 * @param {@} id ID of telegram user that asked for the service
 */
function sendLast5Expenses(id) {
  // Google Sheet
  var expenseSheet = SpreadsheetApp.openById(ssId);
  var month_index = new Date().getMonth();
  // map of index months to month names (three letters)
  var expenses = [];

  // Log the month index and month name
  Logger.log("Month Index: " + month_index);
  Logger.log("Month Name: " + month_names[month_index]);

  var expensesSheet = expenseSheet.getSheetByName(month_names[month_index]);

  if (!expensesSheet) {
    sendText(id, decodeURI("<b>Sheet not found for month: </b> %0A" + month_names[month_index]));
    return;
  }

  var lr = expensesSheet.getDataRange().getLastRow();

  Logger.log("Last Row: " + lr);
  sendText(id, decodeURI("<b>Asking for sheet named </b> %0A" + month_names[month_index]));

  try {
    var counter = 0;
    for (var i = lr; i > 2; i--) {
      //  date = Date.parse(date);
      //  date = new Date(date).toLocaleDateString(locale, {timeZone: timeZone});
      var description = expensesSheet.getRange(i, 1).getValue();
      var date = expensesSheet.getRange(i, 2).getValue();
      var cost = expensesSheet.getRange(i, 3).getValue();
      var this_currency = expensesSheet.getRange(i, 4).getValue();
      // currency is EUR if no value is set
      if (this_currency == "")
        this_currency = "EUR";
      var category = expensesSheet.getRange(i, 6).getValue();
      var secondary_category = expensesSheet.getRange(i, 7).getValue();
      expenses.push("\n---------\n"
        + "🗓️ Date: <b>" + date
        + "</b>\n📋 Category: <b>" + category
        + "</b>\n📋 Subcategory: <b>" + secondary_category
        + "</b>\n🔎 Description: <b>" + description
        + "</b>\n💸 Cost: <b>" + this_currency + " " + cost
        + "</b>");
      counter++;
      if (counter >= 5)
        break;
    }
    var expenseList = expenses.join("\n");
    sendText(id, decodeURI("<b>Here are your last 5 expenses:</b> %0A " + expenseList));
    sendMainMenuKeyboard(id);
  } catch (e) {
    sendText(id, decodeURI("<b>Error occurred:</b> %0A" + e.message));
  }

}

/**
 * @fn addNewExpense
 * @param {*} id 
 */
function addNewExpenseStep1Date(id) {
  // dates should be only the number of the day
  var today = new Date();
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  var keyBoard = {
    "inline_keyboard": [
      [
        {
          "text": "📅 Today - " + today.toLocaleDateString(locale, { timeZone: timeZone }),
          "callback_data": "newExpDate" + today.getTime()
        }
      ],
      [
        {
          "text": "📆 Yestday - " + yesterday.toLocaleDateString(locale, { timeZone: timeZone }),
          "callback_data": "newExpDate" + yesterday.getTime()
        }
      ],
      [
        {
          "text": "🗓️ 2 Days Ago - " + twoDaysAgo.toLocaleDateString(locale, { timeZone: timeZone }),
          "callback_data": "newExpDate" + twoDaysAgo.getTime()
        },
      ]
    ]
  };

  sendText(id, "<b><u>🕰️ Choose the expense date:</u></b>", keyBoard);
}

/**
 * @fn addNewExpenseStep2Category
 * @param {*} id 
 */
function addNewExpenseStep2Category(id) {
  // Google Sheet
  var expenseSheet = SpreadsheetApp.openById(ssId);

  var categoriesList = [];
  var categoriesSheet = expenseSheet.getSheetByName("Expenses");

  if (!expenseSheet) {
    sendText(id, decodeURI("<b>Sheet 'Expenses' not found.</b>"));
    return;
  }

  //  var lr = categoriesSheet.getDataRange().getLastRow();
  var lr = categoriesSheet.getRange("A:A").getValues().flat().indexOf("total") + 1;
  for (var i = 2; i < lr; i++) {
    var category = categoriesSheet.getRange(i, 1).getValue();
    //push if category is not empty
    if (category != "")
      categoriesList.push(
        [
          {
            "text": category,
            "callback_data": "category" + category
          }
        ]
      );
  }

  var keyBoard = {
    "inline_keyboard": []
  };

  categoriesList.forEach(element => keyBoard["inline_keyboard"].push(element));

  sendText(id, "<b><u>📋 Choose the expense category:</u></b>", keyBoard);
}

/**
 * @fn addNewExpenseStep2bSubCategory
 * @param {*} id
 * @param {*} chosen_category
 */
function addNewExpenseStep2bSubCategory(id, chosen_category) {
  var categoryList = [];
  // Google Sheet
  var expenseSheet = SpreadsheetApp.openById(ssId);

  var subcategoriesList = [];
  var categoriesSheet = expenseSheet.getSheetByName("Expenses");
  //  var lr = categoriesSheet.getDataRange().getLastRow();
  var lr = categoriesSheet.getRange("A:A").getValues().flat().indexOf("total") + 1;
  var category = "";
  for (var i = 2; i <= lr; i++) {
    var new_category = categoriesSheet.getRange(i, 1).getValue();
    //push if category is not empty
    if (new_category != "")
      category = new_category;
    var subcategory = categoriesSheet.getRange(i, 2).getValue();
    if (subcategory != "")
      if (chosen_category == category)
        subcategoriesList.push(
          [
            {
              "text": subcategory,
              "callback_data": "subcat" + subcategory
            }
          ]
        );
  }

  var keyBoard = {
    "inline_keyboard": []
  };

  subcategoriesList.forEach(element => keyBoard["inline_keyboard"].push(element));

  sendText(id, "<b><u>📋 Choose the expense SubCategory:</u></b>", keyBoard);
}


/**
 * @fn addNewExpenseStep3Description
 * @param {*} id 
 */
function addNewExpenseStep3Description(id) {
  sendText(id, "<b><u>📜 Write the expense description:</u></b>");
}

/**
 * @fn addNewExpenseStep4Value
 * @param {*} id 
 */
function addNewExpenseStep4Value(id) {
  sendText(id, "<b><u>💸 Write the expense value:</u></b>");
}

/**
 * @fn addNewExpenseStep5Details
 * @param {*} id 
 */
function addNewExpenseStep5Details(id) {

  var keyBoard = {
    "inline_keyboard": [
      [
        {
          "text": "N/A",
          "callback_data": "detailsNotAvailable"
        }
      ]
    ]
  };

  sendText(id, "<b><u>🕵 Write the expense details:</u></b>", keyBoard);
}

/**
 * @fn sendMainMenuKeyboard
 * @param {@} id ID of telegram user that asked for the service
 */
function sendMainMenuKeyboard(id) {
  var keyBoard = {
    "inline_keyboard": [
      [
        {
          "text": "⏮️ Total Expenses",
          "callback_data": 'totalExpenses'
        }
      ],
      [
        {
          "text": "💸 Last 5 Expenses",
          "callback_data": 'last5Expenses'
        }
      ],
      [
        {
          "text": "✍️ Add new expense",
          "callback_data": 'addNewExpenseStep1Date'
        },
      ]
      /*[
        {
          "text": "❌ Delete an expense",
          "callback_data": 'deleteAnExpense'
        },
      ]
      */
    ]
  };

  sendText(id, "What you want to do?", keyBoard)
}

/**
 * @fn addExpenseToSpreadsheet
 * @param {@} id ID of telegram user that asked for the service
 */
function addExpenseToSpreadsheet(id) {
  try {
    // Google Sheet
    var googleSheet = SpreadsheetApp.openById(ssId);
    var telegramLog = googleSheet.getSheetByName("Logs");
    var lr = telegramLog.getDataRange().getLastRow();
    var date = JSON.parse(telegramLog.getRange(lr - 5, 1).getValue());
    date = date.callback_query.data.slice("newExpDate".length);
    date = new Date(parseInt(date));

    month = date.getMonth()
    month = month_names[month];
    day_number = date.getDate();


    var category = JSON.parse(telegramLog.getRange(lr - 4, 1).getValue());
    category = category.callback_query.data.slice("category".length);
    var subcat = JSON.parse(telegramLog.getRange(lr - 3, 1).getValue());
    subcat = subcat.callback_query.data.slice("subcat".length);
    var description = JSON.parse(telegramLog.getRange(lr - 2, 1).getValue());
    description = description.message.text.charAt(0).toUpperCase() + description.message.text.slice(1);
    var value = JSON.parse(telegramLog.getRange(lr - 1, 1).getValue());
    valueParsed = parseFloat(value.message.text.replace(/\s/g, "").replace(",", "."));
    var details = JSON.parse(telegramLog.getRange(lr, 1).getValue());
    if (details.callback_query)
      details = "";
    else
      details = details.message.text.charAt(0).toUpperCase() + details.message.text.slice(1);

    sendText(id, "<b>Resume:</b>\n Date: " + date + "\n📋 Category: " + category + "\n📋 Subcategory: " + subcat + "\n🔎 Description: " + description + "\n💸 Cost: " + currency + " " + valueParsed + "\n🔍 Details: " + details + "\n month" + month + "\n day" + day_number);;

    var expensesSheet = googleSheet.getSheetByName(month);
    lr = expensesSheet.getDataRange().getLastRow();
    expensesSheet.getRange(lr + 1, 2).setValue(day_number);
    expensesSheet.getRange(lr + 1, 1).setValue(description);
    expensesSheet.getRange(lr + 1, 3).setValue(valueParsed);
    expensesSheet.getRange(lr + 1, 6).setValue(category);
    expensesSheet.getRange(lr + 1, 7).setValue(subcat);
    expensesSheet.getRange(lr + 1, 8).setValue(details);
    sendText(id, "✔️ Expense added correctly!");
    sendTotalExpensesList(id);
  }
  catch (e) {
    sendText(id, "❌ An error occurred: " + e);
  }
}

/**
 * @fn manageAddExpense
 * @param {*} id: Chat id
 * @return true: Managed correctly
 *         false: Error
 */
function manageAddExpense(id) {
  // Google Sheet
  var googleSheet = SpreadsheetApp.openById(ssId);
  var telegramLog = googleSheet.getSheetByName("Logs");
  var lr = telegramLog.getDataRange().getLastRow();
  if (lr < 5)
    return false;
  var fifthLastLog = JSON.parse(telegramLog.getRange(lr - 4, 1).getValue());
  var fourthLastLog = JSON.parse(telegramLog.getRange(lr - 3, 1).getValue());
  var thirdLastLog = JSON.parse(telegramLog.getRange(lr - 2, 1).getValue());
  var secondLastLog = JSON.parse(telegramLog.getRange(lr - 1, 1).getValue());
  var lastLog = JSON.parse(telegramLog.getRange(lr, 1).getValue());
  if (true
    && lastLog.message
    && thirdLastLog.callback_query
    && thirdLastLog.callback_query.data.includes("category")
    && secondLastLog.callback_query.data.includes("subcat")) {
    // User wrote "Description", wait for Value
    addNewExpenseStep4Value(id);
    return true;
  }
  else if (true
    && lastLog.message
    && secondLastLog.message
    && fourthLastLog.callback_query
    && fourthLastLog.callback_query.data.includes("category")
    && thirdLastLog.callback_query.data.includes("subcat")) {
    // User wrote "Value", wait for Details
    // Data Validation
    if (!isNumber(lastLog.message.text)) {
      sendText(id, "❌ An error occurred: value inserted is not valid! (" + lastLog.message.text + ")");
      return false;
    }
    addNewExpenseStep5Details(id);
    return true;
  }
  else if (true
    && lastLog.message
    && secondLastLog.message
    && thirdLastLog.message
    && fifthLastLog.callback_query
    && fifthLastLog.callback_query.data.includes("category")
    && fourthLastLog.callback_query.data.includes("subcat")) {
    // User wrote "Details", ready to add expense
    addExpenseToSpreadsheet(id);
    return true;
  }

  return false;
}

/**
 * @fn deleteAnExpenseChoose
 * @brief Choose which expense to delete
 */
function deleteAnExpenseChoose(id) {
  // Google Sheet
  var expenseSheet = SpreadsheetApp.openById(ssId);

  var expenses = [];
  var expensesSheet = expenseSheet.getSheetByName("Expenses");
  var lr = expensesSheet.getDataRange().getLastRow();
  categoriesList = []
  counter = 0;
  for (var i = lr; i > 1; i--) {
    var date = expensesSheet.getRange(i, 1).getValue();
    date = Date.parse(date);
    var dateNotParsed = new Date(date);
    var dateParsed = dateNotParsed.toLocaleDateString(locale, { timeZone: timeZone });
    var description = expensesSheet.getRange(i, 2).getValue();
    var cost = expensesSheet.getRange(i, 3).getValue();
    var category = expensesSheet.getRange(i, 4).getValue();
    var detalis = expensesSheet.getRange(i, 5).getValue();
    categoriesList.push(
      [
        {
          "text": "🗑️ " + dateParsed + ": " + category + " - " + description + " - " + currency + " " + cost,
          "callback_data": "deleteExpense" + i + "_" + dateNotParsed.getTime() + "_" + cost
        }
      ]
    );
    counter++;
    if (counter >= 5)
      break;
  }

  var keyBoard = {
    "inline_keyboard": []
  };

  categoriesList.forEach(element => keyBoard["inline_keyboard"].push(element));
  sendText(id, "<b><u>❌ Choose which expense to delete: </u></b>", keyBoard)
}

/**
 * @fn deleteAnExpense
 * @brief Delete an expense
 */
function deleteAnExpense(id, callback_query) {
  // Google Sheet
  var expenseSheet = SpreadsheetApp.openById(ssId);
  var expensesSheet = expenseSheet.getSheetByName("Expenses");

  try {
    var data = callback_query.slice("deleteExpense".length);
    var dataSplitted = data.split("_");
    var line = dataSplitted[0];
    var date = dataSplitted[1];
    var cost = dataSplitted[2];
    if (true
      && (Date.parse(expensesSheet.getRange(line, 1).getValue()) == date)
      && (expensesSheet.getRange(line, 3).getValue() == cost)
    ) {
      // Clear line
      expensesSheet.deleteRow(line);
      sendText(id, "✔️ Expense deleted correctly")
    }
  }
  catch (e) {
    sendText(id, "❌ An error occurred: " + e);
  }

  sendMainMenuKeyboard(id);
}

/**
 * @fn checkUserAuthentication
 * @brief Check user authentication
 */
function checkUserAuthentication(id) {
  // Google Sheet
  var googleSheet = SpreadsheetApp.openById(ssId);
  var authenticatedUsersSheet = googleSheet.getSheetByName("Authenticated Users");
  var lr = authenticatedUsersSheet.getDataRange().getLastRow();
  for (var i = lr; i > 1; i--) {
    var userId = authenticatedUsersSheet.getRange(i, 1).getValue();
    if (userId == id)
      return true;
  }

  sendText(id, "⛔ You're not authorized to interact with this bot!");
  return false;
}

/*!
 * @fn doPost
 * @brief Webhook Callback
*/
function doPost(e) {
  // Log Message
  logMessage(e);

  try {
    // Telegram Message
    var contents = JSON.parse(e.postData.contents);

    // Is it a telegram button callback?
    if (contents.callback_query) {
      // Telegram button callback
      var id_callback = contents.callback_query.from.id;
      var data = contents.callback_query.data;
      if (!checkUserAuthentication(id_callback))
        return;

      // Delete last message
      deleteMessage(id_callback, contents.callback_query.message.message_id)

      if (data == 'totalExpenses') {
        sendTotalExpensesList(id_callback);
        clearLogs();
      }
      else if (data == 'last5Expenses') {
        sendLast5Expenses(id_callback);
        clearLogs();
      }
      else if (data == 'addNewExpenseStep1Date') {
        addNewExpenseStep1Date(id_callback);
      }
      else if (data.includes("newExpDate")) {
        var dateChosen = new Date(parseInt(data.slice("newExpDate".length)));
        dateChosen = dateChosen.toLocaleDateString(locale, { timeZone: timeZone });
        sendText(id_callback, "<b>🕰️ Date: " + dateChosen + "</b>");
        addNewExpenseStep2Category(id_callback);
      }
      else if (data.includes("category")) {
        sendText(id_callback, "<b>📋 Category: " + data.slice("category".length) + "</b>");
        addNewExpenseStep2bSubCategory(id_callback, data.slice("category".length));
      }
      else if (data.includes("subcat")) {
        sendText(id_callback, "<b>📋 SubCategory: " + data.slice("subcat".length) + "</b>");
        addNewExpenseStep3Description(id_callback);
      }
      else if (data == 'detailsNotAvailable') {
        addExpenseToSpreadsheet(id_callback);
      }
      else if (data == 'deleteAnExpense') {
        deleteAnExpenseChoose(id_callback);
        clearLogs();
      }
      else if (data.includes("deleteExpense")) {
        deleteAnExpense(id_callback, data);
        clearLogs();
      }
    }
    else if (contents.message) {
      // It is a normal message
      var id_message = contents.message.chat.id;
      var text = contents.message.text;
      if (!checkUserAuthentication(id_message))
        return;

      if (!manageAddExpense(id_message, text)) {
        sendMainMenuKeyboard(id_message);
      }
    }
  }
  catch (e) {
    sendText(adminID, JSON.stringify(e, null, 4));
  }
}
