import React, { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faPlus } from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";

const viewOptions = [
  { key: "timeGridDay", label: "Day" },
  { key: "timeGridWeek", label: "Week" },
  { key: "dayGridMonth", label: "Month" },
];

const starterEvents = [];
const palette = ["#c6e8ee", "#f7c8c8", "#fde68a", "#c7d2fe", "#a5f3fc"];

export default function CalendarPage() {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState(starterEvents);
  const [activeView, setActiveView] = useState("timeGridDay");
  const [monthPicker, setMonthPicker] = useState(dayjs().format("YYYY-MM"));
  const [titleOverride, setTitleOverride] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    location: "",
    date: dayjs().format("YYYY-MM-DD"),
    startTime: "09:00",
    endTime: "10:00",
    notes: "",
    repeat: "none",
  });

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const label = dayjs().hour(i).minute(0).format("hh:mm A");
    const value = dayjs().hour(i).minute(0).format("HH:mm");
    return { label, value };
  });

  const addEventObjects = (items) => {
    setEvents((prev) => [...prev, ...items]);
  };

  const buildEvent = (title, dateStr, startTime, endTime, extra = {}) => {
    if (!title || !dateStr || !startTime || !endTime) return null;
    const start = dayjs(`${dateStr} ${startTime}`).toDate();
    const end = dayjs(`${dateStr} ${endTime}`).toDate();
    const color = palette[Math.floor(Math.random() * palette.length)];
    return { title, start, end, color, ...extra };
  };

  const createRecurring = (base, repeat) => {
    const occurrences = [];
    const baseStart = dayjs(base.start);
    const baseEnd = dayjs(base.end);
    const pushInstance = (start) => {
      const end = start.add(baseEnd.diff(baseStart, "minute"), "minute").toDate();
      occurrences.push({ ...base, start: start.toDate(), end });
    };

    const addBy = (unit, count = 12, step = 1, filterFn) => {
      for (let i = 0; i < count; i++) {
        const start = baseStart.add(i * step, unit);
        if (filterFn && !filterFn(start)) continue;
        pushInstance(start);
      }
    };

    switch (repeat) {
      case "hourly":
        addBy("hour", 12);
        break;
      case "daily":
        addBy("day", 12);
        break;
      case "weekdays":
        addBy("day", 30, 1, (d) => d.day() >= 1 && d.day() <= 5);
        break;
      case "weekends":
        addBy("day", 30, 1, (d) => d.day() === 0 || d.day() === 6);
        break;
      case "weekly":
        addBy("week", 8);
        break;
      case "biweekly":
        addBy("week", 8, 2);
        break;
      case "monthly":
        addBy("month", 6);
        break;
      case "every3":
        addBy("month", 4, 3);
        break;
      case "every6":
        addBy("month", 2, 6);
        break;
      case "yearly":
        addBy("year", 2);
        break;
      default:
        occurrences.push(base);
    }

    return occurrences;
  };

  const openModal = (dateStr, start = "09:00", end = "10:00") => {
    setForm((prev) => ({
      ...prev,
      date: dateStr,
      startTime: start,
      endTime: end,
    }));
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleDateClick = (info) => {
    openModal(info.dateStr);
  };

  const handleSelect = (info) => {
    const start = dayjs(info.start);
    const end = dayjs(info.end || info.start).add(1, "hour");
    openModal(start.format("YYYY-MM-DD"), start.format("HH:mm"), end.format("HH:mm"));
  };

  const goToPrev = () => {
    const api = calendarRef.current?.getApi();
    api?.prev();
    syncMonthPicker();
  };

  const goToNext = () => {
    const api = calendarRef.current?.getApi();
    api?.next();
    syncMonthPicker();
  };

  const changeView = (view) => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.changeView(view);
    setActiveView(view);
    syncMonthPicker();
  };

  const currentTitle = useMemo(() => {
    if (titleOverride) return titleOverride;
    const api = calendarRef.current?.getApi();
    const now = api ? api.getDate() : new Date();
    return dayjs(now).format("MMMM YYYY");
  }, [activeView, events, titleOverride, monthPicker]);

  const handleAddEventButton = () => {
    openModal(dayjs().format("YYYY-MM-DD"), dayjs().format("HH:00"), dayjs().add(1, "hour").format("HH:00"));
  };

  const goToday = () => {
    const api = calendarRef.current?.getApi();
    api?.today();
    syncMonthPicker();
  };

  const syncMonthPicker = () => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const current = api.getDate();
    setMonthPicker(dayjs(current).format("YYYY-MM"));
  };

  const handleMonthChange = (e) => {
    const value = e.target.value;
    setMonthPicker(value);
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const d = dayjs(value + "-01").toDate();
    api.gotoDate(d);
    setTitleOverride(dayjs(d).format("MMMM YYYY"));
  };

  const handleModalChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const base = buildEvent(form.title.trim(), form.date, form.startTime, form.endTime, {
      location: form.location.trim(),
      notes: form.notes.trim(),
    });
    if (!base) return;
    const occurrences = createRecurring(base, form.repeat);
    addEventObjects(occurrences);
    setModalOpen(false);
  };

  return (
    <>
      <div className="calendar-shell">
        <div className="calendar-header">
          <div>
            <div className="calendar-title">{currentTitle}</div>
            <div className="calendar-sub">Plan your day, week, or month.</div>
          </div>
          <div className="calendar-actions">
            <div className="view-toggle">
              {viewOptions.map((v) => (
                <button
                  key={v.key}
                  className={`view-btn ${activeView === v.key ? "active" : ""}`}
                  onClick={() => changeView(v.key)}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div className="nav-arrows">
              <button className="ghost-btn" onClick={goToPrev}><FontAwesomeIcon icon={faChevronLeft} /></button>
              <button className="ghost-btn" onClick={goToNext}><FontAwesomeIcon icon={faChevronRight} /></button>
            </div>

            <div className="month-picker">
              <input type="month" value={monthPicker} onChange={handleMonthChange} />
            </div>

            <button className="add-event-btn" onClick={handleAddEventButton}>
              <FontAwesomeIcon icon={faPlus} /> Add Event
            </button>
          </div>
        </div>

        <div className="calendar-wrapper">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={activeView}
            headerToolbar={false}
            events={events}
            height="auto"
            selectable
            selectMirror
            dateClick={handleDateClick}
            select={handleSelect}
            eventDisplay="block"
            nowIndicator
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            allDaySlot={false}
          />
        </div>
      </div>

      {modalOpen && (
        <div className="cal-modal-backdrop" onClick={closeModal}>
          <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cal-modal-header">
              <div className="calendar-title">Add Schedule</div>
              <button className="ghost-btn" onClick={closeModal}>Close</button>
            </div>
            <form className="cal-form" onSubmit={handleSubmit}>
              <label>
                Title
                <input
                  value={form.title}
                  onChange={(e) => handleModalChange("title", e.target.value)}
                  required
                />
              </label>
              <label>
                Location
                <input
                  value={form.location}
                  onChange={(e) => handleModalChange("location", e.target.value)}
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleModalChange("date", e.target.value)}
                  required
                />
              </label>
              <div className="cal-row">
                <label>
                  Start
                  <select
                    value={form.startTime}
                    onChange={(e) => handleModalChange("startTime", e.target.value)}
                  >
                    {timeOptions.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  End
                  <select
                    value={form.endTime}
                    onChange={(e) => handleModalChange("endTime", e.target.value)}
                  >
                    {timeOptions.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Notes
                <textarea
                  value={form.notes}
                  onChange={(e) => handleModalChange("notes", e.target.value)}
                  rows={3}
                />
              </label>
              <label>
                Repeat
                <select
                  value={form.repeat}
                  onChange={(e) => handleModalChange("repeat", e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="every3">Every 3 months</option>
                  <option value="every6">Every 6 months</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>
              <div className="cal-actions">
                <button type="button" className="ghost-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="add-event-btn solid">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
