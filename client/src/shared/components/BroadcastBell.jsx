import React, { useEffect, useRef, useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import api from "../../services/api";

const POLL_MS = 2 * 60 * 1000;
const PRIORITY_STYLE = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-gray-100 text-gray-600",
};

// Which announcements this viewer has seen: a per-browser convenience only.
const readKey = (user) => `readBroadcasts:${user._id || user.employeeId || user.emailId}`;
const loadRead = (user) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(readKey(user)) || "[]"));
  } catch {
    return new Set();
  }
};
const saveRead = (user, ids) => {
  try {
    localStorage.setItem(readKey(user), JSON.stringify([...ids]));
  } catch {
    /* storage unavailable: unread state just resets */
  }
};

/**
 * Admin broadcasts as notifications for faculty (coordinators included):
 * unread badge, a list of current announcements, and a popup when a new one
 * arrives (the app's toast hook only logs to the console). Re-checks every 2 minutes. Not rendered for admins or students.
 */
const BroadcastBell = ({ user }) => {
  const [items, setItems] = useState([]);
  const [read, setRead] = useState(() => loadRead(user));
  const [open, setOpen] = useState(false);
  const [popup, setPopup] = useState(null); // text of the "new announcement" popup
  const announced = useRef(new Set());
  const readRef = useRef(read); // lets the poller see the latest read set
  const box = useRef(null);

  useEffect(() => {
    readRef.current = read;
  }, [read]);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api
        .get("/faculty/broadcasts")
        .then((res) => {
          if (cancelled) return;
          const list = res.data?.data || [];
          setItems(list);
          const fresh = list.filter((b) => !readRef.current.has(b._id) && !announced.current.has(b._id));
          fresh.forEach((b) => announced.current.add(b._id));
          if (fresh.length === 1) setPopup(fresh[0].title || fresh[0].message);
          else if (fresh.length > 1) setPopup(`${fresh.length} new announcements`);
        })
        .catch(() => {
          /* not fatal: the bell just stays as it was */
        });
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const unread = items.filter((b) => !read.has(b._id)).length;

  const toggle = () => {
    if (!open && unread > 0) {
      const next = new Set([...read, ...items.map((b) => b._id)]);
      setRead(next);
      saveRead(user, next);
    }
    setPopup(null);
    setOpen((o) => !o);
  };

  return (
    <div className="relative" ref={box}>
      <button
        onClick={toggle}
        className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label={unread ? `${unread} unread announcements` : "Announcements"}
        title="Announcements"
      >
        <BellIcon className="w-6 h-6" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {popup && !open && (
        <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-blue-600 text-white rounded-xl shadow-lg p-3 z-50" role="status">
          <p className="text-[11px] uppercase font-bold opacity-80">New announcement</p>
          <p className="text-sm font-medium line-clamp-2">{popup}</p>
          <div className="flex justify-end gap-3 mt-2 text-xs font-semibold">
            <button onClick={() => setPopup(null)} className="opacity-80 hover:opacity-100">Dismiss</button>
            <button onClick={toggle} className="underline">View</button>
          </div>
        </div>
      )}

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Announcements</div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {items.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-500 text-center">No announcements right now.</p>
            )}
            {items.map((b) => (
              <div key={b._id} className="px-4 py-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PRIORITY_STYLE[b.priority] || PRIORITY_STYLE.medium}`}>
                    {b.priority || "medium"}
                  </span>
                  {b.title && <p className="text-sm font-semibold text-gray-900 truncate">{b.title}</p>}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{b.message}</p>
                <p className="text-[11px] text-gray-400">
                  {b.createdByName ? `${b.createdByName} · ` : ""}
                  {new Date(b.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BroadcastBell;
