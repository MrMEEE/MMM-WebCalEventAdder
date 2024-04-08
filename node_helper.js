const NodeHelper = require("node_helper");
const fs = require('fs');
const path = require('path');
//const moment = require('moment-timezone');

module.exports = NodeHelper.create({
  start: function() {
    console.log("MMM-WebCalEventAdder helper started...");
  },

  socketNotificationReceived: function(notification, payload) {
      switch(notification) {
	  case "ADD_CALENDAR_EVENT":
	      this.addCalendarEvent(payload);
	      break;
	  case "UPDATE_CALENDAR_EVENT":
	      this.updateCalendarEvent(payload);
	      break;
	  case "DELETE_CALENDAR_EVENT":
      console.log ("socket received to delete event");
	      this.deleteCalendarEvent(payload);
	      break;
      }
  },

  addCalendarEvent: function(payload) {

      this.insertCalendarEvent(payload);
  },

  insertCalendarEvent: function(payload) {
    const startTime = moment(payload.startTime).tz("America/New_York").format();
    const endTime = moment(payload.endTime).tz("America/New_York").format();

    // Retrieve the allDay property directly from the payload
    const isAllDay = payload.allDay;

    const event = {
      summary: payload.eventTitle,
    };

    if (isAllDay) {
        // If it's an "all day" event, set only the date property
        event.start = {
            date: moment(startTime).format('YYYY-MM-DD'),
        };
        event.end = {
            date: moment(startTime).add(1, 'days').format('YYYY-MM-DD'),  // End date is one day after the start date
        };
    } else {
        // Regular event with specific start and end times
        event.start = {
            dateTime: startTime,
            timeZone: "America/New_York",
        };
        event.end = {
            dateTime: endTime,
            timeZone: "America/New_York",
        };
    }

    console.log("Constructed event: ", event); // Log constructed event

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    calendar.events.insert(
      {
        auth: oauth2Client,
        calendarId: "family",
        resource: event,
      },
      (err, event) => {
		  if (err) {
			console.log("There was an error contacting the Calendar service: ", err);
			return;
		  }

		  console.log("Event created: %s", event.data.htmlLink);
		  this.sendSocketNotification("EVENT_ADD_SUCCESS_MAIN", {});
		  console.log("Event has been created and sent to main module");
	}
  );
},

  updateCalendarEvent: function(payload) {
    console.log('Received payload:', payload);

	const startTime = moment(payload.startTime).tz("America/New_York").format();
	const endTime = moment(payload.endTime).tz("America/New_York").format();
	
	const event = {
	  summary: payload.eventTitle,
	  start: {
	      dateTime: startTime,
	      timeZone: "America/New_York",
	  },
	  end: {
	      dateTime: endTime,
	      timeZone: "America/New_York",
	  },
	};
	
	calendar.events.update({
	  calendarId: 'primary',
	  eventId: payload.eventId,  // Assuming you have the eventId in your payload
	  resource: event
	}, (err, event) => {
	  if (err) {
	    console.log('There was an error updating the event: ', err);
	    return;
	  }
	  console.log('Event updated: %s', event.data.htmlLink);
	  this.sendSocketNotification("EVENT_UPDATE_SUCCESS", {});
	});

  },

  deleteCalendarEvent: function(payload) {
      const oauth2Client = new OAuth2(
	credentials.installed.client_id,
	credentials.installed.client_secret,
	credentials.installed.redirect_uris[0],
      );

      // Check if we have previously stored a token.
	calendar.events.delete({
	  calendarId: 'primary',
	  eventId: payload.eventId,  // Assuming you have the eventId in your payload
	}, (err) => {
	  if (err) {
	    console.log('There was an error deleting the event: ', err);
	    return;
	  }
	  console.log('Event deleted');
	  this.sendSocketNotification("EVENT_DELETE_SUCCESS", {});
	});

  },
})

