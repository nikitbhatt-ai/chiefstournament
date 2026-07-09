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
