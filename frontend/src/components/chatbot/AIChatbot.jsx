import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bot,
  Send,
  X,
  Sparkles,
  AlertTriangle,
  Stethoscope,
  CalendarDays,
  UserRound,
  IndianRupee,
  Clock3,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api
  from "../../api/axios";


function AIChatbot() {

  const navigate =
    useNavigate();


  // ========================================================
  // STATE
  // ========================================================

  const [open, setOpen] =
    useState(false);

  const [messages, setMessages] =
    useState([
      {
        id: 1,

        sender: "bot",

        text:
          "Hi, I'm SmartCare Assistant. Describe your symptoms and I can suggest an appropriate department, available doctors and their next available appointment slots. I cannot diagnose conditions or prescribe medicines.",
      },
    ]);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const messagesEndRef =
    useRef(null);


  // ========================================================
  // AUTO SCROLL
  // ========================================================

  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth",
      });

  }, [
    messages,
    loading,
  ]);


  // ========================================================
  // SEND MESSAGE
  // ========================================================

  const sendMessage =
    async (event) => {

      event.preventDefault();


      const text =
        input.trim();


      if (
        !text ||
        loading
      ) {

        return;

      }


      const userMessage = {

        id:
          Date.now(),

        sender:
          "user",

        text,

      };


      setMessages(
        (previous) => [
          ...previous,
          userMessage,
        ]
      );


      setInput("");

      setLoading(true);


      try {

        const history =
          messages
            .slice(-12)
            .map(
              (message) => ({
                role:
                  message.sender ===
                  "user"
                    ? "user"
                    : "assistant",

                content:
                  message.text,
              })
            );


        const response =
          await api.post(
            "/ai/symptom-checker/",
            {
              message:
                text,

              history,
            }
          );


        setMessages(
          (previous) => [
            ...previous,
            {
              id:
                Date.now() + 1,

              sender:
                "bot",

              text:
                response.data
                  ?.reply ||
                "I could not generate guidance.",

              urgency:
                response.data
                  ?.urgency,

              department:
                response.data
                  ?.department,

              emergency:
                response.data
                  ?.emergency,

              doctors:
                response.data
                  ?.suggested_doctors ||
                [],

              aiPowered:
                response.data
                  ?.ai_powered ===
                true,

              aiFallback:
                response.data
                  ?.ai_fallback ===
                true,

              intent:
                response.data
                  ?.intent ||
                null,
            },
          ]
        );

      } catch (err) {

        console.error(
          "AI chatbot error:",
          err
        );


        setMessages(
          (previous) => [
            ...previous,
            {
              id:
                Date.now() + 1,

              sender:
                "bot",

              text:
                err.response
                  ?.data
                  ?.detail ||
                "I’m unable to process your request right now.",
            },
          ]
        );

      } finally {

        setLoading(false);

      }

    };


  // ========================================================
  // VIEW DOCTOR
  // ========================================================

  const viewDoctor =
    (doctor) => {

      setOpen(false);


      navigate(
        `/patient/appointments?doctor=${doctor.id}`,
        {
          state: {

            suggestedDoctor:
              doctor,

            openDoctorDetails:
              true,

          },
        }
      );

    };


  // ========================================================
  // NORMAL BOOK DOCTOR
  // ========================================================

  const bookDoctor =
    (doctor) => {

      setOpen(false);


      navigate(
        `/patient/appointments?doctor=${doctor.id}&book=1`,
        {
          state: {

            suggestedDoctor:
              doctor,

            autoBook:
              true,

          },
        }
      );

    };


  // ========================================================
  // BOOK EXACT NEXT AVAILABLE SLOT
  // ========================================================

  const bookExactSlot =
    (doctor) => {

      const slot =
        doctor.next_available_slot;


      // If for some reason there is
      // no recommended slot, fall
      // back to normal booking.

      if (!slot) {

        bookDoctor(
          doctor
        );

        return;

      }


      setOpen(false);


      navigate(
        `/patient/appointments?doctor=${doctor.id}&book=1`,
        {
          state: {

            suggestedDoctor:
              doctor,

            autoBook:
              true,

            suggestedSlot: {

              date:
                slot.date,

              time:
                slot.time,

            },

          },
        }
      );

    };


  // ========================================================
  // RENDER
  // ========================================================

  return (

    <>


      {/* =====================================================
          FLOATING BUTTON
      ====================================================== */}

      {!open && (

        <button
          type="button"
          className="ai-chatbot-fab"
          onClick={() =>
            setOpen(true)
          }
          aria-label="Open SmartCare AI Assistant"
        >

          <Bot
            size={24}
          />

          <span className="ai-fab-dot" />

        </button>

      )}


      {/* =====================================================
          CHAT WINDOW
      ====================================================== */}

      {open && (

        <div className="ai-chat-window">


          {/* =================================================
              HEADER
          ================================================= */}

          <div className="ai-chat-header">

            <div className="ai-chat-header-left">

              <div className="ai-chat-avatar">

                <Sparkles
                  size={20}
                />

              </div>


              <div>

                <strong>
                  SmartCare AI
                </strong>

                <span>
                  Health Guidance Assistant
                </span>

              </div>

            </div>


            <button
              type="button"
              className="ai-chat-close"
              onClick={() =>
                setOpen(false)
              }
              aria-label="Close chatbot"
            >

              <X
                size={20}
              />

            </button>

          </div>


          {/* =================================================
              SAFETY NOTICE
          ================================================= */}

          <div className="ai-chat-warning">

            <AlertTriangle
              size={15}
            />

            Not a substitute for
            professional medical care.

          </div>


          {/* =================================================
              MESSAGES
          ================================================= */}

          <div className="ai-chat-messages">

            {messages.map(
              (message) => (

                <div
                  key={
                    message.id
                  }
                  className={
                    message.sender ===
                    "user"
                      ? "ai-message-row user"
                      : "ai-message-row bot"
                  }
                >

                  <div className="ai-message-bubble">


                    {/* MESSAGE */}

                    <p>
                      {
                        message.text
                      }
                    </p>


                    {message.aiPowered && (

                      <div className="ai-response-source">
                        <Sparkles size={12} />
                        AI-generated guidance
                      </div>

                    )}


                    {message.aiFallback && (

                      <div className="ai-response-source fallback">
                        <AlertTriangle size={12} />
                        Safety guidance mode
                      </div>

                    )}


                    {/* DEPARTMENT */}

                    {message.department &&
                      [
                        "MEDICAL",
                      ].includes(
                        message.intent
                      ) && (

                      <div className="ai-message-meta">

                        Suggested department:

                        <strong>
                          {
                            message.department
                          }
                        </strong>

                      </div>

                    )}


                    {/* URGENCY */}

                    {message.urgency &&
                      [
                        "MEDICAL",
                      ].includes(
                        message.intent
                      ) && (

                      <div className="ai-message-meta">

                        Urgency:

                        <strong>
                          {
                            message.urgency
                          }
                        </strong>

                      </div>

                    )}


                    {/* EMERGENCY */}

                    {message.emergency && (

                      <div className="ai-emergency-warning">

                        <AlertTriangle
                          size={15}
                        />

                        Seek urgent medical
                        attention.

                      </div>

                    )}


                    {/* =================================================
                        SUGGESTED DOCTORS
                    ================================================= */}

                    {!message.emergency &&
                      message.intent ===
                        "MEDICAL" &&
                      message.doctors?.length >
                        0 && (

                      <div className="ai-doctor-section">

                        <div className="ai-doctor-section-title">

                          <Stethoscope
                            size={15}
                          />

                          Suggested Doctors

                        </div>


                        {message.doctors.map(
                          (doctor) => (

                            <div
                              className="ai-doctor-card"
                              key={
                                doctor.id
                              }
                            >


                              {/* =====================================
                                  DOCTOR HEADER
                              ====================================== */}

                              <div className="ai-doctor-top">

                                <div className="ai-doctor-avatar">

                                  <UserRound
                                    size={18}
                                  />

                                </div>


                                <div className="ai-doctor-main">

                                  <strong>

                                    Dr. {
                                      doctor.name
                                    }

                                  </strong>


                                  <span>

                                    {
                                      doctor.specialization ||
                                      "Doctor"
                                    }

                                  </span>

                                </div>

                              </div>


                              {/* =====================================
                                  DOCTOR INFORMATION
                              ====================================== */}

                              <div className="ai-doctor-info">

                                <div>

                                  <span>
                                    Department
                                  </span>

                                  <strong>
                                    {
                                      doctor.department_name ||
                                      "-"
                                    }
                                  </strong>

                                </div>


                                <div>

                                  <span>
                                    Experience
                                  </span>

                                  <strong>
                                    {
                                      doctor.experience_years ||
                                      0
                                    } Years
                                  </strong>

                                </div>


                                <div>

                                  <span>
                                    Fee
                                  </span>

                                  <strong className="ai-fee">

                                    <IndianRupee
                                      size={12}
                                    />

                                    {
                                      doctor.consultation_fee ||
                                      0
                                    }

                                  </strong>

                                </div>

                              </div>


                              {/* =====================================
                                  NEXT AVAILABLE SLOT
                              ====================================== */}

                              {doctor.next_available_slot ? (

                                <div className="ai-next-slot">

                                  <Clock3
                                    size={14}
                                  />

                                  <div>

                                    <span>
                                      Next available
                                    </span>

                                    <strong>

                                      {
                                        doctor
                                          .next_available_slot
                                          .display_date
                                      }

                                      {" at "}

                                      {
                                        doctor
                                          .next_available_slot
                                          .display_time
                                      }

                                    </strong>

                                  </div>

                                </div>

                              ) : (

                                <div className="ai-no-slot">

                                  <Clock3
                                    size={13}
                                  />

                                  <span>
                                    No available slots
                                    in the next 14 days.
                                  </span>

                                </div>

                              )}


                              {/* =====================================
                                  ACTION BUTTONS
                              ====================================== */}

                              <div className="ai-doctor-actions">

                                <button
                                  type="button"
                                  className="ai-view-doctor-btn"
                                  onClick={() =>
                                    viewDoctor(
                                      doctor
                                    )
                                  }
                                >

                                  <UserRound
                                    size={14}
                                  />

                                  View Doctor

                                </button>


                                <button
                                  type="button"
                                  className="ai-book-doctor-btn"
                                  disabled={
                                    !doctor.next_available_slot
                                  }
                                  onClick={() =>
                                    bookExactSlot(
                                      doctor
                                    )
                                  }
                                >

                                  <CalendarDays
                                    size={14}
                                  />

                                  {
                                    doctor.next_available_slot
                                      ? "Book Next Slot"
                                      : "No Slots"
                                  }

                                </button>

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    )}


                    {/* =================================================
                        NO DOCTORS
                    ================================================= */}

                    {!message.emergency &&
                      message.intent ===
                        "MEDICAL" &&
                      message.department &&
                      message.doctors &&
                      message.doctors.length ===
                        0 && (

                      <div className="ai-no-doctors">

                        <Stethoscope
                          size={14}
                        />

                        <span>
                          No currently available
                          doctors were found for
                          this department.
                        </span>

                      </div>

                    )}

                  </div>

                </div>

              )
            )}


            {/* =================================================
                TYPING
            ================================================= */}

            {loading && (

              <div className="ai-message-row bot">

                <div className="ai-message-bubble ai-typing">

                  <span />
                  <span />
                  <span />

                </div>

              </div>

            )}


            <div
              ref={
                messagesEndRef
              }
            />

          </div>


          {/* =================================================
              INPUT
          ================================================= */}

          <form
            className="ai-chat-input"
            onSubmit={
              sendMessage
            }
          >

            <input
              type="text"
              placeholder="Describe your symptoms..."
              value={
                input
              }
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              disabled={
                loading
              }
              maxLength={
                1000
              }
            />


            <button
              type="submit"
              disabled={
                loading ||
                !input.trim()
              }
              aria-label="Send message"
            >

              <Send
                size={18}
              />

            </button>

          </form>


        </div>

      )}

    </>

  );

}


export default AIChatbot;