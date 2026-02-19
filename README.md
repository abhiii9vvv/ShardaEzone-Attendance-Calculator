# ShardaEzone Attendance Calculator

A lightweight Chrome/Edge browser extension engineered to solve a real-world problem faced by Sharda University students: the lack of real-time attendance analytics on the Ezone portal. The extension injects directly into the portal's DOM, computes personalized skip/attend recommendations, and displays them inline without any external API calls or data collection.

Built with vanilla JavaScript and the Chrome Extensions Manifest V3 API, it demonstrates practical DOM engineering, content script architecture, and privacy-first design. The tool runs entirely client-side, ensuring zero data exposure.

## Tech Stack

- **Language:** JavaScript (Vanilla ES6+)
- **Platform:** Chrome Extensions API (Manifest V3)
- **Injection:** DOM Content Scripts
- **Styling:** CSS3

## Key Features

- Automated real-time calculation of skippable and required classes
- Dual target support: 75% and 85% attendance thresholds
- Seamless DOM injection into existing Ezone portal UI
- Privacy-focused: zero API calls, no data collection, fully local
- Works on Chrome and Microsoft Edge browsers

## Install

1. Open `chrome://extensions` or `edge://extensions`
2. Enable Developer mode
3. Click Load unpacked and select this folder
4. Navigate to https://student.sharda.ac.in/admin/courses

## How It Works

The content script activates on the `/admin/courses` page, reads attendance data directly from the DOM, and injects computed columns showing exactly how many classes can be skipped or must be attended to maintain the selected attendance target.
