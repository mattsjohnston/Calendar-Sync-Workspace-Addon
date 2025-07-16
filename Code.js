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

  // Install Triggers Button
  var installTriggersButton = CardService.newTextButton()
    .setText('Install Event Triggers')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('installEventTriggers'));

  // Sync Now Button
  var syncNowButton = CardService.newTextButton()
    .setText('Sync Now')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('syncNow'))
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED);

  actionSection.addWidget(CardService.newButtonSet()
    .addButton(installTriggersButton)
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

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setType(CardService.NotificationType.INFO)
      .setText('Sync ' + (enabled ? 'enabled' : 'disabled'))
    )
    .setNavigation(CardService.newNavigation().updateCard(createMainCard()))
    .build();
}

/**
 * Handles days out changes
 */
function onDaysOutChange(e) {
  var oldDaysOut = parseInt(getProperty('numDaysOut', '60'));
  var newDaysOut = parseInt(e.formInput.numDaysOut);

  // If the new value is smaller, clean up events beyond the new window
  if (newDaysOut < oldDaysOut) {
    cleanupEventsBeyondSyncWindow(oldDaysOut, newDaysOut);
  }

  setProperty('numDaysOut', newDaysOut.toString());

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

  // If sync is enabled, refresh the triggers to reflect the change in source calendars
  if (getProperty('enableSync', 'false') === 'true') {
    try {
      clearAllTriggers();
      var triggersInstalled = 0;

      sourceCalendars.forEach(function(calendarId) {
        try {
          ScriptApp.newTrigger('onCalendarEventUpdate')
            .forUserCalendar(calendarId)
            .onEventUpdated()
            .create();
          triggersInstalled++;
        } catch (error) {
          Logger.log('Failed to refresh trigger for calendar ' + calendarId + ': ' + error.toString());
        }
      });

      Logger.log('Refreshed ' + triggersInstalled + ' triggers after calendar change');
    } catch (error) {
      Logger.log('Error refreshing triggers: ' + error.toString());
    }
  }

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
 * Installs installable triggers for calendar events
 */
function installEventTriggers() {
  try {
    Logger.log('=== INSTALLING EVENT TRIGGERS ===');

    // Clear any existing triggers first
    clearAllTriggers();

    var sourceIds = JSON.parse(getProperty('sourceCalendars', '[]'));
    Logger.log('Source calendars to install triggers for: ' + JSON.stringify(sourceIds));

    if (sourceIds.length === 0) {
      Logger.log('No source calendars configured');
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
          .setType(CardService.NotificationType.ERROR)
          .setText('Please select source calendars first')
        )
        .build();
    }

    var triggersInstalled = 0;
    var errors = [];

    sourceIds.forEach(function(calendarId) {
      try {
        Logger.log('Attempting to install trigger for calendar: ' + calendarId);

        // Verify we can access the calendar first
        var calendar = CalendarApp.getCalendarById(calendarId);
        if (!calendar) {
          Logger.log('Cannot access calendar: ' + calendarId);
          errors.push('Cannot access calendar: ' + calendarId);
          return;
        }

        Logger.log('Calendar found: ' + calendar.getName());

        // Create installable trigger for this calendar
        var trigger = ScriptApp.newTrigger('onCalendarEventUpdate')
          .forUserCalendar(calendarId)
          .onEventUpdated()
          .create();

        Logger.log('Trigger created successfully with ID: ' + trigger.getUniqueId());
        triggersInstalled++;

      } catch (error) {
        Logger.log('Failed to install trigger for calendar ' + calendarId + ': ' + error.toString());
        errors.push('Calendar ' + calendarId + ': ' + error.message);
      }
    });

    Logger.log('Total triggers installed: ' + triggersInstalled);
    Logger.log('Errors encountered: ' + JSON.stringify(errors));

    var message = 'Installed ' + triggersInstalled + ' event triggers';
    if (errors.length > 0) {
      message += '. Errors: ' + errors.join(', ');
    }

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setType(triggersInstalled > 0 ? CardService.NotificationType.INFO : CardService.NotificationType.ERROR)
        .setText(message)
      )
      .build();

  } catch (error) {
    Logger.log('Error in installEventTriggers: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setType(CardService.NotificationType.ERROR)
        .setText('Error installing triggers: ' + error.message)
      )
      .build();
  }
}

/**
 * Clears all installable triggers for this script
 */
function clearAllTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  Logger.log('Clearing ' + triggers.length + ' existing triggers');

  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });
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

  // Sort calendars alphabetically by name
  calendars.sort(function(a, b) {
    return a.name.localeCompare(b.name);
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
 * Sets up sync triggers based on event updates in source calendars.
 */
function setupSyncTrigger() {
  // Clear existing triggers first
  clearSyncTriggers();

  // Only set up triggers if sync is enabled
  if (getProperty('enableSync', 'false') !== 'true') {
    Logger.log('Sync is disabled, not creating triggers.');
    return;
  }

  var sourceIds = JSON.parse(getProperty('sourceCalendars', '[]'));
  Logger.log('Setting up event triggers for ' + sourceIds.length + ' source calendars.');

  sourceIds.forEach(function(calendarId) {
    try {
      // Check if calendar exists and we can access it.
      var calendar = CalendarApp.getCalendarById(calendarId);
      if (calendar) {
        ScriptApp.newTrigger('sync')
          .forUserCalendar(calendarId)
          .onEventUpdated()
          .create();
        Logger.log('Created event update trigger for calendar: ' + calendarId);
      } else {
        Logger.log('Could not find calendar with ID: ' + calendarId + '. Trigger not created.');
      }
    } catch (e) {
      // Log error but continue, so one failed calendar doesn't stop others.
      Logger.log('Failed to create trigger for calendar ' + calendarId + ': ' + e.toString());
    }
  });
}

/**
 * Clears all sync triggers
 */
function clearSyncTriggers() {
    var triggers = ScriptApp.getProjectTriggers();
    Logger.log('Found ' + triggers.length + ' project triggers to check for deletion.');
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'sync') {
        Logger.log('Deleting trigger with ID: ' + trigger.getUniqueId());
        ScriptApp.deleteTrigger(trigger);
    }
  });
}

// ============================================================================
// SYNC LOGIC (Modified from original)
// ============================================================================

/**
 * Cleans up synced events that are beyond the new, shorter sync window.
 * This is called when the user reduces the 'Days to sync ahead' value.
 * @param {number} oldDays The previous number of days to sync ahead.
 * @param {number} newDays The new number of days to sync ahead.
 */
function cleanupEventsBeyondSyncWindow(oldDays, newDays) {
  var destinationCalendarsInfo = JSON.parse(getProperty('destinationCalendars', '[]'));
  var cloneEventPrefix = getProperty('cloneEventPrefix', '* ');

  if (destinationCalendarsInfo.length === 0) {
    Logger.log('No destination calendars configured for cleanup.');
    return;
  }

  var today = new Date();

  // The start of the cleanup window is the day after the new sync period ends.
  var cleanupStartDate = new Date();
  cleanupStartDate.setDate(today.getDate() + newDays);

  // The end of the cleanup window is the day the old sync period ended.
  var cleanupEndDate = new Date();
  cleanupEndDate.setDate(today.getDate() + oldDays);

  Logger.log('Cleaning events from ' + cleanupStartDate.toLocaleDateString() + ' to ' + cleanupEndDate.toLocaleDateString());

  for (var i = 0; i < destinationCalendarsInfo.length; i++) {
    var destinationCalendarInfo = destinationCalendarsInfo[i];
    try {
      var destinationCal = CalendarApp.getCalendarById(destinationCalendarInfo.id);
      if (!destinationCal) {
        Logger.log("ERROR: Cannot access destination calendar for cleanup with ID: " + destinationCalendarInfo.id);
        continue;
      }

      var eventsToCleanup = destinationCal.getEvents(cleanupStartDate, cleanupEndDate);
      Logger.log('Found ' + eventsToCleanup.length + ' events to check in calendar ' + destinationCal.getName());

      for (var j = 0; j < eventsToCleanup.length; j++) {
        var event = eventsToCleanup[j];
        if (event.getTitle().indexOf(cloneEventPrefix) === 0) {
          event.deleteEvent();
          Logger.log('Deleted obsolete event: "' + event.getTitle() + '" from ' + destinationCal.getName());
        }
      }
    } catch (e) {
      Logger.log('ERROR during cleanup for calendar ' + destinationCalendarInfo.id + ': ' + e.message);
    }
  }
}

/**
 * Simple function to test if eventUpdateTrigger is firing
 * This will be called by the eventUpdateTrigger to test if it works
 */
function onCalendarEventUpdate(e) {
  Logger.log('=== EVENT UPDATE TRIGGER FIRED ===');
  Logger.log('Timestamp: ' + new Date().toISOString());
  Logger.log('Event object: ' + JSON.stringify(e));

  // Log basic event information if available
  if (e && e.calendar) {
    Logger.log('Calendar ID: ' + e.calendar.calendarId);
  }

  if (e && e.eventUpdated) {
    Logger.log('Event updated: ' + JSON.stringify(e.eventUpdated));
  }

  // Always log that the trigger fired, even if sync is disabled
  Logger.log('Trigger fired successfully - calling sync function');

  // Call the actual sync function
  sync(e);
}

/**
 * Test function to verify triggers are working by creating a test event
 */
function testTriggerWithEvent() {
  Logger.log('=== TESTING TRIGGER WITH EVENT CREATION ===');

  var sourceIds = JSON.parse(getProperty('sourceCalendars', '[]'));
  if (sourceIds.length === 0) {
    Logger.log('No source calendars configured for testing');
    return 'No source calendars configured';
  }

  try {
    var testCalendarId = sourceIds[0];
    var calendar = CalendarApp.getCalendarById(testCalendarId);

    if (!calendar) {
      Logger.log('Cannot access calendar: ' + testCalendarId);
      return 'Cannot access calendar';
    }

    Logger.log('Creating test event in calendar: ' + calendar.getName());

    // Create a test event
    var startTime = new Date();
    startTime.setHours(startTime.getHours() + 1); // 1 hour from now
    var endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); // 1 hour duration

    var testEvent = calendar.createEvent(
      'Test Event - ' + new Date().toLocaleTimeString(),
      startTime,
      endTime,
      {
        description: 'This is a test event created to verify triggers are working'
      }
    );

    Logger.log('Test event created: ' + testEvent.getTitle());
    Logger.log('Event ID: ' + testEvent.getId());

    // Wait a moment then modify the event to trigger the update
    Utilities.sleep(1000);

    testEvent.setTitle('MODIFIED - ' + testEvent.getTitle());
    Logger.log('Event title modified to trigger update');

    return 'Test event created and modified - check executions for trigger firing';

  } catch (error) {
    Logger.log('Error creating test event: ' + error.toString());
    return 'Error: ' + error.message;
  }
}

/**
 * Main sync function that syncs events between calendars
 */
function sync(e) {
  Logger.log('=== SYNC FUNCTION CALLED ===');
  Logger.log('Event object: ' + JSON.stringify(e));
  Logger.log('Current time: ' + new Date().toISOString());

  // Check if sync is enabled
  var syncEnabled = getProperty('enableSync', 'false');
  Logger.log('Sync enabled setting: ' + syncEnabled);

  if (syncEnabled !== 'true') {
    Logger.log('Sync is disabled, aborting.');
    return; // Exit if sync is not enabled
  }

  var sourceIds = JSON.parse(getProperty('sourceCalendars', '[]'));
  Logger.log('Source calendars: ' + JSON.stringify(sourceIds));

  // If triggered by an event, check if it's from a source calendar
  if (e && e.calendar && e.calendar.calendarId) {
    Logger.log('Event triggered from calendar: ' + e.calendar.calendarId);
    if (sourceIds.indexOf(e.calendar.calendarId) === -1) {
      Logger.log('Event trigger from non-source calendar (' + e.calendar.calendarId + '), ignoring.');
      return; // Not a calendar we should sync from
    }
    Logger.log('Sync triggered by an event in source calendar: ' + e.calendar.calendarId);
  } else {
    Logger.log('Sync triggered manually via "Sync Now" or no event data available.');
  }

  var destinationCalendarsInfo = JSON.parse(getProperty('destinationCalendars', '[]'));
  Logger.log('Destination calendars: ' + JSON.stringify(destinationCalendarsInfo));

  if (destinationCalendarsInfo.length === 0) {
    Logger.log('No destination calendars configured, aborting.');
    return;
  }

  var numDaysOut = parseInt(getProperty('numDaysOut', '60'));
  var cloneEventPrefix = getProperty('cloneEventPrefix', '* ');

  Logger.log('Starting sync with ' + sourceIds.length + ' source calendars and ' + destinationCalendarsInfo.length + ' destination calendars');
  Logger.log('Days out: ' + numDaysOut + ', Prefix: "' + cloneEventPrefix + '"');

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
  setProperty('lastSyncTime', new Date().toLocaleString());
}

// ============================================================================
// DEBUG TEST FUNCTIONS - Run these in Apps Script editor
// ============================================================================

/**
 * Debug function to test trigger creation and list current triggers
 */
function debugTriggers() {
  Logger.log('=== DEBUG TRIGGERS ===');

  // List current triggers
  var triggers = ScriptApp.getProjectTriggers();
  Logger.log('Current triggers: ' + triggers.length);
  triggers.forEach(function(trigger, i) {
    Logger.log('  Trigger ' + (i + 1) + ':');
    Logger.log('    Handler: ' + trigger.getHandlerFunction());
    Logger.log('    Type: ' + trigger.getEventType());
    Logger.log('    Source: ' + trigger.getTriggerSource());
    if (trigger.getTriggerSource() === ScriptApp.TriggerSource.CALENDAR) {
      Logger.log('    Calendar ID: ' + trigger.getTriggerSourceId());
    }
    Logger.log('    Unique ID: ' + trigger.getUniqueId());
  });

  // Test creating a trigger for the first source calendar
  var sourceIds = JSON.parse(getProperty('sourceCalendars', '[]'));
  if (sourceIds.length > 0) {
    var testCalendarId = sourceIds[0];
    Logger.log('Testing trigger creation for calendar: ' + testCalendarId);

    try {
      var calendar = CalendarApp.getCalendarById(testCalendarId);
      Logger.log('Calendar access test: ' + (calendar ? 'SUCCESS - ' + calendar.getName() : 'FAILED'));

      if (calendar) {
        var trigger = ScriptApp.newTrigger('onCalendarEventUpdate')
          .forUserCalendar(testCalendarId)
          .onEventUpdated()
          .create();
        Logger.log('Test trigger created with ID: ' + trigger.getUniqueId());
      }
    } catch (error) {
      Logger.log('Test trigger creation failed: ' + error.toString());
    }
  }

  return 'Debug completed - check logs';
}

/**
 * Test function to simulate an eventUpdateTrigger
 * Run this manually to test if the sync logic works
 */
function testEventUpdateTrigger() {
  Logger.log('=== TESTING EVENT UPDATE TRIGGER ===');

  // Get the first source calendar to simulate an event from
  var sourceIds = JSON.parse(getProperty('sourceCalendars', '[]'));
  if (sourceIds.length === 0) {
    Logger.log('No source calendars configured for testing');
    return 'No source calendars configured';
  }

  // Simulate an event update trigger
  var mockEvent = {
    calendar: {
      calendarId: sourceIds[0]
    },
    eventUpdated: {
      calendarId: sourceIds[0]
    }
  };

  Logger.log('Simulating event update from calendar: ' + sourceIds[0]);
  sync(mockEvent);

  return 'Test completed - check logs';
}

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
