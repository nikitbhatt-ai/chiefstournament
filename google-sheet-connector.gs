/**
 * ============================================================
 *  CHIEF'S PUBLIC SAFETY APPRECIATION TOURNAMENT
 *  Google Sheet connector for the registration website
 * ============================================================
 *
 *  This little script turns a normal Google Sheet into the
 *  permanent home for every tournament registration and lunch
 *  RSVP submitted on the website. It's free, it's yours, and
 *  no separate server is needed.
 *
 *  ----------  ONE-TIME SETUP (about 5 minutes)  ----------
 *
 *  1. Go to https://sheets.google.com and create a new, blank
 *     spreadsheet. Name it something like
 *     "Golf Tournament Sign-ups". You do NOT need to add any
 *     column headers yourself — the script creates them.
 *
 *  2. In that spreadsheet's menu, click:
 *        Extensions  ->  Apps Script
 *     A code editor opens in a new tab.
 *
 *  3. Delete whatever code is shown, then copy EVERYTHING in
 *     this file and paste it in. Click the disk icon to Save.
 *
 *  4. Change the ORG_KEY value just below to any secret phrase
 *     you like (letters/numbers, no spaces is easiest). You'll
 *     paste this SAME phrase into the website, so keep it handy.
 *
 *  5. Click the blue "Deploy" button (top right) ->
 *        New deployment.
 *     - Click the gear next to "Select type" and choose
 *       "Web app".
 *     - Description: "Golf sign-ups"
 *     - Execute as:  Me (your email)
 *     - Who has access:  Anyone
 *     - Click Deploy. Approve/allow the permissions when asked
 *       (Google will warn it's an unverified app — that's
 *       normal for your own script; click Advanced -> Go to
 *       project -> Allow).
 *
 *  6. Google shows a "Web app URL" ending in /exec. COPY it.
 *
 *  7. Open index.html and find these two lines near the bottom
 *     (search for SHEET_ENDPOINT):
 *        const SHEET_ENDPOINT = "";
 *        const ORG_KEY = "";
 *     Paste your Web app URL between the first pair of quotes,
 *     and your secret phrase between the second pair. Save.
 *
 *  8. Done. Every sign-up now lands in your spreadsheet, and
 *     the site's "Organizer view" can pull the full list back.
 *
 *  ----------  IF YOU EVER CHANGE THIS SCRIPT  ----------
 *  Re-deploy with Deploy -> Manage deployments -> (pencil/edit)
 *  -> Version: New version -> Deploy. The /exec URL stays the
 *  same, so you don't have to touch the website again.
 * ============================================================
 */

// EDIT: pick any secret phrase. Must match ORG_KEY in index.html.
const ORG_KEY = 'change-me-to-a-secret-phrase';

const REG_SHEET  = 'Registrations';
const RSVP_SHEET = 'Lunch RSVPs';

// Called automatically when the website submits a sign-up.
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.type === 'reg') {
      const sh = getSheet_(ss, REG_SHEET,
        ['Time', 'Team', 'Captain', 'Email', 'Phone', 'Players', 'Affiliation', 'Notes']);
      sh.appendRow([new Date(), data.team, data.name, data.email,
        data.phone, data.players, data.affil, data.notes]);
    } else if (data.type === 'rsvp') {
      const sh = getSheet_(ss, RSVP_SHEET,
        ['Time', 'Name', 'Email', 'Attending', 'Golfing', 'Dietary notes']);
      sh.appendRow([new Date(), data.name, data.email,
        data.count, data.golf, data.diet]);
    } else {
      return json_({ ok: false, error: 'unknown type' });
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Called by the site's "Organizer view" to load the full list.
// Requires the secret key so attendee details stay private.
function doGet(e) {
  if (!e || !e.parameter || e.parameter.key !== ORG_KEY) {
    return json_({ ok: false, error: 'unauthorized' });
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return json_({
    ok: true,
    registrations: readSheet_(ss, REG_SHEET),
    rsvps: readSheet_(ss, RSVP_SHEET)
  });
}

// --- helpers ---

function getSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function readSheet_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) return [];
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values.shift();
  return values.map(function (row) {
    const obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
