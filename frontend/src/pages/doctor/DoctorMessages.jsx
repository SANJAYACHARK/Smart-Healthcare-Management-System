import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  UserRound,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


function DoctorMessages() {

  // =========================================================
  // STATE
  // =========================================================

  const [
    conversations,
    setConversations,
  ] = useState([]);


  const [
    selectedConversation,
    setSelectedConversation,
  ] = useState(null);


  const [
    messages,
    setMessages,
  ] = useState([]);


  const [
    messageText,
    setMessageText,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    loadingMessages,
    setLoadingMessages,
  ] = useState(false);


  const [
    sending,
    setSending,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    search,
    setSearch,
  ] = useState("");


  const messagesEndRef =
    useRef(null);


  const firstMessageLoad =
    useRef(true);


  // =========================================================
  // HELPERS
  // =========================================================

  const getResults =
    (
      response
    ) => {

      const data =
        response?.data;


      if (
        Array.isArray(data)
      ) {

        return data;

      }


      if (
        Array.isArray(
          data?.results
        )
      ) {

        return data.results;

      }


      if (
        Array.isArray(
          data?.data
        )
      ) {

        return data.data;

      }


      return [];

    };


  const getConversationName =
    (
      conversation
    ) => {

      return (
        conversation?.patient_name ||
        conversation?.other_user_name ||
        conversation?.name ||
        conversation?.title ||
        "Patient"
      );

    };


  const getConversationSubtitle =
    (
      conversation
    ) => {

      return (
        conversation?.patient_email ||
        conversation?.other_user_email ||
        conversation?.last_message ||
        "Patient conversation"
      );

    };


  const getUnreadCount =
    (
      conversation
    ) => {

      return Number(
        conversation?.unread_count ||
        0
      );

    };


  const formatMessageTime =
    (
      value
    ) => {

      if (!value) {

        return "";

      }


      const date =
        new Date(
          value
        );


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {

        return "";

      }


      return date
        .toLocaleTimeString(
          "en-IN",
          {
            hour:
              "2-digit",

            minute:
              "2-digit",
          }
        );

    };


  const formatConversationTime =
    (
      value
    ) => {

      if (!value) {

        return "";

      }


      const date =
        new Date(
          value
        );


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {

        return "";

      }


      const today =
        new Date();


      const sameDay =
        date.getFullYear() ===
          today.getFullYear() &&
        date.getMonth() ===
          today.getMonth() &&
        date.getDate() ===
          today.getDate();


      if (sameDay) {

        return date
          .toLocaleTimeString(
            "en-IN",
            {
              hour:
                "2-digit",

              minute:
                "2-digit",
            }
          );

      }


      return date
        .toLocaleDateString(
          "en-IN",
          {
            day:
              "2-digit",

            month:
              "short",
          }
        );

    };


  const isOwnMessage =
    (
      message
    ) => {

      if (
        typeof message?.is_mine ===
        "boolean"
      ) {

        return message.is_mine;

      }


      if (
        typeof message?.is_sender ===
        "boolean"
      ) {

        return message.is_sender;

      }


      const role =
        (
          message?.sender_role ||
          message?.role ||
          ""
        )
          .toString()
          .toUpperCase();


      if (
        role === "DOCTOR"
      ) {

        return true;

      }


      return false;

    };


  const getMessageText =
    (
      message
    ) => {

      return (
        message?.message ||
        message?.text ||
        message?.content ||
        ""
      );

    };


  // =========================================================
  // CONVERSATIONS
  // =========================================================

  const fetchConversations =
    async (
      silent = false
    ) => {

      try {

        if (!silent) {

          setLoading(true);

        }


        const response =
          await api.get(
            "/chat/conversations/"
          );


        const data =
          getResults(
            response
          );


        setConversations(
          data
        );


        if (!silent) {

          setError("");

        }


        setSelectedConversation(
          (
            previous
          ) => {

            if (!previous) {

              return previous;

            }


            const updated =
              data.find(
                (
                  item
                ) =>
                  String(
                    item.id
                  ) ===
                  String(
                    previous.id
                  )
              );


            return (
              updated ||
              previous
            );

          }
        );

      } catch (err) {

        console.error(
          "Doctor conversation error:",
          err
        );


        if (!silent) {

          setError(
            err.response
              ?.data
              ?.detail ||
            "Unable to load conversations."
          );

        }

      } finally {

        if (!silent) {

          setLoading(false);

        }

      }

    };


  useEffect(() => {

    fetchConversations();

  }, []);


  // =========================================================
  // CONVERSATION AUTO REFRESH
  // =========================================================

  useEffect(() => {

    const interval =
      setInterval(
        () => {

          fetchConversations(
            true
          );

        },
        5000
      );


    return () => {

      clearInterval(
        interval
      );

    };

  }, []);


  // =========================================================
  // FILTER CONVERSATIONS
  // =========================================================

  const filteredConversations =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();


        if (!text) {

          return conversations;

        }


        return conversations.filter(
          (
            conversation
          ) => {

            const name =
              getConversationName(
                conversation
              )
                .toLowerCase();


            const subtitle =
              getConversationSubtitle(
                conversation
              )
                .toLowerCase();


            return (
              name.includes(
                text
              ) ||
              subtitle.includes(
                text
              )
            );

          }
        );

      },
      [
        conversations,
        search,
      ]
    );


  // =========================================================
  // MESSAGES
  // =========================================================

  const fetchMessages =
    async (
      conversationId,
      silent = false
    ) => {

      if (
        !conversationId
      ) {

        return;

      }


      try {

        if (!silent) {

          setLoadingMessages(
            true
          );

        }


        const response =
          await api.get(
            `/chat/conversations/${conversationId}/messages/`
          );


        const data =
          getResults(
            response
          );


        setMessages(
          data
        );


        if (!silent) {

          setError("");

        }

      } catch (err) {

        console.error(
          "Doctor message load error:",
          err
        );


        if (!silent) {

          setError(
            err.response
              ?.data
              ?.detail ||
            "Unable to load messages."
          );

        }

      } finally {

        if (!silent) {

          setLoadingMessages(
            false
          );

        }

      }

    };


  const selectConversation =
    (
      conversation
    ) => {

      firstMessageLoad.current =
        true;


      setSelectedConversation(
        conversation
      );


      setMessages(
        []
      );


      setMessageText(
        ""
      );


      fetchMessages(
        conversation.id
      );

    };


  // =========================================================
  // MESSAGE AUTO REFRESH
  // =========================================================

  useEffect(() => {

    if (
      !selectedConversation
        ?.id
    ) {

      return undefined;

    }


    const interval =
      setInterval(
        () => {

          fetchMessages(
            selectedConversation.id,
            true
          );

        },
        3000
      );


    return () => {

      clearInterval(
        interval
      );

    };

  }, [
    selectedConversation?.id,
  ]);


  // =========================================================
  // AUTO SCROLL
  // =========================================================

  useEffect(() => {

    if (
      messages.length ===
      0
    ) {

      return;

    }


    messagesEndRef.current
      ?.scrollIntoView({
        behavior:
          firstMessageLoad.current
            ? "auto"
            : "smooth",
      });


    firstMessageLoad.current =
      false;

  }, [
    messages.length,
  ]);


  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const sendMessage =
    async (
      event
    ) => {

      event.preventDefault();


      const text =
        messageText
          .trim();


      if (
        !selectedConversation ||
        !text ||
        sending
      ) {

        return;

      }


      try {

        setSending(
          true
        );


        setError("");


        const response =
          await api.post(
            `/chat/conversations/${selectedConversation.id}/messages/`,
            {
              message:
                text,
            }
          );


        setMessageText(
          ""
        );


        const createdMessage =
          response.data?.data ||
          response.data?.message_data ||
          (
            response.data?.id
              ? response.data
              : null
          );


        if (
          createdMessage &&
          typeof createdMessage ===
          "object"
        ) {

          setMessages(
            (
              previous
            ) => [
              ...previous,
              createdMessage,
            ]
          );

        } else {

          await fetchMessages(
            selectedConversation.id,
            true
          );

        }


        fetchConversations(
          true
        );

      } catch (err) {

        console.error(
          "Doctor send message error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          err.response
            ?.data
            ?.message ||
          "Unable to send message."
        );

      } finally {

        setSending(
          false
        );

      }

    };


  // =========================================================
  // REFRESH SELECTED CHAT
  // =========================================================

  const refreshChat =
    async () => {

      if (
        !selectedConversation
      ) {

        return;

      }


      try {

        setRefreshing(
          true
        );


        await Promise.all([
          fetchMessages(
            selectedConversation.id,
            true
          ),

          fetchConversations(
            true
          ),
        ]);

      } finally {

        setRefreshing(
          false
        );

      }

    };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <Layout>

        <div className="loading-screen">

          <Loader2
            size={24}
            className="spin"
          />

          Loading messages...

        </div>

      </Layout>

    );

  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <Layout>

      <div className="page-content">


        {/* ====================================================
            HEADER
        ===================================================== */}

        <div className="page-header">

          <p className="page-eyebrow">
            DOCTOR
          </p>


          <h1>
            Messages
          </h1>


          <p className="page-description">

            Communicate with your patients
            and keep conversations connected
            to their care.

          </p>

        </div>


        {
          error && (

            <div className="error-message">

              {error}

            </div>

          )
        }


        {/* ====================================================
            CHAT LAYOUT
        ===================================================== */}

        <div className="doctor-chat-layout">


          {/* ==================================================
              CONVERSATION SIDEBAR
          =================================================== */}

          <div className="doctor-chat-sidebar card">


            <div className="doctor-chat-sidebar-header">

              <div>

                <h3>
                  Conversations
                </h3>


                <span className="table-secondary">

                  {
                    conversations.length
                  }

                  {" "}

                  patient chat(s)

                </span>

              </div>

            </div>


            <div className="doctor-chat-search">

              <Search
                size={17}
              />


              <input
                type="text"
                value={
                  search
                }
                placeholder="Search patients..."
                onChange={
                  (
                    event
                  ) =>
                    setSearch(
                      event.target.value
                    )
                }
              />

            </div>


            <div className="doctor-conversation-list">

              {
                filteredConversations.length ===
                0 ? (

                  <div className="doctor-chat-empty">

                    <MessageSquare
                      size={30}
                    />


                    <strong>
                      No conversations
                    </strong>


                    <span>

                      Patient conversations
                      will appear here.

                    </span>

                  </div>

                ) : (

                  filteredConversations.map(
                    (
                      conversation
                    ) => {

                      const selected =
                        String(
                          selectedConversation
                            ?.id
                        ) ===
                        String(
                          conversation.id
                        );


                      const unread =
                        getUnreadCount(
                          conversation
                        );


                      return (

                        <button
                          type="button"
                          key={
                            conversation.id
                          }
                          className={
                            `doctor-conversation-item ${
                              selected
                                ? "active"
                                : ""
                            }`
                          }
                          onClick={
                            () =>
                              selectConversation(
                                conversation
                              )
                          }
                        >

                          <div className="doctor-chat-avatar">

                            <UserRound
                              size={18}
                            />

                          </div>


                          <div className="doctor-conversation-content">

                            <div className="doctor-conversation-top">

                              <strong>

                                {
                                  getConversationName(
                                    conversation
                                  )
                                }

                              </strong>


                              <small>

                                {
                                  formatConversationTime(
                                    conversation.updated_at ||
                                    conversation.last_message_at ||
                                    conversation.created_at
                                  )
                                }

                              </small>

                            </div>


                            <div className="doctor-conversation-bottom">

                              <span>

                                {
                                  getConversationSubtitle(
                                    conversation
                                  )
                                }

                              </span>


                              {
                                unread >
                                0 && (

                                  <span className="doctor-chat-unread">

                                    {unread}

                                  </span>

                                )
                              }

                            </div>

                          </div>

                        </button>

                      );

                    }
                  )

                )
              }

            </div>

          </div>


          {/* ==================================================
              CHAT PANEL
          =================================================== */}

          <div className="doctor-chat-panel card">


            {
              !selectedConversation ? (

                <div className="doctor-chat-placeholder">

                  <div className="doctor-chat-placeholder-icon">

                    <MessageSquare
                      size={34}
                    />

                  </div>


                  <h3>
                    Select a Conversation
                  </h3>


                  <p>

                    Choose a patient from
                    the conversation list
                    to view and send messages.

                  </p>

                </div>

              ) : (

                <>


                  {/* ===========================================
                      CHAT HEADER
                  ============================================ */}

                  <div className="doctor-chat-header">

                    <div className="table-user">

                      <div className="table-avatar">

                        <UserRound
                          size={18}
                        />

                      </div>


                      <div>

                        <strong>

                          {
                            getConversationName(
                              selectedConversation
                            )
                          }

                        </strong>


                        <span>

                          {
                            selectedConversation
                              .patient_email ||
                            selectedConversation
                              .other_user_email ||
                            "Patient"
                          }

                        </span>

                      </div>

                    </div>


                    <button
                      type="button"
                      className="btn-small"
                      disabled={
                        refreshing
                      }
                      onClick={
                        refreshChat
                      }
                    >

                      <RefreshCw
                        size={14}
                        className={
                          refreshing
                            ? "spin"
                            : ""
                        }
                      />

                      Refresh

                    </button>

                  </div>


                  {/* ===========================================
                      MESSAGES
                  ============================================ */}

                  <div className="doctor-chat-messages">

                    {
                      loadingMessages ? (

                        <div className="doctor-chat-loading">

                          <Loader2
                            size={22}
                            className="spin"
                          />

                          Loading messages...

                        </div>

                      ) : messages.length ===
                        0 ? (

                        <div className="doctor-chat-empty">

                          <MessageSquare
                            size={30}
                          />


                          <strong>
                            No messages yet
                          </strong>


                          <span>

                            Send the first
                            message to this
                            patient.

                          </span>

                        </div>

                      ) : (

                        messages.map(
                          (
                            message,
                            index
                          ) => {

                            const own =
                              isOwnMessage(
                                message
                              );


                            return (

                              <div
                                className={
                                  `doctor-message-row ${
                                    own
                                      ? "own"
                                      : "received"
                                  }`
                                }
                                key={
                                  message.id ||
                                  `${selectedConversation.id}-${index}`
                                }
                              >

                                <div
                                  className={
                                    `doctor-message-bubble ${
                                      own
                                        ? "own"
                                        : "received"
                                    }`
                                  }
                                >

                                  <p>

                                    {
                                      getMessageText(
                                        message
                                      )
                                    }

                                  </p>


                                  <span>

                                    {
                                      formatMessageTime(
                                        message.created_at ||
                                        message.sent_at ||
                                        message.timestamp
                                      )
                                    }

                                  </span>

                                </div>

                              </div>

                            );

                          }
                        )

                      )
                    }


                    <div
                      ref={
                        messagesEndRef
                      }
                    />

                  </div>


                  {/* ===========================================
                      COMPOSER
                  ============================================ */}

                  <form
                    className="doctor-chat-composer"
                    onSubmit={
                      sendMessage
                    }
                  >

                    <textarea
                      rows="1"
                      value={
                        messageText
                      }
                      placeholder="Type a message..."
                      disabled={
                        sending
                      }
                      onChange={
                        (
                          event
                        ) =>
                          setMessageText(
                            event.target.value
                          )
                      }
                      onKeyDown={
                        (
                          event
                        ) => {

                          if (
                            event.key ===
                              "Enter" &&
                            !event.shiftKey
                          ) {

                            event
                              .preventDefault();


                            if (
                              messageText
                                .trim() &&
                              !sending
                            ) {

                              sendMessage(
                                event
                              );

                            }

                          }

                        }
                      }
                    />


                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={
                        sending ||
                        !messageText.trim()
                      }
                    >

                      {
                        sending ? (

                          <Loader2
                            size={17}
                            className="spin"
                          />

                        ) : (

                          <Send
                            size={17}
                          />

                        )
                      }


                      {
                        sending
                          ? "Sending..."
                          : "Send"
                      }

                    </button>

                  </form>

                </>

              )
            }

          </div>

        </div>

      </div>

    </Layout>

  );

}


export default DoctorMessages;
