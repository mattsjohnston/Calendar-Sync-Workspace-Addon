/*
  Google Calendar Add-on for Calendar Sync Manager
  Uses CardService for native Google Calendar integration
*/

// ============================================================================
// SIMPLE HOMEPAGE FUNCTION - Following Google Workspace Add-ons docs
// ============================================================================

/**
 * Callback for when the add-on homepage is requested
 * @param {Object} e The event object
 */
function onHomepage(e) {
  return createMainCard();
}

// ============================================================================
// TEST FUNCTION - Remove after testing
// ============================================================================

/**
 * Simple test function to verify CardService is working
 */
function testCardService() {
  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Test Card'))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText('CardService is working!')))
    .build();

  return card;
}

// ============================================================================
// CALENDAR ADD-ON ENTRY POINTS
// ============================================================================

/**
 * Callback for when the add-on is installed
 * @param {Object} e The event object
 */
function onInstall(e) {
  onHomepage(e);
}

// ============================================================================
// CARDSERVICE UI FUNCTIONS
// ============================================================================

/**
 * Creates the main card interface for the Calendar Sync Manager
 * @return {Card} The main card
 */
function createMainCard() {
  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Calendar Sync Manager')
      .setSubtitle('Manage multi-calendar synchronization')
    );

  // Sync Settings Section
  var syncSection = CardService.newCardSection()
    .setHeader('Sync Settings');

  // Enable Sync Toggle
  var enableSyncToggle = CardService.newSwitch()
    .setFieldName('enableSync')
    .setSelected(getProperty('enableSync', 'false') === 'true')  // Boolean for initial state
    .setValue('true')  // Value when toggled on
    .setOnChangeAction(CardService.newAction()
      .setFunctionName('onSyncToggleChange'));

  syncSection.addWidget(CardService.newDecoratedText()
    .setTopLabel('Enable Automatic Sync')
    .setSwitchControl(enableSyncToggle)
  );

  // Sync Frequency
  var frequencyDropdown = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Sync Frequency')
    .setFieldName('syncFrequency')
    .addItem('Every 5 minutes', '5', getProperty('syncFrequency', '60') === '5')
    .addItem('Every 15 minutes', '15', getProperty('syncFrequency', '60') === '15')
    .addItem('Every 30 minutes', '30', getProperty('syncFrequency', '60') === '30')
    .addItem('Every hour', '60', getProperty('syncFrequency', '60') === '60')
    .addItem('Every 4 hours', '240', getProperty('syncFrequency', '60') === '240')
    .addItem('Daily', '1440', getProperty('syncFrequency', '60') === '1440')
    .setOnChangeAction(CardService.newAction()
      .setFunctionName('onFrequencyChange'));

  syncSection.addWidget(frequencyDropdown);

  // Days Out Setting
  var daysOutInput = CardService.newTextInput()
    .setFieldName('numDaysOut')
    .setTitle('Days to sync ahead')
    .setHint('Number of days to sync into the future (default: 60)')
    .setValue(getProperty('numDaysOut', '60'))
    .setOnChangeAction(CardService.newAction()
      .setFunctionName('onDaysOutChange'));

  syncSection.addWidget(daysOutInput);

  // Event Prefix Setting
  var prefixInput = CardService.newTextInput()
    .setFieldName('cloneEventPrefix')
    .setTitle('Event prefix')
    .setHint('Prefix added to synced events (e.g., "* ")')
    .setValue(getProperty('cloneEventPrefix', '* '))
    .setOnChangeAction(CardService.newAction()
      .setFunctionName('onPrefixChange'));

  syncSection.addWidget(prefixInput);

  card.addSection(syncSection);

  // Calendar Management Section
  var calendarSection = CardService.newCardSection()
    .setHeader('Calendar Management');

  // Source Calendars Button
  var sourceCalendarsButton = CardService.newTextButton()
    .setText('Manage Source Calendars')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('showSourceCalendars'));

  calendarSection.addWidget(CardService.newButtonSet()
    .addButton(sourceCalendarsButton)
  );

  // Destination Calendars Button
  var destCalendarsButton = CardService.newTextButton()
    .setText('Manage Destination Calendars')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('showDestinationCalendars'));

  calendarSection.addWidget(CardService.newButtonSet()
    .addButton(destCalendarsButton)
  );

  card.addSection(calendarSection);

  // Action Buttons Section
  var actionSection = CardService.newCardSection()
    .setHeader('Actions');

  // Sync Now Button
  var syncNowButton = CardService.newTextButton()
    .setText('Sync Now')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('syncNow'))
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED);

  actionSection.addWidget(CardService.newButtonSet()
    .addButton(syncNowButton)
  );

  card.addSection(actionSection);

  // Status Section
  var statusSection = CardService.newCardSection()
    .setHeader('Status');

  var lastSyncText = getProperty('lastSyncTime', 'Never');
  var statusText = getProperty('enableSync', 'false') === 'true' ? 'Enabled' : 'Disabled';

  statusSection.addWidget(CardService.newDecoratedText()
    .setTopLabel('Sync Status')
    .setText(statusText)
  );

  statusSection.addWidget(CardService.newDecoratedText()
    .setTopLabel('Last Sync')
    .setText(lastSyncText)
  );

  // Display enabled source and destination calendars for debugging
  var sourceIds = JSON.parse(getProperty('sourceCalendars', '[]'));
  var destInfo = JSON.parse(getProperty('destinationCalendars', '[]'));
  var destIds = destInfo.map(function(d) { return d.id; });

  if (sourceIds.length > 0 || destIds.length > 0) {
    var allCalendars = getUserCalendars();
    var calendarNameMap = allCalendars.reduce(function(map, cal) {
      map[cal.id] = cal.name;
      return map;
    }, {});

    var sourceNames = sourceIds.map(function(id) {
      return calendarNameMap[id] || id; // Fallback to ID if name not found
    }).join('\n');

    var destNames = destIds.map(function(id) {
      return calendarNameMap[id] || id; // Fallback to ID if name not found
    }).join('\n');

    if (sourceNames) {
      statusSection.addWidget(CardService.newKeyValue()
        .setTopLabel("Enabled Source Calendars")
        .setContent(sourceNames)
        .setMultiline(true));
    }

    if (destNames) {
      statusSection.addWidget(CardService.newKeyValue()
        .setTopLabel("Enabled Destination Calendars")
        .setContent(destNames)
        .setMultiline(true));
    }
  }

  card.addSection(statusSection);

  return card.build();
}

/**
 * Shows the source calendars management card
 */
function showSourceCalendars() {
  console.log('=== showSourceCalendars DEBUG ===');

  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Source Calendars')
      .setSubtitle('Select calendars to sync FROM')
    );

  var calendars = getUserCalendars();
  var sourceCalendars = JSON.parse(getProperty('sourceCalendars', '[]'));

  console.log('Available calendars:', JSON.stringify(calendars));
  console.log('Stored source calendars:', JSON.stringify(sourceCalendars));

  var calendarSection = CardService.newCardSection()
    .setHeader('Available Calendars');

  calendars.forEach(function(calendar) {
    var isSelected = sourceCalendars.indexOf(calendar.id) !== -1;
    console.log('Calendar:', calendar.name, 'ID:', calendar.id, 'Selected:', isSelected);

    var toggle = CardService.newSwitch()
      .setFieldName('source_' + calendar.id)
      .setSelected(isSelected)  // Boolean for initial state
      .setValue('true')  // Value when toggled on
      .setOnChangeAction(CardService.newAction()
        .setFunctionName('onSourceCalendarToggle')
        .setParameters({calendarId: calendar.id}));

    calendarSection.addWidget(CardService.newDecoratedText()
      .setTopLabel(calendar.name)
      .setText(calendar.id)
      .setSwitchControl(toggle)
    );
  });

  card.addSection(calendarSection);

  // Back button
  var backButton = CardService.newTextButton()
    .setText('Back to Main')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('showMainCard'));

  card.addSection(CardService.newCardSection()
    .addWidget(CardService.newButtonSet()
      .addButton(backButton)
    )
  );

  return CardService.newNavigation()
    .pushCard(card.build());
}

/**
 * Shows the destination calendars management card
 */
function showDestinationCalendars() {
  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Destination Calendars')
      .setSubtitle('Select calendars to sync TO')
    );

  var calendars = getUserCalendars();
  var destCalendars = JSON.parse(getProperty('destinationCalendars', '[]'));

  var calendarSection = CardService.newCardSection()
    .setHeader('Available Calendars');

  calendars.forEach(function(calendar) {
    var isSelected = destCalendars.some(function(dest) {
      return dest.id === calendar.id;
    });

    var toggle = CardService.newSwitch()
      .setFieldName('dest_' + calendar.id)
      .setSelected(isSelected)  // Boolean for initial state
      .setValue('true')  // Value when toggled on
      .setOnChangeAction(CardService.newAction()
        .setFunctionName('onDestCalendarToggle')
        .setParameters({calendarId: calendar.id}));

    calendarSection.addWidget(CardService.newDecoratedText()
      .setTopLabel(calendar.name)
      .setText(calendar.id)
      .setSwitchControl(toggle)
    );
  });

  card.addSection(calendarSection);

  // Back button
  var backButton = CardService.newTextButton()
    .setText('Back to Main')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('showMainCard'));

  card.addSection(CardService.newCardSection()
    .addWidget(CardService.newButtonSet()
      .addButton(backButton)
    )
  );

  return CardService.newNavigation()
    .pushCard(card.build());
}

/**
 * Shows the main card (for back navigation)
 */
function showMainCard() {
  return CardService.newNavigation()
    .updateCard(createMainCard());
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

/**
 * Handles sync toggle changes
 */
function onSyncToggleChange(e) {
  var enabled = e.formInput.enableSync === 'true';  // Only true if switch is on
  setProperty('enableSync', enabled.toString());

  if (enabled) {
    setupSyncTrigger();
  } else {
    clearSyncTriggers();
  }

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setType(CardService.NotificationType.INFO)
      .setText('Sync ' + (enabled ? 'enabled' : 'disabled'))
    )
    .build();
}

/**
 * Handles frequency changes
 */
function onFrequencyChange(e) {
  var frequency = e.formInput.syncFrequency;
  setProperty('syncFrequency', frequency);

  // Update trigger if sync is enabled
  if (getProperty('enableSync', 'false') === 'true') {
    setupSyncTrigger();
  }

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setType(CardService.NotificationType.INFO)
      .setText('Sync frequency updated')
    )
    .build();
}

/**
 * Handles days out changes
 */
function onDaysOutChange(e) {
  var days = e.formInput.numDaysOut;
  setProperty('numDaysOut', days);

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setType(CardService.NotificationType.INFO)
      .setText('Days ahead setting updated')
    )
    .build();
}

/**
 * Handles prefix changes
 */
function onPrefixChange(e) {
  var prefix = e.formInput.cloneEventPrefix;
  setProperty('cloneEventPrefix', prefix);

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setType(CardService.NotificationType.INFO)
      .setText('Event prefix updated')
    )
    .build();
}

/**
 * Handles source calendar toggle
 */
function onSourceCalendarToggle(e) {
  console.log('=== onSourceCalendarToggle DEBUG ===');
  console.log('Parameters:', JSON.stringify(e.parameters));
  console.log('Form input:', JSON.stringify(e.formInput));

  var calendarId = e.parameters.calendarId;
  var formValue = e.formInput['source_' + calendarId];
  var isEnabled = formValue === 'true';  // Only true if switch is on

  console.log('Calendar ID:', calendarId);
  console.log('Form value:', formValue);
  console.log('IsEnabled:', isEnabled);

  var sourceCalendars = JSON.parse(getProperty('sourceCalendars', '[]'));
  console.log('Before update - stored calendars:', JSON.stringify(sourceCalendars));

  if (isEnabled) {
    if (sourceCalendars.indexOf(calendarId) === -1) {
      sourceCalendars.push(calendarId);
      console.log('Added calendar to list');
    } else {
      console.log('Calendar already in list');
    }
  } else {
    var index = sourceCalendars.indexOf(calendarId);
    if (index !== -1) {
      sourceCalendars.splice(index, 1);
      console.log('Removed calendar from list');
    } else {
      console.log('Calendar not in list');
    }
  }

  console.log('After update - calendars to store:', JSON.stringify(sourceCalendars));
  setProperty('sourceCalendars', JSON.stringify(sourceCalendars));

  // Verify it was stored
  var verification = getProperty('sourceCalendars', '[]');
  console.log('Verification - stored value:', verification);

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setType(CardService.NotificationType.INFO)
      .setText('Source calendar updated')
    )
    .build();
}

/**
 * Handles destination calendar toggle
 */
function onDestCalendarToggle(e) {
  var calendarId = e.parameters.calendarId;
  var isEnabled = e.formInput['dest_' + calendarId] === 'true';  // Only true if switch is on

  var destCalendars = JSON.parse(getProperty('destinationCalendars', '[]'));

  if (isEnabled) {
    if (!destCalendars.some(function(dest) { return dest.id === calendarId; })) {
      destCalendars.push({
        id: calendarId,
        showExternalEventNames: true
      });
    }
  } else {
    destCalendars = destCalendars.filter(function(dest) {
      return dest.id !== calendarId;
    });
  }

  setProperty('destinationCalendars', JSON.stringify(destCalendars));

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setType(CardService.NotificationType.INFO)
      .setText('Destination calendar updated')
    )
    .build();
}

/**
 * Handles sync now button click
 */
function syncNow() {
  try {
    sync();
    setProperty('lastSyncTime', new Date().toLocaleString());

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setType(CardService.NotificationType.INFO)
        .setText('Sync completed successfully')
      )
      .setNavigation(CardService.newNavigation()
        .updateCard(createMainCard())
      )
      .build();
  } catch (error) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setType(CardService.NotificationType.ERROR)
        .setText('Sync failed: ' + error.message)
      )
      .build();
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets user calendars
 */
function getUserCalendars() {
  var calendars = [];
  var calendarList = CalendarApp.getAllCalendars();

  calendarList.forEach(function(calendar) {
    calendars.push({
          id: calendar.getId(),
      name: calendar.getName()
    });
  });

  return calendars;
}

/**
 * Gets a property from PropertiesService
 */
function getProperty(key, defaultValue) {
  var value = PropertiesService.getUserProperties().getProperty(key);
  return value !== null ? value : defaultValue;
}

/**
 * Sets a property in PropertiesService
 */
function setProperty(key, value) {
  PropertiesService.getUserProperties().setProperty(key, value);
}

/**
 * Sets up sync trigger based on frequency
 */
function setupSyncTrigger() {
  // Clear existing triggers first
  clearSyncTriggers();

  var frequency = parseInt(getProperty('syncFrequency', '60'));

  if (frequency >= 1440) {
    // Daily trigger
    ScriptApp.newTrigger('sync')
        .timeBased()
      .everyDays(1)
        .create();
  } else if (frequency >= 60) {
    // Hourly trigger
    ScriptApp.newTrigger('sync')
        .timeBased()
      .everyHours(Math.floor(frequency / 60))
        .create();
  } else {
    // Minutes trigger
    ScriptApp.newTrigger('sync')
        .timeBased()
      .everyMinutes(frequency)
        .create();
  }
}

/**
 * Clears all sync triggers
 */
function clearSyncTriggers() {
    var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'sync') {
        ScriptApp.deleteTrigger(trigger);
    }
  });
}

// ============================================================================
// SYNC LOGIC (Modified from original)
// ============================================================================

/**
 * Main sync function that syncs events between calendars
 */
function sync() {
  var destinationCalendarsInfo = JSON.parse(getProperty('destinationCalendars', '[]'));
  var sourceIds = JSON.parse(getProperty('sourceCalendars', '[]'));
  var numDaysOut = parseInt(getProperty('numDaysOut', '60'));
  var cloneEventPrefix = getProperty('cloneEventPrefix', '* ');

    if (destinationCalendarsInfo.length === 0 || sourceIds.length === 0) {
    throw new Error('Please configure source and destination calendars');
    }

    var today = new Date();
    var endDate = new Date();
    endDate.setDate(today.getDate() + numDaysOut);

    // Loop through each destination calendar
  for (var i = 0; i < destinationCalendarsInfo.length; i++) {
    var destinationCalendarInfo = destinationCalendarsInfo[i];

      try {
        var destinationCal = CalendarApp.getCalendarById(destinationCalendarInfo.id);

        if (!destinationCal) {
          Logger.log("ERROR: Cannot access destination calendar with ID: " + destinationCalendarInfo.id);
          continue;
        }

      // Get all events from destination calendar in the date range
      var existingEvents = destinationCal.getEvents(today, endDate);
      var eventsToDelete = [];

      // Find events that should be deleted (those with the clone prefix)
      for (var j = 0; j < existingEvents.length; j++) {
        var event = existingEvents[j];
        if (event.getTitle().indexOf(cloneEventPrefix) === 0) {
          eventsToDelete.push(event);
        }
      }

      // Delete existing cloned events
      for (var k = 0; k < eventsToDelete.length; k++) {
        eventsToDelete[k].deleteEvent();
      }

      // Loop through each source calendar
      for (var l = 0; l < sourceIds.length; l++) {
        var sourceId = sourceIds[l];

        if (sourceId === destinationCalendarInfo.id) {
          continue; // Skip if source and destination are the same
        }

          try {
            var sourceCal = CalendarApp.getCalendarById(sourceId);

            if (!sourceCal) {
              Logger.log("ERROR: Cannot access source calendar with ID: " + sourceId);
              continue;
            }

          // Get events from source calendar
            var sourceEvents = sourceCal.getEvents(today, endDate);

          // Clone events to destination calendar
          for (var m = 0; m < sourceEvents.length; m++) {
            var sourceEvent = sourceEvents[m];

            // Skip if event is already a cloned event
            if (sourceEvent.getTitle().indexOf(cloneEventPrefix) === 0) {
              continue;
            }

            // Create new event in destination calendar
            var newTitle = cloneEventPrefix + sourceEvent.getTitle();
            var newEvent = destinationCal.createEvent(
              newTitle,
              sourceEvent.getStartTime(),
              sourceEvent.getEndTime(),
              {
                description: sourceEvent.getDescription(),
                location: sourceEvent.getLocation()
              }
            );

            Logger.log("Cloned event: " + newTitle + " to " + destinationCalendarInfo.id);
          }

        } catch (sourceError) {
          Logger.log("ERROR accessing source calendar " + sourceId + ": " + sourceError.message);
        }
      }

    } catch (destError) {
      Logger.log("ERROR accessing destination calendar " + destinationCalendarInfo.id + ": " + destError.message);
    }
  }

  Logger.log("Sync completed successfully");
}

// ============================================================================
// DEBUG TEST FUNCTIONS - Run these in Apps Script editor
// ============================================================================

/**
 * Test function to check PropertiesService storage
 */
function testPropertiesStorage() {
  console.log('=== Testing PropertiesService Storage ===');

  // Test setting and getting a simple property
  setProperty('testKey', 'testValue');
  var retrieved = getProperty('testKey', 'defaultValue');
  console.log('Set: testValue, Retrieved: ' + retrieved);

  // Test setting and getting source calendars
  var testCalendars = ['calendar1@example.com', 'calendar2@example.com'];
  setProperty('sourceCalendars', JSON.stringify(testCalendars));
  var retrievedCalendars = JSON.parse(getProperty('sourceCalendars', '[]'));
  console.log('Set calendars: ' + JSON.stringify(testCalendars));
  console.log('Retrieved calendars: ' + JSON.stringify(retrievedCalendars));

  // Check current stored source calendars
  var currentSource = getProperty('sourceCalendars', '[]');
  console.log('Current stored source calendars: ' + currentSource);

  return 'Test completed - check logs';
}

/**
 * Test function to simulate toggle events
 */
function testToggleSimulation() {
  console.log('=== Testing Toggle Simulation ===');

  // Get available calendars
  var calendars = getUserCalendars();
  console.log('Available calendars: ' + JSON.stringify(calendars));

  if (calendars.length > 0) {
    var testCalendarId = calendars[0].id;
    console.log('Testing with calendar: ' + testCalendarId);

    // Simulate enabling a calendar
    var mockEvent = {
      parameters: { calendarId: testCalendarId },
      formInput: {}
    };
    mockEvent.formInput['source_' + testCalendarId] = true;

    console.log('Simulating toggle ON for: ' + testCalendarId);
    console.log('Form input: ' + JSON.stringify(mockEvent.formInput));

    // Test the toggle handler
    var result = onSourceCalendarToggle(mockEvent);
    console.log('Toggle result: ' + JSON.stringify(result));

    // Check if it was stored
    var storedCalendars = JSON.parse(getProperty('sourceCalendars', '[]'));
    console.log('Stored calendars after toggle: ' + JSON.stringify(storedCalendars));

    return 'Toggle test completed - check logs';
  } else {
    return 'No calendars available for testing';
  }
}

/**
 * Test function to check calendar retrieval
 */
function testCalendarRetrieval() {
  console.log('=== Testing Calendar Retrieval ===');

  try {
    var calendars = getUserCalendars();
    console.log('Found ' + calendars.length + ' calendars');

    calendars.forEach(function(calendar, index) {
      console.log('Calendar ' + index + ': ' + calendar.name + ' (ID: ' + calendar.id + ')');
    });

    return 'Calendar retrieval test completed - check logs';
  } catch (error) {
    console.error('Error retrieving calendars: ' + error.message);
    return 'Error: ' + error.message;
  }
}

/**
 * Clear all stored properties for testing
 */
function clearAllProperties() {
  console.log('=== Clearing All Properties ===');

  var properties = PropertiesService.getUserProperties();
  properties.deleteProperty('sourceCalendars');
  properties.deleteProperty('destinationCalendars');
  properties.deleteProperty('enableSync');
  properties.deleteProperty('syncFrequency');
  properties.deleteProperty('numDaysOut');
  properties.deleteProperty('cloneEventPrefix');
  properties.deleteProperty('lastSyncTime');

  console.log('All properties cleared');
  return 'Properties cleared';
}
