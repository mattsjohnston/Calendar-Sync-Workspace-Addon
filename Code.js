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
  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Source Calendars')
      .setSubtitle('Select calendars to sync FROM')
    );

  var calendars = getUserCalendars();
  var sourceCalendars = JSON.parse(getProperty('sourceCalendars', '[]'));

  var calendarSection = CardService.newCardSection()
    .setHeader('Available Calendars');

  calendars.forEach(function(calendar) {
    var isSelected = sourceCalendars.indexOf(calendar.id) !== -1;

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
  var calendarId = e.parameters.calendarId;
  var formValue = e.formInput['source_' + calendarId];
  var isEnabled = formValue === 'true';  // Only true if switch is on

  var sourceCalendars = JSON.parse(getProperty('sourceCalendars', '[]'));

  if (isEnabled) {
    if (sourceCalendars.indexOf(calendarId) === -1) {
      sourceCalendars.push(calendarId);
    }
  } else {
    var index = sourceCalendars.indexOf(calendarId);
    if (index !== -1) {
      sourceCalendars.splice(index, 1);
    }
  }

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

    // ------------------------------------------------------------------
    // Create a backup hourly trigger to catch any missed updates
    // ------------------------------------------------------------------
    try {
      ScriptApp.newTrigger('sync')
        .timeBased()
        .everyHours(1)
        .create();
      Logger.log('Hourly backup trigger installed successfully');
    } catch (err) {
      Logger.log('Failed to install hourly backup trigger: ' + err.toString());
      errors.push('Hourly trigger: ' + err.message);
    }

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
    Logger.log('Deleting trigger: ' + trigger.getHandlerFunction() + ' (ID: ' + trigger.getUniqueId() + ')');
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
 * Legacy functions removed - use installEventTriggers() and clearAllTriggers() instead
 */

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
 * Main sync function that syncs events between calendars
 * Can do either a full sync or a targeted sync of a specific event
 */
function sync(e) {
  // Check if a sync is already in progress
  var syncInProgress = getProperty('syncInProgress', 'false');
  if (syncInProgress === 'true') {
    Logger.log('Another sync is already in progress – aborting this execution to avoid loops');
    return;
  }

  // Set the sync in progress flag
  setProperty('syncInProgress', 'true');

  try {
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

    // Check if this is a targeted sync (triggered by specific event update)
    if (e && e.calendarId && e.triggerUid) {
      Logger.log('Performing targeted sync for calendar: ' + e.calendarId);
      syncSpecificEvent(e);
    } else {
      Logger.log('Performing full sync');
      syncAllEvents();
    }

    setProperty('lastSyncTime', new Date().toLocaleString());
  } finally {
    // Always clear the sync in progress flag
    setProperty('syncInProgress', 'false');
  }
}

/**
 * Syncs events from a specific calendar that was updated
 * Since we don't have the specific event ID, we'll do a targeted sync for the calendar
 */
function syncSpecificEvent(e) {
  var sourceCalendarId = e.calendarId;

  Logger.log('Syncing events from calendar: ' + sourceCalendarId);

  var sourceIds = JSON.parse(getProperty('sourceCalendars', '[]'));
  var destinationCalendarsInfo = JSON.parse(getProperty('destinationCalendars', '[]'));
  var cloneEventPrefix = getProperty('cloneEventPrefix', '* ');
  var numDaysOut = parseInt(getProperty('numDaysOut', '60'));

  if (sourceIds.indexOf(sourceCalendarId) === -1) {
    Logger.log('Event from non-source calendar, ignoring');
    return;
  }

  if (destinationCalendarsInfo.length === 0) {
    Logger.log('No destination calendars configured');
    return;
  }

  try {
    var sourceCalendar = CalendarApp.getCalendarById(sourceCalendarId);
    if (!sourceCalendar) {
      Logger.log('Cannot access source calendar: ' + sourceCalendarId);
      return;
    }

    Logger.log('Found source calendar: ' + sourceCalendar.getName());

    // Get date range for sync
    var today = new Date();
    var endDate = new Date();
    endDate.setDate(today.getDate() + numDaysOut);

    // Sync this calendar to all destination calendars
    destinationCalendarsInfo.forEach(function(destInfo) {
      if (destInfo.id === sourceCalendarId) {
        return; // Skip if destination is same as source
      }

      try {
        var destCalendar = CalendarApp.getCalendarById(destInfo.id);
        if (!destCalendar) {
          Logger.log('Cannot access destination calendar: ' + destInfo.id);
          return;
        }

        // Get existing cloned events from this source calendar in destination
        var existingEvents = destCalendar.getEvents(today, endDate);
        var eventsToDelete = [];

        // Find events that should be deleted (those with the clone prefix from this source)
        for (var j = 0; j < existingEvents.length; j++) {
          var event = existingEvents[j];
          if (event.getTitle().indexOf(cloneEventPrefix) === 0) {
            eventsToDelete.push(event);
          }
        }

        // Delete existing cloned events from this source calendar
        for (var k = 0; k < eventsToDelete.length; k++) {
          eventsToDelete[k].deleteEvent();
        }

        // Get events from source calendar
        var sourceEvents = sourceCalendar.getEvents(today, endDate);

        // Clone events to destination calendar
        for (var m = 0; m < sourceEvents.length; m++) {
          var sourceEvent = sourceEvents[m];

          // Skip if event is already a cloned event
          if (sourceEvent.getTitle().indexOf(cloneEventPrefix) === 0) {
            continue;
          }

          // Create new event in destination calendar
          var newTitle = cloneEventPrefix + sourceEvent.getTitle();
          var newEvent = destCalendar.createEvent(
            newTitle,
            sourceEvent.getStartTime(),
            sourceEvent.getEndTime(),
            {
              description: sourceEvent.getDescription(),
              location: sourceEvent.getLocation()
            }
          );

          Logger.log('Synced event "' + newTitle + '" to ' + destCalendar.getName());
        }

      } catch (error) {
        Logger.log('Error syncing to destination calendar ' + destInfo.id + ': ' + error.toString());
      }
    });

  } catch (error) {
    Logger.log('Error in targeted sync: ' + error.toString());
  }
}

/**
 * Note: The targeted sync approach now works at the calendar level rather than
 * individual event level, so event-specific cleanup functions are no longer needed.
 * The calendar-level sync will handle all events for the updated calendar.
 */

/**
 * Performs a full sync of all events (original function logic)
 */
function syncAllEvents() {
  var destinationCalendarsInfo = JSON.parse(getProperty('destinationCalendars', '[]'));
  var sourceIds = JSON.parse(getProperty('sourceCalendars', '[]'));
  var numDaysOut = parseInt(getProperty('numDaysOut', '60'));
  var cloneEventPrefix = getProperty('cloneEventPrefix', '* ');

  Logger.log('Starting full sync with ' + sourceIds.length + ' source calendars and ' + destinationCalendarsInfo.length + ' destination calendars');
  Logger.log('Days out: ' + numDaysOut + ', Prefix: "' + cloneEventPrefix + '"');

  if (destinationCalendarsInfo.length === 0) {
    Logger.log('No destination calendars configured, aborting.');
    return;
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

  Logger.log("Full sync completed successfully");
}

// ============================================================================
// UTILITY FUNCTIONS FOR TRIGGER MANAGEMENT
// ============================================================================

/**
 * Debug function to list current triggers
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

  return 'Debug completed - check logs';
}

/**
 * Helper function to clear all triggers and start fresh
 * Run this if you're experiencing issues with duplicate triggers
 */
function clearAllTriggersAndReinstall() {
  Logger.log('=== CLEARING ALL TRIGGERS AND REINSTALLING ===');

  // Clear all existing triggers
  clearAllTriggers();

  // Wait a moment
  Utilities.sleep(1000);

  // Reinstall triggers
  var sourceIds = JSON.parse(getProperty('sourceCalendars', '[]'));
  Logger.log('Reinstalling triggers for ' + sourceIds.length + ' source calendars');

  if (sourceIds.length === 0) {
    Logger.log('No source calendars configured');
    return 'No source calendars configured';
  }

  var triggersInstalled = 0;
  var errors = [];

  sourceIds.forEach(function(calendarId) {
    try {
      var calendar = CalendarApp.getCalendarById(calendarId);
      if (!calendar) {
        errors.push('Cannot access calendar: ' + calendarId);
        return;
      }

      var trigger = ScriptApp.newTrigger('onCalendarEventUpdate')
        .forUserCalendar(calendarId)
        .onEventUpdated()
        .create();

      Logger.log('Installed trigger for ' + calendar.getName() + ' (ID: ' + trigger.getUniqueId() + ')');
      triggersInstalled++;

    } catch (error) {
      Logger.log('Failed to install trigger for ' + calendarId + ': ' + error.toString());
      errors.push('Calendar ' + calendarId + ': ' + error.message);
    }
  });

  var result = 'Installed ' + triggersInstalled + ' triggers';
  if (errors.length > 0) {
    result += '. Errors: ' + errors.join(', ');
  }

  Logger.log(result);
  return result;
}










