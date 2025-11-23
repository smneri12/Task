import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const CalendarPage = () => {
  const [events, setEvents] = useState([
    { title: "Math Assignment", date: "2025-11-20" },
    { title: "Project Meeting", date: "2025-11-22" },
  ]);

  const handleDateClick = (info) => {
    const title = prompt("Enter event title:");
    if (title) setEvents([...events, { title, date: info.dateStr }]);
  };

  return (
    <div className="container">
      <h2 className="header-title">Calendar</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        height="auto"
      />
    </div>
  );
};

export default CalendarPage;
