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
  Stethoscope,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


function Messages() {

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


  const getResults = (
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


    return [];

  };


  const fetchConversations =
    async (
      silent = false,
      manualRefresh = false
    ) => {

      try {

        if (
          manualRefresh
        ) {

          setRefreshing(
            true
          );

        } else if (
          !silent
        ) {

          setLoading(
            true
          );

        }


        const response =
          await api.get(
            "/chat/conversations/"
          );


        const list =
          getResults(
            response
          );


        setConversations(
          list
        );


        setSelectedConversation(
          (
            current
          ) => {

            if (
              !current
            ) {

              return current;

            }


            return (
              list.find(
                (
                  item
                ) =>
                  item.id ===
                  current.id
              ) ||
              current
            );

          }
        );


        if (
          !silent
        ) {

          setError("");

        }

      } catch (err) {

        console.error(
          "Conversation load error:",
          err
        );


        if (
          !silent
        ) {

          setError(
            err.response
              ?.data
              ?.detail ||
            "Unable to load conversations."
          );

        }

      } finally {

        if (
          manualRefresh
        ) {

          setRefreshing(
            false
          );

        } else if (
          !silent
        ) {

          setLoading(
            false
          );

        }

      }

    };


  useEffect(() => {

    fetchConversations();

  }, []);


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


    return () =>
      clearInterval(
        interval
      );

  }, []);


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

        if (
          !silent
        ) {

          setLoadingMessages(
            true
          );

        }


        const response =
          await api.get(
            `/chat/conversations/${conversationId}/messages/`
          );


        setMessages(
          getResults(
            response
          )
        );


        if (
          !silent
        ) {

          setError("");

        }

      } catch (err) {

        console.error(
          "Message load error:",
          err
        );


        if (
          !silent
        ) {

          setError(
            err.response
              ?.data
              ?.detail ||
            "Unable to load messages."
          );

        }

      } finally {

        if (
          !silent
        ) {

          setLoadingMessages(
            false
          );

        }

      }

    };


  const selectConversation = (
    conversation
  ) => {

    firstMessageLoad.current =
      true;


    setSelectedConversation(
      conversation
    );


    setMessages([]);


    setMessageText("");


    fetchMessages(
      conversation.id
    );

  };


  useEffect(() => {

    if (
      !selectedConversation
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


    return () =>
      clearInterval(
        interval
      );

  }, [
    selectedConversation?.id,
  ]);


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


        setMessageText("");


        if (
          response.data
            ?.data
        ) {

          setMessages(
            (
              previous
            ) => [
              ...previous,
              response.data
                .data,
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
          "Send message error:",
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


  const filteredConversations =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();


        if (
          !text
        ) {

          return conversations;

        }


        return conversations
          .filter(
            (
              conversation
            ) => {

              const searchable =
                [
                  conversation
                    .other_user_name,
                  conversation
                    .specialization,
                  conversation
                    .last_message,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase();


              return searchable
                .includes(
                  text
                );

            }
          );

      },
      [
        conversations,
        search,
      ]
    );


  const unreadTotal =
    useMemo(
      () =>
        conversations.reduce(
          (
            total,
            conversation
          ) =>
            total +
            Number(
              conversation
                .unread_count ||
              0
            ),
          0
        ),
      [
        conversations,
      ]
    );


  return (

    <Layout>

      <div className="page-content patient-messages-page">


        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              PATIENT
            </p>


            <h1>
              Messages
            </h1>


            <p className="page-description">

              Securely communicate with
              doctors connected to your
              appointments.

            </p>

          </div>


          <div className="patient-message-header-actions">

            {
              unreadTotal >
              0 && (

                <span className="patient-message-unread-summary">

                  {
                    unreadTotal
                  } unread

                </span>

              )
            }


            <button
              type="button"
              className="btn-secondary"
              disabled={
                refreshing
              }
              onClick={
                () =>
                  fetchConversations(
                    false,
                    true
                  )
              }
            >

              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "spin"
                    : ""
                }
              />

              {
                refreshing
                  ? "Refreshing..."
                  : "Refresh"
              }

            </button>

          </div>

        </div>


        {
          error && (

            <div className="error-message">
              {error}
            </div>

          )
        }


        <div className="chat-layout patient-chat-layout">


          <aside className="chat-sidebar patient-chat-sidebar">


            <div className="chat-sidebar-header">

              <div className="patient-chat-sidebar-title">

                <div>

                  <h3>
                    Conversations
                  </h3>


                  <span>

                    {
                      conversations.length
                    } doctor{
                      conversations.length ===
                      1
                        ? ""
                        : "s"
                    }

                  </span>

                </div>


                <MessageSquare
                  size={20}
                />

              </div>


              <div className="search-box">

                <Search
                  size={17}
                />


                <input
                  type="text"
                  placeholder="Search doctor or message..."
                  value={
                    search
                  }
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

            </div>


            <div className="conversation-list">

              {
                loading ? (

                  <div className="chat-empty patient-chat-loading">

                    <Loader2
                      size={22}
                      className="spin"
                    />

                    <p>
                      Loading conversations...
                    </p>

                  </div>

                ) : filteredConversations
                  .length ===
                  0 ? (

                  <div className="chat-empty">

                    <MessageSquare
                      size={30}
                    />


                    <p>

                      {
                        conversations.length ===
                        0
                          ? "No conversations yet."
                          : "No matching conversations."
                      }

                    </p>


                    <span>

                      {
                        conversations.length ===
                        0
                          ? "A conversation appears after you book an appointment with a doctor."
                          : "Try a different doctor name, specialization or message."
                      }

                    </span>

                  </div>

                ) : (

                  filteredConversations
                    .map(
                      (
                        conversation
                      ) => (

                        <button
                          type="button"
                          key={
                            conversation.id
                          }
                          className={
                            selectedConversation
                              ?.id ===
                            conversation.id
                              ? "conversation-item active"
                              : "conversation-item"
                          }
                          onClick={
                            () =>
                              selectConversation(
                                conversation
                              )
                          }
                        >

                          <div className="conversation-avatar">

                            <Stethoscope
                              size={19}
                            />

                          </div>


                          <div className="conversation-content">

                            <div className="conversation-top">

                              <strong>

                                Dr. {
                                  conversation
                                    .other_user_name ||
                                  "Doctor"
                                }

                              </strong>


                              <span>

                                {
                                  conversation
                                    .last_message_time ||
                                  ""
                                }

                              </span>

                            </div>


                            <p>

                              {
                                conversation
                                  .last_message ||
                                conversation
                                  .specialization ||
                                "Start conversation"
                              }

                            </p>

                          </div>


                          {
                            Number(
                              conversation
                                .unread_count ||
                              0
                            ) >
                            0 && (

                              <span className="chat-unread-count">

                                {
                                  conversation
                                    .unread_count
                                }

                              </span>

                            )
                          }

                        </button>

                      )
                    )

                )
              }

            </div>

          </aside>


          <section className="chat-panel patient-chat-panel">

            {
              !selectedConversation ? (

                <div className="chat-placeholder">

                  <div className="patient-chat-placeholder-icon">

                    <MessageSquare
                      size={34}
                    />

                  </div>


                  <h3>
                    Select a conversation
                  </h3>


                  <p>

                    Choose a doctor from the
                    conversation list to view
                    your secure messages.

                  </p>

                </div>

              ) : (

                <>

                  <div className="chat-header">

                    <div className="chat-doctor-avatar">

                      <Stethoscope
                        size={20}
                      />

                    </div>


                    <div className="patient-chat-doctor-info">

                      <strong>

                        Dr. {
                          selectedConversation
                            .other_user_name ||
                          "Doctor"
                        }

                      </strong>


                      <span>

                        {
                          selectedConversation
                            .specialization ||
                          "Doctor"
                        }

                      </span>

                    </div>


                    <div className="patient-chat-live-status">

                      <span />

                      Auto-refreshing

                    </div>

                  </div>


                  <div className="chat-messages">

                    {
                      loadingMessages ? (

                        <div className="chat-empty patient-chat-loading">

                          <Loader2
                            size={22}
                            className="spin"
                          />

                          <p>
                            Loading messages...
                          </p>

                        </div>

                      ) : messages.length ===
                        0 ? (

                        <div className="chat-empty">

                          <MessageSquare
                            size={29}
                          />


                          <p>
                            No messages yet.
                          </p>


                          <span>

                            Send a message to
                            start the
                            conversation.

                          </span>

                        </div>

                      ) : (

                        messages.map(
                          (
                            message
                          ) => (

                            <div
                              key={
                                message.id
                              }
                              className={
                                message.is_mine
                                  ? "message-row mine"
                                  : "message-row"
                              }
                            >

                              <div className="message-bubble">

                                <p>

                                  {
                                    message.message
                                  }

                                </p>


                                <span>

                                  {
                                    message
                                      .created_at_display ||
                                    ""
                                  }

                                </span>

                              </div>

                            </div>

                          )
                        )

                      )
                    }


                    <div
                      ref={
                        messagesEndRef
                      }
                    />

                  </div>


                  <form
                    className="chat-input-area"
                    onSubmit={
                      sendMessage
                    }
                  >

                    <input
                      type="text"
                      value={
                        messageText
                      }
                      onChange={
                        (
                          event
                        ) =>
                          setMessageText(
                            event.target.value
                          )
                      }
                      placeholder="Type your message..."
                      maxLength={
                        5000
                      }
                      disabled={
                        sending
                      }
                    />


                    <div className="patient-message-input-meta">

                      <span>

                        {
                          messageText.length
                        }/5000

                      </span>


                      <button
                        type="submit"
                        className="chat-send-btn"
                        disabled={
                          sending ||
                          !messageText
                            .trim()
                        }
                        aria-label="Send message"
                      >

                        {
                          sending ? (

                            <Loader2
                              size={18}
                              className="spin"
                            />

                          ) : (

                            <Send
                              size={18}
                            />

                          )
                        }

                      </button>

                    </div>

                  </form>

                </>

              )
            }

          </section>


        </div>


      </div>

    </Layout>

  );

}


export default Messages;
