# Chief's 1st Annual Public Safety Appreciation Tournament — Registration Site

A single, self-contained web page (`index.html`) that lets people:

- **Register a team / foursome** for the tournament
- **RSVP for lunch** afterward
- **Sign up as a sponsor** (the sponsor tier buttons pre-fill the registration form)

There's also a built-in **Organizer view** (a link under the sign-up forms) that shows live totals, a table of everyone who has signed up, and a **Download CSV** button.

Payment stays offline — the site tells people to pay by check or wire, exactly as before.

---

## How sign-ups are stored

Every registration and RSVP is recorded in a **Google Sheet that you own** — free, private, and no server to run. The website talks to the sheet through a tiny Google Apps Script (included here as `google-sheet-connector.gs`).

Until you connect the sheet, sign-ups are only saved in the visitor's own browser, which is fine for testing but means **you won't receive them**. So do the ~5-minute setup below before you share the link.

```
Visitor fills the form  ─▶  Google Apps Script  ─▶  your Google Sheet
                                                     (Organizer view reads it back)
```

---

## Step 1 — Connect your Google Sheet (required, ~5 min)

Full click-by-click instructions live at the top of **`google-sheet-connector.gs`**. In short:

1. Create a blank Google Sheet.
2. In the sheet, open **Extensions → Apps Script**, paste in the contents of `google-sheet-connector.gs`, and save.
3. Set `ORG_KEY` in that script to a secret phrase of your choosing.
4. **Deploy → New deployment → Web app**, *Execute as: Me*, *Who has access: **Anyone***, and copy the resulting URL (ends in `/exec`).
5. Open `index.html`, search for `SHEET_ENDPOINT`, and fill in the two lines:

   ```js
   const SHEET_ENDPOINT = "https://script.google.com/macros/s/.../exec";
   const ORG_KEY        = "the-same-secret-phrase";
   ```

That's it — sign-ups now flow into your spreadsheet, and the Organizer view can pull the full list back from any device.

---

## Step 2 — Fill in the event details

Open `index.html` and search (Ctrl/Cmd-F) for **`EDIT:`** to step through every changeable spot. The ones still using placeholders:

| Search for | What to enter |
|---|---|
| `[Golf Course Name]` | The course/venue name (in the "Where" fact strip) |
| `$[per golfer]` | Price per individual player |
| `$[per team]` | Price per foursome |

Everything else (date, times, schedule, sponsor tiers and prices, contact info) is already filled in — double-check it's correct for your event.

---

## Step 3 — Publish the page

`index.html` is completely self-contained (the logo is embedded), so you can host it almost anywhere.

**Option A — Your existing website / host**
Upload `index.html` to your web host, Squarespace, Wix, etc. If your host expects a specific name, `index.html` is the standard home-page filename.

**Option B — GitHub Pages (free)**
1. Push this repo to GitHub (the file is already here).
2. On GitHub, go to **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**, pick the branch that contains `index.html`, folder **/ (root)**, and Save.
4. After a minute your site is live at `https://<your-username>.github.io/<repo>/`.

---

## Testing before you go live

1. Open the published page (or `index.html` locally).
2. Submit a test registration and a test RSVP — you should see a green confirmation.
3. Click **Organizer view — see sign-ups** and confirm your test entries appear and the totals update.
4. Once the Google Sheet is connected, confirm the same test rows show up in the spreadsheet.
5. Delete the test rows from the sheet before the event.

---

## Files in this repo

| File | Purpose |
|---|---|
| `index.html` | The complete website — this is what you publish. |
| `google-sheet-connector.gs` | The Google Apps Script that saves sign-ups to your sheet (with setup steps at the top). |
| `README.md` | This guide. |

---

## Good to know

- **Spam protection:** the forms include a hidden "honeypot" field that silently blocks most bots.
- **Privacy:** the full attendee list can only be read with your secret `ORG_KEY`, so it isn't exposed publicly.
- **Backup copy:** each visitor's browser also keeps a local copy of what *they* submitted, as a safety net — but your Google Sheet is the single complete record.

Questions about the event: Marcus Shaw · Marcus@chiefspursuitsurplus.com · (979) 571-1710
