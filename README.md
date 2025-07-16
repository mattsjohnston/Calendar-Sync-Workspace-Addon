# Calendar Sync Manager - Google Calendar Add-on

A Google Calendar add-on that synchronizes events between multiple calendars using CardService for native Google Calendar integration.

## Features

- **Multi-calendar synchronization**: Sync events from multiple source calendars to destination calendars
- **Configurable sync frequency**: Minutes, hours, or daily synchronization
- **Event filtering**: Configurable number of days to sync ahead
- **Custom event prefixes**: Add prefixes to distinguish synced events
- **Native Google Calendar integration**: Uses CardService for seamless Calendar UI
- **Automatic triggers**: Set up automatic synchronization based on frequency
- **Settings persistence**: User preferences saved with PropertiesService

## CardService Interface

The add-on provides a sophisticated interface built with Google Apps Script's CardService:

- **Toggle switches** for enabling/disabling sync
- **Dropdown selectors** for sync frequency
- **Text inputs** for configuration values
- **Calendar selection** with toggle controls
- **Action buttons** for immediate sync
- **Status indicators** showing sync state and last run time
- **Multi-card navigation** for managing different settings

## Installation & Setup

### Prerequisites

- Google Apps Script account
- clasp CLI tool installed
- Google Calendar API access

### Deploy the Add-on

1. **Clone and setup**:
```bash
   # Navigate to the project directory
   cd "Calendar Sync GUI"

   # Login to clasp
clasp login

   # Push the code to Apps Script
   clasp push
   ```

2. **Configure the add-on**:
   - Open the Apps Script project: `clasp open`
   - Go to Project Settings and switch to a standard GCP project
   - Enable the Calendar API if using advanced features
   - Configure OAuth consent screen if publishing

3. **Deploy as Calendar add-on**:
   - In Apps Script IDE, click "Deploy" > "New deployment"
   - Choose "Add-on" as the type
   - Configure as a Calendar add-on
   - Copy the deployment ID

4. **Test the add-on**:
   - Open Google Calendar
   - The add-on should appear in the right sidebar
   - Click to configure sync settings

## Usage

### Initial Setup

1. **Open the add-on** in Google Calendar sidebar
2. **Configure sync settings**:
   - Enable automatic sync
   - Set sync frequency (5 minutes to daily)
   - Configure days ahead to sync (default: 60)
   - Set event prefix for synced events

3. **Select calendars**:
   - Choose source calendars (to sync FROM)
   - Choose destination calendars (to sync TO)

4. **Test sync**:
   - Click "Sync Now" to run immediately
   - Check that events appear with the configured prefix

### Ongoing Management

- **Enable/disable sync**: Toggle the main sync switch
- **Adjust frequency**: Change how often sync runs automatically
- **Add/remove calendars**: Update source and destination selections
- **Monitor status**: View last sync time and current state

## API Reference

### Main Entry Points

- `onInstall(e)` - Called when add-on is installed
- `onCalendarHomepage(e)` - Creates the main card interface

### CardService Functions

- `createMainCard()` - Builds the main settings interface
- `showSourceCalendars()` - Calendar selection for sources
- `showDestinationCalendars()` - Calendar selection for destinations

### Action Handlers

- `onSyncToggleChange(e)` - Handles sync enable/disable
- `onFrequencyChange(e)` - Updates sync frequency
- `syncNow()` - Immediate sync execution

### Utility Functions

- `getUserCalendars()` - Gets available calendars
- `getProperty(key, default)` - Retrieves user settings
- `setProperty(key, value)` - Saves user settings
- `setupSyncTrigger()` - Creates automatic sync triggers

## Configuration

Settings are stored using PropertiesService:

- `enableSync` - Whether automatic sync is enabled
- `syncFrequency` - Minutes between syncs (5, 15, 30, 60, 240, 1440)
- `numDaysOut` - Days ahead to sync (default: 60)
- `cloneEventPrefix` - Prefix for synced events (default: "* ")
- `sourceCalendars` - JSON array of source calendar IDs
- `destinationCalendars` - JSON array of destination calendar objects

## Development

### File Structure

```
Calendar Sync GUI/
├── Code.js              # Main CardService implementation
├── appsscript.json      # Add-on manifest and configuration
├── .clasp.json          # clasp configuration
└── README.md           # This documentation
```

### Key CardService Components

The interface uses these CardService widgets:

- **CardService.newSwitchKeyValue()** - Toggle switches
- **CardService.newSelectionInput()** - Dropdown selectors
- **CardService.newTextInput()** - Text input fields
- **CardService.newTextButton()** - Action buttons
- **CardService.newDecoratedText()** - Labeled text with controls
- **CardService.newCardSection()** - Grouped content areas

### Deployment Commands

```bash
# Push code changes
clasp push

# Open in Apps Script IDE
clasp open

# View logs
clasp logs

# Deploy new version
clasp deploy
```

## Publishing to Google Workspace Marketplace

1. **Prepare assets**:
   - App icons (32x32 and 128x128 px)
   - Screenshots of the interface
   - App description and details

2. **Configure GCP project**:
   - Set up OAuth consent screen
   - Add required scopes
   - Configure marketplace settings

3. **Submit for review**:
   - Google review process typically takes 1-2 weeks
   - Be prepared for potential iteration on requirements

## Troubleshooting

### Common Issues

- **"Content not available"**: This was the HTML approach - CardService doesn't have this issue
- **Permission errors**: Ensure proper OAuth scopes in manifest
- **Sync not running**: Check that triggers are properly set up
- **Calendar access denied**: Verify calendar permissions

### Debug Steps

1. Check Apps Script logs: `clasp logs`
2. Verify trigger setup in Apps Script console
3. Test individual functions in Apps Script editor
4. Check PropertiesService for saved settings

## Comparison to HTML Approach

**CardService Benefits:**
- Native Google Calendar integration
- Consistent Google UI/UX
- Better performance and reliability
- Proper add-on deployment support
- No "content not available" issues

**CardService Limitations:**
- Less flexible than custom HTML
- Limited styling options
- Google-defined widget set only

## License

This project is open source and available under the MIT License.