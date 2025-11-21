// HIGHLIGHT: full "Book a Demo" page component
import React, { useMemo, useState } from "react";
import { PublicNavbar } from "../LandingPage/PublicNavbar";

// HIGHLIGHT: light theme config for navbar
const publicLightNavTheme = {
  textPrimaryClassName: "text-slate-900",   // HIGHLIGHT
  cardBorderClassName: "border-slate-200",  // HIGHLIGHT
  accentColor: "#4B67FF",
  buttonPrimaryColor: "#4B67FF",
};

// HIGHLIGHT: helper to build a simple calendar month
function buildMonthDays(year: number, monthIndex: number) {
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const previousMonthDays = new Date(year, monthIndex, 0).getDate();

  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  const cells: {
    label: number;
    dateString: string;
    isCurrentMonth: boolean;
  }[] = [];

  for (let cellIndex = 0; cellIndex < totalCells; cellIndex++) {
    const dayOffset = cellIndex - firstDayOfWeek + 1;

    if (dayOffset < 1) {
      const dayNumber = previousMonthDays + dayOffset;
      const date = new Date(year, monthIndex - 1, dayNumber);
      cells.push({
        label: dayNumber,
        dateString: date.toISOString().slice(0, 10),
        isCurrentMonth: false,
      });
    } else if (dayOffset > daysInMonth) {
      const dayNumber = dayOffset - daysInMonth;
      const date = new Date(year, monthIndex + 1, dayNumber);
      cells.push({
        label: dayNumber,
        dateString: date.toISOString().slice(0, 10),
        isCurrentMonth: false,
      });
    } else {
      const date = new Date(year, monthIndex, dayOffset);
      cells.push({
        label: dayOffset,
        dateString: date.toISOString().slice(0, 10),
        isCurrentMonth: true,
      });
    }
  }

  return cells;
}

// HIGHLIGHT: convert "19:25" -> "7:25 PM"
function toTwelveHour(time24: string): string {
  const [hourPart, minutePart] = time24.split(":").map(Number);
  const suffix = hourPart >= 12 ? "PM" : "AM";
  const hourTwelve = ((hourPart + 11) % 12) + 1;
  return `${hourTwelve}:${minutePart.toString().padStart(2, "0")} ${suffix}`;
}

// HIGHLIGHT: main page component
export default function BookDemoPage(): React.JSX.Element {
  const [isOverlayCalendarEnabled, setIsOverlayCalendarEnabled] = useState(false);
  const [isTwentyFourHourFormat, setIsTwentyFourHourFormat] = useState(true);
  const [selectedDate, setSelectedDate] = useState("2025-11-21");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const demoYear = 2025;
  const demoMonthIndex = 10; // November (0-based)
  const monthLabel = "November 2025";

  const calendarCells = useMemo(
    () => buildMonthDays(demoYear, demoMonthIndex),
    []
  );

  const timeSlots24 = [
    "19:00",
    "19:25",
    "19:50",
    "20:15",
    "20:40",
    "21:05",
    "21:30",
    "21:55",
    "22:20",
    "22:45",
  ];

  const displayedTimeSlots = isTwentyFourHourFormat
    ? timeSlots24
    : timeSlots24.map(toTwelveHour);

  const selectedDateObject = new Date(selectedDate);
  const selectedWeekday = selectedDateObject.toLocaleDateString("en-US", {
    weekday: "short",
  });
  const selectedDayNumber = selectedDateObject.getDate();

  return (
    // HIGHLIGHT: light-mode background + gradient
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50 text-slate-900 flex flex-col relative overflow-hidden">
      {/* HIGHLIGHT: shared public navbar (light theme) */}
      <PublicNavbar
        textPrimaryClassName={publicLightNavTheme.textPrimaryClassName}
        cardBorderClassName={publicLightNavTheme.cardBorderClassName}
        accentColor={publicLightNavTheme.accentColor}
        buttonPrimaryColor={publicLightNavTheme.buttonPrimaryColor}
      />

      {/* HIGHLIGHT: decorative light background shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        {/* top-left soft blob */}
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-blue-200/35 blur-3xl" />
        {/* bottom-right soft blob */}
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
        {/* mid-left pale circle */}
        <div className="absolute top-1/3 -left-16 h-44 w-44 rounded-full bg-slate-200/40 blur-2xl" />
        {/* ring top-right */}
        <div className="absolute top-24 right-24 h-56 w-56 rounded-full border-[3px] border-blue-300/60" />
        {/* subtle diagonal gradient shape */}
        <div className="absolute top-1/2 -right-24 h-80 w-80 -rotate-6 bg-gradient-to-br from-blue-100/60 to-sky-100/40 blur-2xl rounded-3xl" />
        {/* dotted pattern */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-soft-light"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.35) 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />
      </div>

      {/* HIGHLIGHT: top-right overlay toggle (light text) */}
      <header className="flex justify-end px-6 lg:px-10 pt-6">
        <button
          type="button"
          onClick={() =>
            setIsOverlayCalendarEnabled((previousValue) => !previousValue)
          }
          className="flex items-center gap-3 text-sm text-slate-600"
        >
          <span
            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
              isOverlayCalendarEnabled ? "bg-blue-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                isOverlayCalendarEnabled ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </span>
          <span>Overlay my calendar</span>
        </button>
      </header>

      <main className="flex-1 flex items-start justify-center pb-16 lg:pb-20 px-4">
        {/* HIGHLIGHT: main booking card in light mode */}
        <div className="mt-8 w-full max-w-5xl rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-xl shadow-xl grid gap-0 lg:grid-cols-[1.3fr_1.6fr_1.1fr]">
          {/* LEFT: demo description */}
          <section className="border-b lg:border-b-0 lg:border-r border-slate-200 p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full border border-blue-400 flex items-center justify-center">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              </div>
              <span className="text-sm text-slate-500">Trogern</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                Trogern Operations Demo
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Walk through the live dashboard with the founder. See how
                Trogern tracks vehicles, drivers, and cash-ins in real time.
                Discuss your routes, weekly targets, and how we plug into
                your existing workflows.
              </p>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded border border-slate-400 flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>Requires confirmation</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full border border-slate-400" />
                <span>25 minutes</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full border border-slate-400" />
                <span>Google Meet or Zoom</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full border border-slate-400" />
                <span>Africa/Harare timezone</span>
              </div>
            </div>
          </section>

          {/* CENTER: calendar */}
          <section className="border-b lg:border-b-0 lg:border-r border-slate-200 p-6 lg:p-8 bg-slate-50/60">
            <header className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-slate-800">
                {monthLabel}
              </h2>
              <div className="flex items-center gap-3 text-slate-500">
                <button
                  type="button"
                  className="h-7 w-7 rounded-full border border-slate-300 flex items-center justify-center text-xs bg-white hover:bg-slate-100"
                >
                  {"<"}
                </button>
                <button
                  type="button"
                  className="h-7 w-7 rounded-full border border-slate-300 flex items-center justify-center text-xs bg-white hover:bg-slate-100"
                >
                  {">"}
                </button>
              </div>
            </header>

            <div className="grid grid-cols-7 text-[11px] text-slate-500 mb-2">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                (weekday) => (
                  <div
                    key={weekday}
                    className="h-6 flex items-center justify-center"
                  >
                    {weekday}
                  </div>
                )
              )}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((dayCell) => {
                const isSelected = dayCell.dateString === selectedDate;
                const isDisabled = !dayCell.isCurrentMonth;
                return (
                  <button
                    key={dayCell.dateString}
                    type="button"
                    onClick={() => !isDisabled && setSelectedDate(dayCell.dateString)}
                    className={[
                      "h-10 rounded-lg text-sm flex items-center justify-center transition-all",
                      isDisabled
                        ? "text-slate-300 bg-transparent cursor-default"
                        : "cursor-pointer",
                      isSelected && !isDisabled
                        ? "bg-blue-600 text-white shadow-sm"
                        : !isSelected && !isDisabled
                        ? "bg-white hover:bg-blue-50 text-slate-700 border border-slate-200"
                        : "",
                    ].join(" ")}
                  >
                    {dayCell.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* RIGHT: time slots */}
          <section className="p-6 lg:p-8 flex flex-col bg-white/80">
            <header className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">
                  {selectedWeekday}
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {selectedDayNumber}
                </span>
              </div>
              {/* HIGHLIGHT: light-mode toggle pill */}
              <div className="inline-flex rounded-full bg-slate-100 border border-slate-300 text-[11px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsTwentyFourHourFormat(false)}
                  className={`px-3 py-1 ${
                    !isTwentyFourHourFormat
                      ? "bg-slate-900 text-white"
                      : "text-slate-600"
                  }`}
                >
                  12h
                </button>
                <button
                  type="button"
                  onClick={() => setIsTwentyFourHourFormat(true)}
                  className={`px-3 py-1 ${
                    isTwentyFourHourFormat
                      ? "bg-slate-900 text-white"
                      : "text-slate-600"
                  }`}
                >
                  24h
                </button>
              </div>
            </header>

            <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1">
              {displayedTimeSlots.map((timeLabel, index) => {
                const canonicalTime = timeSlots24[index];
                const isChosen = selectedTime === canonicalTime;

                return (
                  <button
                    key={timeLabel}
                    type="button"
                    onClick={() => setSelectedTime(canonicalTime)}
                    className={[
                      "w-full rounded-xl border text-sm py-2.5 px-3 text-left transition-all",
                      isChosen
                        ? "border-blue-500 bg-blue-50 text-slate-900 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800",
                    ].join(" ")}
                  >
                    {timeLabel}
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold py-2.5 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                disabled={!selectedTime}
              >
                Confirm demo time
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}