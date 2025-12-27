# Meeting Prep - Chrome Extension

Clean up tab clutter before meetings or focus sessions. Keep only your essential websites open with just a few clicks.

<img width="1107" height="879" alt="Screenshot 2025-09-30 202318" src="https://github.com/user-attachments/assets/90fa6686-63e1-40a1-be62-98285848cefa" />

<img width="1045" height="873" alt="Screenshot 2025-09-30 202330" src="https://github.com/user-attachments/assets/77c4a556-4f1f-4f31-8375-7c2618b13ef4" />

<img width="978" height="866" alt="Screenshot 2025-09-30 202342" src="https://github.com/user-attachments/assets/e99ecb60-fca5-4bf1-934f-77c960262e24" />

<img width="931" height="859" alt="Screenshot 2025-09-30 202355" src="https://github.com/user-attachments/assets/f4b2f292-fe5d-49b8-b28d-534286aa505a" />


## Features

- **Four Beautiful Themes**: Light, Dark, Pixelated (retro gaming font), and Consolas (green terminal)
- **Two Operation Modes**: Manual review or automatic cleanup
- **Smart Tab Filtering**: Identifies non-whitelisted tabs instantly
- **Whitelist Management**: Easy settings for your essential websites
- **Sync Across Devices**: Your preferences sync across all Chrome browsers

## Installation

### Option 1: From Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "Meeting Prep"
3. Click "Add to Chrome"

### Option 2: Load Manually (Developer Mode)
1. Download this extension folder to your computer
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top right corner)
4. Click **Load unpacked** button
5. Select the extension folder you downloaded
6. The Meeting Prep icon will appear in your toolbar

## How to Use

### First Time Setup
1. Click the Meeting Prep icon in your Chrome toolbar
2. Click **Settings** button
3. Add your essential websites to the whitelist:
   - Examples: `gmail.com`, `calendar.google.com`, `notion.so`, `slack.com`
4. Choose your preferred theme (Light, Dark, Pixelated, or Consolas)

### Daily Use

**Manual Mode** (Default):
1. Click the extension icon
2. Review tabs that will be closed
3. Uncheck any you want to keep
4. Click "Close Selected Tabs"

**Auto Mode** (Quick):
1. Click the extension icon
2. Switch to "Auto" mode
3. Click "Auto Clean"
4. All non-whitelisted tabs close instantly

## Themes

- **Light**: Clean black on white with blue accents
- **Dark**: White on dark background
- **Pixelated**: Retro gaming font with auto day/night switching
- **Consolas**: Green terminal/Matrix style

## Whitelist Tips

Add websites in any format:
- Domain: `gmail.com`
- Subdomain: `calendar.google.com`
- Full URL: `https://app.notion.so`

The extension matches by hostname, so `gmail.com` keeps all Gmail tabs open.

## Privacy

- All data stored locally in Chrome
- No data collection or transmission
- Minimal permissions required
- Open source code

## Troubleshooting

**Extension not working?**
- Enable it in `chrome://extensions/`
- Click the reload icon under the extension

**Whitelist not syncing?**
- Sign into Chrome
- Enable Chrome sync in settings

**Wrong tabs being closed?**
- Check whitelist URLs are correct
- Remove `www.` prefixes and `https://`
- Use base domains (e.g., `google.com`)

## Support

Found a bug or have a feature request? Create an issue in the repository.

## License

MIT License - Free to use and modify.
