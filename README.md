# Meeting Prep - Chrome Extension

A Chrome extension that helps you quickly clean up tab clutter before meetings or focus sessions. Maintain a whitelist of essential websites and selectively close non-essential tabs with just a few clicks.

## Features

- **Smart Tab Filtering**: Automatically identifies tabs that aren't on your whitelist
- **Review Before Closing**: Shows you exactly which tabs will be closed before taking action
- **Selective Control**: Uncheck any tabs you want to keep for the current session
- **Whitelist Management**: Easy-to-use settings page for managing your essential websites
- **Sync Across Devices**: Your whitelist syncs across all your Chrome browsers

## Installation

### From Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "Meeting Prep"
3. Click "Add to Chrome"

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The Meeting Prep icon will appear in your Chrome toolbar

## How to Use

### First Time Setup
1. Right-click the Meeting Prep icon in your toolbar
2. Select "Options" to open the settings page
3. Add your essential websites to the whitelist:
   - `gmail.com` - Keep Gmail open
   - `calendar.google.com` - Keep Google Calendar open
   - `notion.so` - Keep Notion open
   - `slack.com` - Keep Slack open

### Daily Usage
1. Click the Meeting Prep icon in your toolbar
2. Review the list of tabs that will be closed
3. Uncheck any tabs you want to keep for this session
4. Click "Close Selected Tabs"
5. Your workspace is now clean and ready for your meeting!

## Whitelist Examples

You can add websites in several formats:

- **Domain only**: `gmail.com`
- **Subdomain**: `calendar.google.com`
- **Full URL**: `https://app.notion.so`

The extension automatically normalizes URLs and matches by hostname, so `gmail.com` will keep all Gmail tabs open regardless of the specific page.

## Privacy & Security

- **Local Storage**: Your whitelist is stored locally in Chrome's sync storage
- **No Data Collection**: This extension doesn't collect or transmit any personal data
- **Minimal Permissions**: Only requests access to tabs and storage APIs
- **Open Source**: Full source code is available for review

## Technical Details

### Architecture
- **Manifest V3**: Built with the latest Chrome extension standards
- **Service Worker**: Background script handles tab operations
- **Popup Interface**: Clean, responsive UI for tab selection
- **Options Page**: Full-featured whitelist management
- **Chrome Storage API**: Sync whitelist across devices

### File Structure
```
Meeting Prep/
├── manifest.json          # Extension configuration
├── background.js           # Service worker for tab management
├── popup.html             # Main popup UI
├── popup.js               # Popup logic and interaction
├── popup.css              # Popup styling
├── options.html           # Settings page for whitelist
├── options.js             # Options page logic
├── options.css            # Options page styling
├── icons/                 # Extension icons
└── README.md              # This file
```

### Permissions Required
- `tabs`: To query and close browser tabs
- `storage`: To save and sync your whitelist

## Development

### Setup
1. Clone the repository
2. Load the extension in Chrome developer mode
3. Make changes and reload the extension to test

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Troubleshooting

### Extension Not Working
- Make sure it's enabled in `chrome://extensions/`
- Try reloading the extension
- Check the developer console for errors

### Whitelist Not Syncing
- Ensure you're signed into Chrome
- Check Chrome sync settings
- Try adding the URL again

### Tabs Not Being Filtered Correctly
- Check that URLs are added correctly to whitelist
- Remove `www.` prefixes and protocols from whitelist entries
- Use base domain names (e.g., `google.com` instead of `mail.google.com`)

## Support

If you encounter any issues or have feature requests, please:

1. Check the troubleshooting section above
2. Review existing issues in the repository
3. Create a new issue with detailed information

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Version History

### v1.0.0
- Initial release
- Basic tab filtering and closing functionality
- Whitelist management
- Chrome sync storage support
- Modern, responsive UI
