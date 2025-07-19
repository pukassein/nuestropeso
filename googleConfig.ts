// googleConfig.ts
// ========================== IMPORTANT ==========================
// 1. Replace the placeholder values below with your own Google Cloud credentials.
// 2. Create a Google Cloud Project: https://console.cloud.google.com/
// 3. In your project, go to "APIs & Services" > "Library" and enable the "Google Sheets API".
// 4. Go to "APIs & Services" > "Credentials":
//    - Create an "API key" and paste it into `API_KEY`.
//    - Create an "OAuth 2.0 Client ID" for a "Web application".
//      - Add your development URL (e.g., http://localhost:5173) to "Authorized JavaScript origins".
//      - Paste the generated Client ID into `CLIENT_ID`.
// 5. Create a new Google Sheet: https://sheets.new
//    - Get the Spreadsheet ID from its URL (the long string in .../d/SPREADSHEET_ID/edit).
//    - Create two tabs named "Users" and "WeightHistory".
//    - Set up the headers:
//      - Users sheet: id, name, goalWeight
//      - WeightHistory sheet: id, userId, date, weight
//    - Add initial user data to the 'Users' sheet (e.g., 'hussein', 'Hussein', 85).

export const CLIENT_ID = '275985376612-df5b28vj26bk8huvc83arouo6refj8cs.apps.googleusercontent.com';
export const API_KEY = 'AIzaSyArjZCB6Vlb2_gIHOjsU1CzU_KIWwdLboo';
export const SPREADSHEET_ID = '1VexCL881FkFYrFMtc4WiMlPiP5zDNcK-4TvcdzJC8zM';
