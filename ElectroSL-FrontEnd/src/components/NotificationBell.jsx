import React, { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

const API_BASE = "http://localhost:5192";

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [liveToast, setLiveToast] = useState(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!userId) return;

    // 1. Load existing notifications from MySQL
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/Notification/user/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();

    // 2. Connect to SignalR Hub for real-time updates
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/notifications`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveNotification", (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setLiveToast(newNotification);
      setTimeout(() => setLiveToast(null), 5000);
    });

    connection
      .start()
      .then(() => connection.invoke("JoinUserGroup", userId.toString()))
      .catch((err) => console.error("SignalR Connection Error:", err));

    return () => {
      connection.stop();
    };
  }, [userId]);

  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch(`${API_BASE}/api/Notification/read/${notificationId}`, {
        method: "PUT",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "relative",
          padding: "8px 14px",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          background: "#fff",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        🔔 Alerts
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              background: "#ef4444",
              color: "#fff",
              borderRadius: "999px",
              padding: "2px 7px",
              fontSize: "12px",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: "8px",
            width: "320px",
            maxHeight: "380px",
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid #e2e8f0",
              fontWeight: "bold",
            }}
          >
            Notifications ({unreadCount} unread)
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.notificationId}
                onClick={() => !n.isRead && markAsRead(n.notificationId)}
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid #f1f5f9",
                  background: n.isRead ? "#fff" : "#eff6ff",
                  cursor: n.isRead ? "default" : "pointer",
                }}
              >
                <div style={{ fontWeight: "600", fontSize: "14px" }}>{n.title}</div>
                <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
                  {n.message}
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Live Real-Time Toast */}
      {liveToast && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#0f172a",
            color: "#fff",
            padding: "14px 18px",
            borderRadius: "10px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
            maxWidth: "320px",
            zIndex: 2000,
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
            ⚡ {liveToast.title}
          </div>
          <div style={{ fontSize: "13px", color: "#cbd5e1" }}>{liveToast.message}</div>
        </div>
      )}
    </div>
  );
}