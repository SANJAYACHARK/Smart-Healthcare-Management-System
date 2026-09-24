import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  ClipboardPlus,
  CreditCard,
  FlaskConical,
  MessageSquare,
  Pill,
  Trash2,
  X,
} from "lucide-react";

import api from "../../api/axios";



const POLL_INTERVAL = 30000;


const normalizeListResponse = (data) => {
  if (Array.isArray(data)) {
    return {
      results: data,
      unread_count: data.filter((item) => !item?.is_read).length,
    };
  }

  return {
    results: Array.isArray(data?.results) ? data.results : [],
    unread_count: Number(data?.unread_count || 0),
  };
};


const formatRelativeTime = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 30) {
    return "Just now";
  }

  if (diffMinutes < 1) {
    return "Less than a minute ago";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};


const getNotificationIcon = (type) => {
  switch (type) {
    case "APPOINTMENT":
      return ClipboardPlus;

    case "PRESCRIPTION":
      return Pill;

    case "LAB_REPORT":
      return FlaskConical;

    case "BILLING":
      return CreditCard;

    case "MESSAGE":
      return MessageSquare;

    default:
      return Bell;
  }
};


const getTypeClass = (type) => {
  switch (type) {
    case "APPOINTMENT":
      return "notification-icon-appointment";

    case "PRESCRIPTION":
      return "notification-icon-prescription";

    case "LAB_REPORT":
      return "notification-icon-lab";

    case "BILLING":
      return "notification-icon-billing";

    case "MESSAGE":
      return "notification-icon-message";

    default:
      return "notification-icon-system";
  }
};


const NotificationBell = () => {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [clearingRead, setClearingRead] = useState(false);

  const [error, setError] = useState("");


  const fetchNotifications = useCallback(async ({
    silent = false,
  } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError("");

      const response = await api.get(
        "/notifications/",
        {
          params: {
            limit: 30,
          },
        }
      );

      const normalized = normalizeListResponse(
        response.data
      );

      setNotifications(
        normalized.results
      );

      setUnreadCount(
        normalized.unread_count
      );
    } catch (err) {
      console.error(
        "Failed to load notifications:",
        err
      );

      if (!silent) {
        setError(
          err?.response?.data?.detail ||
          "Unable to load notifications."
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);


  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get(
        "/notifications/unread-count/"
      );

      setUnreadCount(
        Number(
          response?.data?.unread_count || 0
        )
      );
    } catch (err) {
      console.error(
        "Failed to load notification count:",
        err
      );
    }
  }, []);


  useEffect(() => {
    fetchUnreadCount();

    const intervalId = window.setInterval(
      () => {
        if (isOpen) {
          fetchNotifications({
            silent: true,
          });
        } else {
          fetchUnreadCount();
        }
      },
      POLL_INTERVAL
    );

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, [
    fetchNotifications,
    fetchUnreadCount,
    isOpen,
  ]);


  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    fetchNotifications();

    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    isOpen,
    fetchNotifications,
  ]);


  const markAsRead = async (
    notificationId
  ) => {
    const target = notifications.find(
      (item) =>
        item.id === notificationId
    );

    if (!target || target.is_read) {
      return;
    }

    setNotifications(
      (current) =>
        current.map(
          (item) =>
            item.id === notificationId
              ? {
                  ...item,
                  is_read: true,
                  read_at:
                    new Date().toISOString(),
                }
              : item
        )
    );

    setUnreadCount(
      (current) =>
        Math.max(
          0,
          current - 1
        )
    );

    try {
      await api.patch(
        `/notifications/${notificationId}/read/`
      );
    } catch (err) {
      console.error(
        "Failed to mark notification as read:",
        err
      );

      setNotifications(
        (current) =>
          current.map(
            (item) =>
              item.id === notificationId
                ? {
                    ...item,
                    is_read: false,
                    read_at: null,
                  }
                : item
          )
      );

      setUnreadCount(
        (current) =>
          current + 1
      );
    }
  };


  const handleNotificationClick = async (
    notification
  ) => {
    if (!notification) {
      return;
    }

    if (!notification.is_read) {
      await markAsRead(
        notification.id
      );
    }

    const actionUrl = String(
      notification.action_url || ""
    ).trim();

    if (actionUrl) {
      setIsOpen(false);
      navigate(actionUrl);
    }
  };


  const markAllAsRead = async () => {
    if (
      markingAll ||
      unreadCount === 0
    ) {
      return;
    }

    try {
      setMarkingAll(true);

      await api.patch(
        "/notifications/mark-all-read/"
      );

      setNotifications(
        (current) =>
          current.map(
            (item) => ({
              ...item,
              is_read: true,
              read_at:
                item.read_at ||
                new Date().toISOString(),
            })
          )
      );

      setUnreadCount(0);
    } catch (err) {
      console.error(
        "Failed to mark all notifications as read:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        "Unable to mark notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };


  const deleteNotification = async (
    event,
    notificationId
  ) => {
    event.stopPropagation();

    const removed = notifications.find(
      (item) =>
        item.id === notificationId
    );

    setNotifications(
      (current) =>
        current.filter(
          (item) =>
            item.id !== notificationId
        )
    );

    if (
      removed &&
      !removed.is_read
    ) {
      setUnreadCount(
        (current) =>
          Math.max(
            0,
            current - 1
          )
      );
    }

    try {
      await api.delete(
        `/notifications/${notificationId}/delete/`
      );
    } catch (err) {
      console.error(
        "Failed to delete notification:",
        err
      );

      await fetchNotifications({
        silent: true,
      });
    }
  };


  const clearReadNotifications = async () => {
    if (clearingRead) {
      return;
    }

    const hasRead = notifications.some(
      (item) =>
        item.is_read
    );

    if (!hasRead) {
      return;
    }

    try {
      setClearingRead(true);

      await api.delete(
        "/notifications/clear-read/"
      );

      setNotifications(
        (current) =>
          current.filter(
            (item) =>
              !item.is_read
          )
      );
    } catch (err) {
      console.error(
        "Failed to clear read notifications:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        "Unable to clear read notifications."
      );
    } finally {
      setClearingRead(false);
    }
  };


  const toggleDropdown = () => {
    setIsOpen(
      (current) =>
        !current
    );
  };


  const badgeText =
    unreadCount > 99
      ? "99+"
      : unreadCount;


  return (
    <div
      className="notification-bell-wrapper"
      ref={wrapperRef}
    >
      <button
        type="button"
        className={`notification-bell-button ${
          isOpen
            ? "notification-bell-button-active"
            : ""
        }`}
        onClick={toggleDropdown}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
        aria-expanded={isOpen}
      >
        <Bell
          size={20}
          strokeWidth={2}
        />

        {unreadCount > 0 && (
          <span className="notification-bell-badge">
            {badgeText}
          </span>
        )}
      </button>


      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <div>
              <h3>
                Notifications
              </h3>

              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>

            <button
              type="button"
              className="notification-close-button"
              onClick={() =>
                setIsOpen(false)
              }
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>


          <div className="notification-toolbar">
            <button
              type="button"
              className="notification-toolbar-button"
              onClick={markAllAsRead}
              disabled={
                markingAll ||
                unreadCount === 0
              }
            >
              <CheckCheck size={15} />

              <span>
                {markingAll
                  ? "Marking..."
                  : "Mark all read"}
              </span>
            </button>

            <button
              type="button"
              className="notification-toolbar-button"
              onClick={
                clearReadNotifications
              }
              disabled={
                clearingRead ||
                !notifications.some(
                  (item) =>
                    item.is_read
                )
              }
            >
              <Trash2 size={15} />

              <span>
                {clearingRead
                  ? "Clearing..."
                  : "Clear read"}
              </span>
            </button>
          </div>


          <div className="notification-dropdown-body">
            {loading ? (
              <div className="notification-state">
                <div className="notification-loader" />

                <span>
                  Loading notifications...
                </span>
              </div>
            ) : error ? (
              <div className="notification-state notification-state-error">
                <Bell size={24} />

                <span>
                  {error}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    fetchNotifications()
                  }
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-state">
                <div className="notification-empty-icon">
                  <Bell size={27} />
                </div>

                <strong>
                  No notifications yet
                </strong>

                <span>
                  New hospital updates will appear here.
                </span>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.map(
                  (notification) => {
                    const Icon =
                      getNotificationIcon(
                        notification.notification_type
                      );

                    const typeClass =
                      getTypeClass(
                        notification.notification_type
                      );

                    return (
                      <div
                        key={
                          notification.id
                        }
                        className={`notification-item ${
                          notification.is_read
                            ? "notification-item-read"
                            : "notification-item-unread"
                        }`}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          handleNotificationClick(
                            notification
                          )
                        }
                        onKeyDown={
                          (event) => {
                            if (
                              event.key === "Enter" ||
                              event.key === " "
                            ) {
                              event.preventDefault();

                              handleNotificationClick(
                                notification
                              );
                            }
                          }
                        }
                      >
                        <div
                          className={`notification-item-icon ${typeClass}`}
                        >
                          <Icon
                            size={18}
                            strokeWidth={2}
                          />
                        </div>


                        <div className="notification-item-content">
                          <div className="notification-item-title-row">
                            <strong>
                              {notification.title}
                            </strong>

                            {!notification.is_read && (
                              <span
                                className="notification-unread-dot"
                                aria-label="Unread"
                              />
                            )}
                          </div>

                          <p>
                            {notification.message}
                          </p>

                          <div className="notification-item-meta">
                            <span>
                              {formatRelativeTime(
                                notification.created_at
                              )}
                            </span>

                            {notification.notification_type_display && (
                              <>
                                <span className="notification-meta-divider">
                                  •
                                </span>

                                <span>
                                  {
                                    notification.notification_type_display
                                  }
                                </span>
                              </>
                            )}
                          </div>
                        </div>


                        <div className="notification-item-actions">
                          {!notification.is_read && (
                            <button
                              type="button"
                              className="notification-mini-button"
                              title="Mark as read"
                              onClick={
                                async (
                                  event
                                ) => {
                                  event.stopPropagation();

                                  await markAsRead(
                                    notification.id
                                  );
                                }
                              }
                            >
                              <Check
                                size={15}
                              />
                            </button>
                          )}

                          <button
                            type="button"
                            className="notification-mini-button notification-delete-button"
                            title="Delete"
                            onClick={
                              (event) =>
                                deleteNotification(
                                  event,
                                  notification.id
                                )
                            }
                          >
                            <Trash2
                              size={15}
                            />
                          </button>

                          {notification.action_url && (
                            <ChevronRight
                              className="notification-item-chevron"
                              size={16}
                            />
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


export default NotificationBell;
