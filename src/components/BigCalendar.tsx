"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import { calendarEvents } from "@/lib/data";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { useState } from "react";

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

const BigCalendar = () => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);
  const [events, setEvents] = useState(() =>
    calendarEvents.map((event, index) => ({
      ...event,
      id: index + 1, // Add unique ID
      start: new Date(event.start),
      end: new Date(event.end),
    }))
  );

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  // Handle event drag and drop
  const onEventDrop = ({ event, start, end, isAllDay }: any) => {
    const updatedEvent = { ...event, start, end, isAllDay };

    setEvents((prevEvents) =>
      prevEvents.map((existingEvent) =>
        existingEvent.id === event.id ? updatedEvent : existingEvent
      )
    );

    console.log("Event moved:", updatedEvent);
  };

  // Handle event resize
  const onEventResize = ({ event, start, end }: any) => {
    const updatedEvent = { ...event, start, end };

    setEvents((prevEvents) =>
      prevEvents.map((existingEvent) =>
        existingEvent.id === event.id ? updatedEvent : existingEvent
      )
    );

    console.log("Event resized:", updatedEvent);
  };

  // Handle selecting a time slot to create new events
  const onSelectSlot = ({ start, end }: any) => {
    const title = window.prompt("Enter event title:");
    if (title) {
      const newEvent = {
        id: Date.now(), // Use timestamp for unique ID
        title,
        start,
        end,
        allDay: false,
      };
      setEvents([...events, newEvent]);
      console.log("New event created:", newEvent);
    }
  };

  return (
    <DragAndDropCalendar
      localizer={localizer}
      events={events}
      startAccessor={(event: any) => event.start}
      endAccessor={(event: any) => event.end}
      views={["work_week", "day"]}
      view={view}
      style={{ height: "98%" }}
      onView={handleOnChangeView}
      onEventDrop={onEventDrop}
      onEventResize={onEventResize}
      onSelectSlot={onSelectSlot}
      selectable
      resizable
      min={new Date(2025, 1, 0, 8, 0, 0)}
      max={new Date(2025, 1, 0, 17, 0, 0)}
      defaultDate={new Date(2025, 5, 12)}
    />
  );
};

export default BigCalendar;
