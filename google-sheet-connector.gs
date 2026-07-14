/**
 * =====================================================================
 *  GOOGLE SHEET CONNECTOR — Chief's Public Safety Golf Tournament
 * =====================================================================
 *  This tiny script makes your Google Sheet accept sign-ups from the
 *  website. Every tournament registration lands on a "Registrations"
 *  tab; every lunch RSVP lands on an "RSVPs" tab. Both are created
 *  automatically the first time someone signs up.
 *
 *  ----- SETUP (about 5 minutes, no coding experience needed) -----
 *
 *  1. Go to sheets.google.com and create a new blank spreadsheet.
 *     Name it something like "Golf Tournament Sign-Ups".
 *
 *  2. In that sheet's menu, click:  Extensions > Apps Script.
 *     A code editor opens in a new tab.
 *
 *  3. Delete anything already in that editor, then copy EVERYTHING
 *     from this file and paste it in. Click the Save icon (disk).
 *
 *  4. Click the blue "Deploy" button (top right) > "New deployment".
 *       - Click the gear icon next to "Select type" and choose
 *         "Web app".
 *       - Description: type "Golf sign-ups" (anything is fine).
 *       - "Execute as":        Me
 *       - "Who has access":    Anyone
 *       - Click "Deploy".
 *
 *  5. Google will ask you to authorize it. Click "Authorize access",
 *     pick your Google account, click "Advanced" > "Go to (project)",
 *     then "Allow". (This is normal — you are approving your own script.)
 *
 *  6. Copy the "Web app URL" it gives you. It looks like:
 *       https://script.google.com/macros/s/AKfy..../exec
 *
 *  7. Open your website file (index.html), search for SHEET_ENDPOINT,
 *     and paste that URL between the quotes:
 *       const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfy..../exec";
 *
 *  That's it. From now on, every sign-up on the live site writes a new
 *  row into your Google Sheet in real time. You can sort, filter, and
 *  share that sheet like any other.
 *
 *  NOTE: If you ever change THIS script, you must re-deploy for the
 *  changes to take effect: Deploy > Manage deployments > (pencil/edit)
 *  > Version: "New version" > Deploy. The URL stays the same.
 * =====================================================================
 */

// ===== Confirmation email settings (EDIT the copy/addresses as you like) =====
var SEND_CONFIRMATION = true;                          // set to false to turn emails off
var EVENT_NAME  = "Chief's First Annual Public Safety Appreciation Tournament";
var SENDER_NAME = 'Chiefs Pursuit Surplus';            // display name the recipient sees
var REPLY_TO    = 'Marcus@chiefspursuitsurplus.com';   // replies go here

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var isReg = (data.type === 'reg');
    var name = isReg ? 'Registrations' : 'RSVPs';

    var sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);

    // Add a header row the first time this tab is used.
    if (sheet.getLastRow() === 0) {
      if (isReg) {
        sheet.appendRow(['Time', 'Team', 'Captain', 'Email', 'Phone',
                         'Players', 'Affiliation', 'Notes', 'Public Safety (free entry)']);
      } else {
        sheet.appendRow(['Time', 'Name', 'Email', 'Attending',
                         'Golfing?', 'Dietary notes']);
      }
      sheet.getRange(1, 1, 1, sheet.getLastColumn())
           .setFontWeight('bold');
    } else if (isReg && !sheet.getRange(1, 9).getValue()) {
      // Add the Public Safety header to a Registrations tab created before this column existed.
      sheet.getRange(1, 9).setValue('Public Safety (free entry)').setFontWeight('bold');
    }

    // Append the new sign-up.
    if (isReg) {
      sheet.appendRow([new Date(), data.team, data.name, data.email,
                       data.phone, data.players, data.affil, data.notes, data.publicSafety]);
      try { sendRegConfirmation_(data); } catch (mailErr) { /* never fail the save over an email hiccup */ }
    } else {
      sheet.appendRow([new Date(), data.name, data.email, data.count,
                       data.golf, data.diet]);
    }

    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  }
}

// Lets you confirm the web app is live by visiting the URL in a browser.
function doGet() {
  return ContentService.createTextOutput(
    'Golf sign-up connector is running.');
}

// Sends the registrant a confirmation email using Google's built-in mailer.
function sendRegConfirmation_(data) {
  if (!SEND_CONFIRMATION) return;
  var email = (data.email || '').trim();
  if (email.indexOf('@') === -1) return;

  var name = data.name || 'there';
  var players = parseInt(data.players, 10) || 1;
  var isFree = (data.publicSafety === 'Yes');
  var total = players * 50;

  var costLine = isFree
    ? 'Entry: <b>Complimentary</b> &mdash; thank you for your service.'
    : 'Amount due: <b>$' + total + '</b> (' + players + ' &times; $50/player)';

  var paymentBlock = isFree ? '' :
    '<p style="margin:0 0 16px"><b>Payment</b><br>' +
    'Registration is paid by check or wire. Please make checks payable to ' +
    '<b>Chiefs Pursuit Surplus</b>. For wire details, just reply to this email. ' +
    'Payment is due before the event.</p>';

  var html =
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#14181A;line-height:1.5;max-width:560px">' +
      '<p style="margin:0 0 16px">Hi ' + esc_(name) + ',</p>' +
      '<p style="margin:0 0 16px">Thank you for registering for the <b>' + EVENT_NAME + '</b>, a community ' +
        'golf event honoring the police, fire, and emergency-services personnel who serve and protect us. ' +
        '<b>Your spot is reserved.</b></p>' +
      '<p style="margin:0 0 6px"><b>Your registration</b></p>' +
      '<ul style="margin:0 0 16px;padding-left:20px">' +
        '<li>Team: ' + esc_(data.team || '-') + '</li>' +
        '<li>Captain: ' + esc_(name) + '</li>' +
        '<li>Players: ' + players + '</li>' +
        '<li>' + costLine + '</li>' +
      '</ul>' +
      '<p style="margin:0 0 6px"><b>Event details</b></p>' +
      '<ul style="margin:0 0 16px;padding-left:20px">' +
        '<li>Friday, September 25, 2026</li>' +
        '<li>Check-in 8:00 AM &middot; Shotgun start 8:30 AM</li>' +
        '<li>Legendary Oaks Golf Course, Hempstead, TX (outside Houston)</li>' +
        '<li>Lunch &amp; awards to follow at Chiefs Pursuit Surplus, across the street</li>' +
      '</ul>' +
      paymentBlock +
      '<p style="margin:0 0 16px"><b>Questions?</b><br>Marcus Shaw, Event Coordinator<br>' +
        'Marcus@chiefspursuitsurplus.com &middot; (979) 571-1710</p>' +
      '<p style="margin:0">We can\'t wait to see you on the course.<br>&mdash; Chiefs Pursuit Surplus</p>' +
    '</div>';

  var plain =
    'Hi ' + name + ',\n\n' +
    'Thank you for registering for the ' + EVENT_NAME + '. Your spot is reserved.\n\n' +
    'Your registration:\n' +
    '- Team: ' + (data.team || '-') + '\n' +
    '- Captain: ' + name + '\n' +
    '- Players: ' + players + '\n' +
    '- ' + (isFree ? 'Entry: Complimentary - thank you for your service.'
                   : 'Amount due: $' + total + ' (' + players + ' x $50/player)') + '\n\n' +
    'Event details:\n' +
    '- Friday, September 25, 2026\n' +
    '- Check-in 8:00 AM, shotgun start 8:30 AM\n' +
    '- Legendary Oaks Golf Course, Hempstead, TX (outside Houston)\n' +
    '- Lunch & awards to follow at Chiefs Pursuit Surplus, across the street\n\n' +
    (isFree ? '' : 'Payment: by check or wire. Make checks payable to Chiefs Pursuit Surplus. Reply for wire details. Due before the event.\n\n') +
    'Questions? Marcus Shaw, Event Coordinator\n' +
    'Marcus@chiefspursuitsurplus.com, (979) 571-1710\n\n' +
    "We can't wait to see you on the course.\n- Chiefs Pursuit Surplus";

  MailApp.sendEmail({
    to: email,
    subject: "You're registered - " + EVENT_NAME,
    htmlBody: html,
    body: plain,
    name: SENDER_NAME,
    replyTo: REPLY_TO
  });
}

function esc_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
