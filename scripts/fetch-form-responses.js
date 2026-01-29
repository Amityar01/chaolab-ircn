#!/usr/bin/env node
/**
 * Fetch Google Form responses from linked Google Sheet
 *
 * Setup:
 * 1. Enable Google Sheets API: gcloud services enable sheets.googleapis.com
 * 2. Authenticate: gcloud auth application-default login --scopes=https://www.googleapis.com/auth/spreadsheets.readonly
 *
 * Usage:
 *   node scripts/fetch-form-responses.js [--json] [--csv]
 */

const { google } = require('googleapis');

const SHEET_ID = '1m6u-eEV3uB41uo7_8bW1wHuiEaqGXz7GVddksQpfrxA';
const RANGE = 'Form Responses 1!A:Z'; // Adjust range as needed

async function fetchResponses() {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');
  const outputCsv = args.includes('--csv');

  try {
    // Use Application Default Credentials
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log('No responses found.');
      return;
    }

    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });

    if (outputJson) {
      console.log(JSON.stringify(data, null, 2));
    } else if (outputCsv) {
      // Output as CSV
      console.log(headers.join(','));
      rows.slice(1).forEach(row => {
        console.log(row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','));
      });
    } else {
      // Pretty print
      console.log(`\n📋 Form Responses (${data.length} total)\n`);
      console.log('─'.repeat(60));

      data.forEach((entry, index) => {
        console.log(`\n[${index + 1}] ${entry['Name (as you\'d like it displayed)'] || 'Unknown'}`);
        console.log(`    Position: ${entry['Title/Position'] || 'N/A'}`);
        console.log(`    Email: ${entry['Email (optional, for public display)'] || 'N/A'}`);
        console.log(`    Submitted: ${entry['Timestamp'] || 'N/A'}`);

        if (entry['Personal website link (optional)']) {
          console.log(`    Website: ${entry['Personal website link (optional)']}`);
        }
        if (entry['Google Scholar profile link (optional)']) {
          console.log(`    Scholar: ${entry['Google Scholar profile link (optional)']}`);
        }
        if (entry['GitHub link (optional)']) {
          console.log(`    GitHub: ${entry['GitHub link (optional)']}`);
        }
      });

      console.log('\n' + '─'.repeat(60));
      console.log('Use --json for full JSON output or --csv for CSV format');
    }

  } catch (error) {
    if (error.message.includes('Could not load the default credentials')) {
      console.error('\n❌ Authentication required. Run:');
      console.error('   gcloud auth application-default login --scopes=https://www.googleapis.com/auth/spreadsheets.readonly\n');
    } else if (error.message.includes('API has not been used')) {
      console.error('\n❌ Sheets API not enabled. Run:');
      console.error('   gcloud services enable sheets.googleapis.com\n');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

fetchResponses();
