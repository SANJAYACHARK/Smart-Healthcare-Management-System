import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeIndianRupee,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


const EMPTY_FORM = {
  patient: "",
  description: "",
  amount: "",
};


const PAYMENT_STATUSES = [
  "ALL",
  "UNPAID",
  "PARTIAL",
  "PAID",
];


function Billing() {

  const [
    patients,
    setPatients,
  ] = useState([]);


  const [
    bills,
    setBills,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    showModal,
    setShowModal,
  ] = useState(false);


  const [
    showPaymentModal,
    setShowPaymentModal,
  ] = useState(false);

  const [
    selectedBill,
    setSelectedBill,
  ] = useState(null);

  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState("");


  const [
    formData,
    setFormData,
  ] = useState(
    EMPTY_FORM
  );


  const normalizeResults =
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


      return [];

    };


  const fetchData =
    async (
      showRefresh = false
    ) => {

      try {

        if (showRefresh) {

          setRefreshing(
            true
          );

        } else {

          setLoading(
            true
          );

        }


        setError("");


        const [
          patientResponse,
          billResponse,
        ] = await Promise.all([
          api.get(
            "/accounts/receptionist/patients/"
          ),

          api.get(
            "/billing/receptionist/"
          ),
        ]);


        setPatients(
          normalizeResults(
            patientResponse
          )
        );


        setBills(
          normalizeResults(
            billResponse
          )
        );

      } catch (err) {

        console.error(
          "Receptionist billing error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to load billing information."
        );

      } finally {

        setLoading(
          false
        );

        setRefreshing(
          false
        );

      }

    };


  useEffect(() => {

    fetchData();

  }, []);


  const filteredBills =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();


        return bills.filter(
          (
            bill
          ) => {

            const matchesSearch =
              !text ||
              String(
                bill.patient_name ||
                ""
              )
                .toLowerCase()
                .includes(
                  text
                ) ||
              String(
                bill.invoice_number ||
                ""
              )
                .toLowerCase()
                .includes(
                  text
                ) ||
              String(
                bill.description ||
                ""
              )
                .toLowerCase()
                .includes(
                  text
                ) ||
              String(
                bill.payment_status ||
                ""
              )
                .toLowerCase()
                .includes(
                  text
                );


            const matchesStatus =
              statusFilter ===
              "ALL" ||
              bill.payment_status ===
              statusFilter;


            return (
              matchesSearch &&
              matchesStatus
            );

          }
        );

      },
      [
        bills,
        search,
        statusFilter,
      ]
    );


  const stats =
    useMemo(
      () => {

        let totalAmount = 0;
        let paid = 0;
        let partial = 0;
        let unpaid = 0;


        bills.forEach(
          (
            bill
          ) => {

            const amount =
              Number(
                bill.amount
              );


            if (
              Number.isFinite(
                amount
              )
            ) {

              totalAmount +=
                amount;

            }


            if (
              bill.payment_status ===
              "PAID"
            ) {

              paid += 1;

            } else if (
              bill.payment_status ===
              "PARTIAL"
            ) {

              partial += 1;

            } else if (
              bill.payment_status ===
              "UNPAID"
            ) {

              unpaid += 1;

            }

          }
        );


        return {
          totalBills:
            bills.length,

          totalAmount,

          paid,

          partial,

          unpaid,
        };

      },
      [
        bills,
      ]
    );


  const formatCurrency =
    (
      value
    ) => {

      const amount =
        Number(
          value
        );


      if (
        !Number.isFinite(
          amount
        )
      ) {

        return "₹0";

      }


      return new Intl.NumberFormat(
        "en-IN",
        {
          style:
            "currency",

          currency:
            "INR",

          minimumFractionDigits:
            0,

          maximumFractionDigits:
            2,
        }
      ).format(
        amount
      );

    };


  const formatStatus =
    (
      status
    ) => {

      if (!status) {

        return "-";

      }


      return String(
        status
      )
        .replaceAll(
          "_",
          " "
        )
        .toLowerCase()
        .replace(
          /\b\w/g,
          (
            letter
          ) =>
            letter.toUpperCase()
        );

    };


  const openModal =
    () => {

      setFormData({
        ...EMPTY_FORM,
      });


      setError("");
      setSuccess("");


      setShowModal(
        true
      );

    };


  const closeModal =
    () => {

      if (
        submitting
      ) {

        return;

      }


      setShowModal(
        false
      );


      setFormData({
        ...EMPTY_FORM,
      });


      setError("");

    };


  const handleChange =
    (
      event
    ) => {

      const {
        name,
        value,
      } = event.target;


      setFormData(
        (
          previous
        ) => ({
          ...previous,
          [name]:
            value,
        })
      );

    };


  const submitBill =
    async (
      event
    ) => {

      event.preventDefault();


      const patientId =
        Number(
          formData.patient
        );


      const description =
        formData.description
          .trim();


      const amount =
        Number(
          formData.amount
        );


      if (
        !patientId
      ) {

        setError(
          "Please select a patient."
        );

        return;

      }


      if (
        !description
      ) {

        setError(
          "Please enter the bill description."
        );

        return;

      }


      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {

        setError(
          "Please enter an amount greater than zero."
        );

        return;

      }


      try {

        setSubmitting(
          true
        );

        setError("");
        setSuccess("");


        await api.post(
          "/billing/receptionist/",
          {
            patient:
              patientId,

            description,

            amount:
              formData.amount,
          }
        );


        setShowModal(
          false
        );


        setFormData({
          ...EMPTY_FORM,
        });


        setSuccess(
          "Bill created successfully."
        );


        await fetchData();

      } catch (err) {

        console.error(
          "Create bill error:",
          err
        );


        const data =
          err.response?.data;


        setError(
          data?.detail ||
          data?.patient?.[0] ||
          data?.description?.[0] ||
          data?.amount?.[0] ||
          "Unable to create bill."
        );

      } finally {

        setSubmitting(
          false
        );

      }

    };


  const openPaymentModal =
    (
      bill
    ) => {

      const amountDue =
        Number(
          bill.amount_due ??
          bill.amount
        );

      setSelectedBill(
        bill
      );

      setPaymentAmount(
        Number.isFinite(amountDue) &&
        amountDue > 0
          ? String(amountDue)
          : ""
      );

      setError("");
      setSuccess("");

      setShowPaymentModal(
        true
      );

    };


  const closePaymentModal =
    () => {

      if (updatingId) {
        return;
      }

      setShowPaymentModal(
        false
      );

      setSelectedBill(
        null
      );

      setPaymentAmount("");

      setError("");

    };


  const recordOfflinePayment =
    async (
      event
    ) => {

      event.preventDefault();

      if (!selectedBill) {
        return;
      }

      const amount =
        Number(
          paymentAmount
        );

      const amountDue =
        Number(
          selectedBill.amount_due ??
          selectedBill.amount
        );

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {

        setError(
          "Please enter a payment amount greater than zero."
        );

        return;

      }


      if (
        Number.isFinite(amountDue) &&
        amount > amountDue
      ) {

        setError(
          `Payment cannot exceed the outstanding amount of ${formatCurrency(
            amountDue
          )}.`
        );

        return;

      }


      try {

        setUpdatingId(
          selectedBill.id
        );

        setError("");
        setSuccess("");


        const response =
          await api.patch(
            `/billing/receptionist/${selectedBill.id}/`,
            {
              amount:
                paymentAmount,
            }
          );


        const updatedBill =
          response?.data?.bill;


        if (updatedBill) {

          setBills(
            (
              previous
            ) =>
              previous.map(
                (
                  item
                ) =>
                  item.id ===
                  updatedBill.id
                    ? updatedBill
                    : item
              )
          );

        } else {

          await fetchData();

        }


        setShowPaymentModal(
          false
        );

        setSelectedBill(
          null
        );

        setPaymentAmount("");


        setSuccess(
          "Offline payment recorded successfully."
        );

      } catch (err) {

        console.error(
          "Record offline payment error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to record offline payment."
        );

      } finally {

        setUpdatingId(
          null
        );

      }

    };


  const patientName =
    (
      patient
    ) => {

      const name =
        `${patient.first_name || ""} ${
          patient.last_name || ""
        }`.trim();


      return (
        name ||
        patient.username ||
        `Patient #${patient.id}`
      );

    };


  const paymentStatusClass =
    (
      status
    ) =>
      `status-badge payment-status-${
        String(
          status ||
          ""
        ).toLowerCase()
      }`;


  return (

    <Layout>

      <div className="page-content receptionist-billing-page">


        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              RECEPTIONIST
            </p>


            <h1>
              Billing
            </h1>


            <p className="page-description">

              Create patient bills,
              monitor invoices and review
              payment status.

            </p>

          </div>


          <div className="receptionist-billing-header-actions">

            <button
              type="button"
              className="btn-secondary"
              disabled={
                refreshing
              }
              onClick={
                () =>
                  fetchData(
                    true
                  )
              }
            >

              <RefreshCw
                size={16}
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


            <button
              type="button"
              className="btn-primary"
              onClick={
                openModal
              }
            >

              <Plus
                size={17}
              />

              Create Bill

            </button>

          </div>

        </div>


        {
          error &&
          !showModal && (

            <div className="error-message">

              {error}

            </div>

          )
        }


        {
          success && (

            <div className="auth-success">

              {success}

            </div>

          )
        }


        <div className="receptionist-billing-stats">


          <button
            type="button"
            className={
              statusFilter ===
              "ALL"
                ? "receptionist-billing-stat active"
                : "receptionist-billing-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "ALL"
                )
            }
          >

            <WalletCards
              size={19}
            />

            <div>

              <strong>
                {
                  stats.totalBills
                }
              </strong>

              <span>
                Total Bills
              </span>

            </div>

          </button>


          <div className="receptionist-billing-stat static">

            <BadgeIndianRupee
              size={19}
            />

            <div>

              <strong className="receptionist-billing-amount">

                {
                  formatCurrency(
                    stats.totalAmount
                  )
                }

              </strong>

              <span>
                Total Billed
              </span>

            </div>

          </div>


          <button
            type="button"
            className={
              statusFilter ===
              "PAID"
                ? "receptionist-billing-stat active"
                : "receptionist-billing-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "PAID"
                )
            }
          >

            <CheckCircle2
              size={19}
            />

            <div>

              <strong>
                {
                  stats.paid
                }
              </strong>

              <span>
                Paid
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
              "PARTIAL"
                ? "receptionist-billing-stat active"
                : "receptionist-billing-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "PARTIAL"
                )
            }
          >

            <CircleDollarSign
              size={19}
            />

            <div>

              <strong>
                {
                  stats.partial
                }
              </strong>

              <span>
                Partial
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
              "UNPAID"
                ? "receptionist-billing-stat active"
                : "receptionist-billing-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "UNPAID"
                )
            }
          >

            <Clock3
              size={19}
            />

            <div>

              <strong>
                {
                  stats.unpaid
                }
              </strong>

              <span>
                Unpaid
              </span>

            </div>

          </button>


        </div>


        <div className="card receptionist-billing-card">

          <div className="receptionist-billing-toolbar">

            <div className="search-box">

              <Search
                size={18}
              />


              <input
                type="text"
                placeholder="Search invoice, patient, description or status..."
                value={
                  search
                }
                onChange={
                  (
                    event
                  ) =>
                    setSearch(
                      event
                        .target
                        .value
                    )
                }
              />

            </div>


            <select
              className="receptionist-billing-filter"
              value={
                statusFilter
              }
              onChange={
                (
                  event
                ) =>
                  setStatusFilter(
                    event
                      .target
                      .value
                  )
              }
            >

              {
                PAYMENT_STATUSES.map(
                  (
                    status
                  ) => (

                    <option
                      key={
                        status
                      }
                      value={
                        status
                      }
                    >

                      {
                        status ===
                        "ALL"
                          ? "All Payments"
                          : formatStatus(
                              status
                            )
                      }

                    </option>

                  )
                )
              }

            </select>

          </div>


          <div className="table-responsive">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    Invoice
                  </th>

                  <th>
                    Patient
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {
                  loading ? (

                    <tr>

                      <td
                        colSpan="6"
                        className="receptionist-billing-empty-cell"
                      >

                        Loading bills...

                      </td>

                    </tr>

                  ) : filteredBills
                    .length ===
                    0 ? (

                    <tr>

                      <td
                        colSpan="6"
                        className="receptionist-billing-empty-cell"
                      >

                        No bills found.

                      </td>

                    </tr>

                  ) : (

                    filteredBills
                      .map(
                        (
                          bill
                        ) => (

                          <tr
                            key={
                              bill.id
                            }
                          >

                            <td>

                              <div className="receptionist-invoice">

                                <CreditCard
                                  size={15}
                                />

                                <strong>

                                  {
                                    bill.invoice_number ||
                                    `#${bill.id}`
                                  }

                                </strong>

                              </div>

                            </td>


                            <td>

                              <div className="table-user">

                                <div className="table-avatar">

                                  <UserRound
                                    size={16}
                                  />

                                </div>


                                <div>

                                  <strong>

                                    {
                                      bill.patient_name ||
                                      "Patient"
                                    }

                                  </strong>

                                </div>

                              </div>

                            </td>


                            <td>

                              <span className="receptionist-billing-description">

                                {
                                  bill.description ||
                                  "-"
                                }

                              </span>

                            </td>


                            <td>

                              <div className="receptionist-bill-amount-stack">

                                <strong className="receptionist-bill-value">

                                  {
                                    formatCurrency(
                                      bill.amount
                                    )
                                  }

                                </strong>

                                <span className="table-secondary">

                                  Paid: {
                                    formatCurrency(
                                      bill.amount_paid || 0
                                    )
                                  }

                                </span>

                                <span className="table-secondary">

                                  Due: {
                                    formatCurrency(
                                      bill.amount_due ?? bill.amount
                                    )
                                  }

                                </span>

                              </div>

                            </td>


                            <td>

                              <span
                                className={
                                  paymentStatusClass(
                                    bill.payment_status
                                  )
                                }
                              >

                                {
                                  formatStatus(
                                    bill.payment_status
                                  )
                                }

                              </span>

                            </td>


                            <td>

                              <div className="receptionist-payment-action">

                                {
                                  updatingId ===
                                  bill.id && (

                                    <Loader2
                                      size={15}
                                      className="spin"
                                    />

                                  )
                                }


                                {
                                  bill.payment_status ===
                                  "PAID" ? (

                                    <span className="receptionist-payment-complete">

                                      <CheckCircle2
                                        size={15}
                                      />

                                      Fully Paid

                                    </span>

                                  ) : (

                                    <button
                                      type="button"
                                      className="btn-small btn-secondary receptionist-record-payment-btn"
                                      disabled={
                                        updatingId ===
                                        bill.id
                                      }
                                      onClick={
                                        () =>
                                          openPaymentModal(
                                            bill
                                          )
                                      }
                                    >

                                      <BadgeIndianRupee
                                        size={15}
                                      />

                                      Record Payment

                                    </button>

                                  )
                                }

                              </div>

                            </td>

                          </tr>

                        )
                      )

                  )
                }

              </tbody>

            </table>

          </div>

        </div>


        {
          showPaymentModal &&
          selectedBill && (

            <div
              className="modal-overlay"
              role="presentation"
            >

              <div
                className="modal receptionist-billing-modal receptionist-payment-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="record-payment-title"
              >

                <div className="modal-header">

                  <div>

                    <p className="page-eyebrow">
                      PAYMENT
                    </p>

                    <h2 id="record-payment-title">
                      Record Offline Payment
                    </h2>

                    <p>
                      Record cash or another offline payment received from the patient.
                    </p>

                  </div>


                  <button
                    type="button"
                    className="modal-close"
                    disabled={
                      updatingId ===
                      selectedBill.id
                    }
                    onClick={
                      closePaymentModal
                    }
                    aria-label="Close"
                  >

                    <X
                      size={20}
                    />

                  </button>

                </div>


                <form
                  onSubmit={
                    recordOfflinePayment
                  }
                >

                  <div className="receptionist-payment-summary">

                    <div>

                      <span>
                        Invoice
                      </span>

                      <strong>
                        {
                          selectedBill.invoice_number ||
                          `#${selectedBill.id}`
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        Patient
                      </span>

                      <strong>
                        {
                          selectedBill.patient_name ||
                          "Patient"
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        Bill Amount
                      </span>

                      <strong>
                        {
                          formatCurrency(
                            selectedBill.amount
                          )
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        Already Paid
                      </span>

                      <strong>
                        {
                          formatCurrency(
                            selectedBill.amount_paid || 0
                          )
                        }
                      </strong>

                    </div>

                    <div className="receptionist-payment-summary-due">

                      <span>
                        Outstanding
                      </span>

                      <strong>
                        {
                          formatCurrency(
                            selectedBill.amount_due ??
                            selectedBill.amount
                          )
                        }
                      </strong>

                    </div>

                  </div>


                  <div className="form-group receptionist-billing-form-gap">

                    <label htmlFor="offline-payment-amount">
                      Amount Received
                    </label>


                    <div className="receptionist-amount-input">

                      <span>
                        ₹
                      </span>


                      <input
                        id="offline-payment-amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={
                          selectedBill.amount_due ??
                          selectedBill.amount
                        }
                        value={
                          paymentAmount
                        }
                        onChange={
                          (
                            event
                          ) =>
                            setPaymentAmount(
                              event.target.value
                            )
                        }
                        placeholder="Enter amount received"
                        required
                        autoFocus
                      />

                    </div>

                  </div>


                  {
                    error && (

                      <div className="error-message">

                        {error}

                      </div>

                    )
                  }


                  <div className="modal-actions">

                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={
                        updatingId ===
                        selectedBill.id
                      }
                      onClick={
                        closePaymentModal
                      }
                    >

                      Cancel

                    </button>


                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={
                        updatingId ===
                        selectedBill.id
                      }
                    >

                      {
                        updatingId ===
                        selectedBill.id ? (

                          <Loader2
                            size={17}
                            className="spin"
                          />

                        ) : (

                          <BadgeIndianRupee
                            size={17}
                          />

                        )
                      }

                      {
                        updatingId ===
                        selectedBill.id
                          ? "Recording..."
                          : "Record Payment"
                      }

                    </button>

                  </div>

                </form>

              </div>

            </div>

          )
        }


        {
          showModal && (

            <div
              className="modal-overlay"
              role="presentation"
            >

              <div
                className="modal receptionist-billing-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-bill-title"
              >

                <div className="modal-header">

                  <div>

                    <p className="page-eyebrow">
                      BILLING
                    </p>


                    <h2 id="create-bill-title">
                      Create Bill
                    </h2>


                    <p>

                      Create a new hospital
                      bill for a registered
                      patient.

                    </p>

                  </div>


                  <button
                    type="button"
                    className="modal-close"
                    disabled={
                      submitting
                    }
                    onClick={
                      closeModal
                    }
                    aria-label="Close"
                  >

                    <X
                      size={20}
                    />

                  </button>

                </div>


                <form
                  onSubmit={
                    submitBill
                  }
                >

                  <div className="form-group">

                    <label htmlFor="billing-patient">
                      Patient
                    </label>


                    <select
                      id="billing-patient"
                      name="patient"
                      value={
                        formData.patient
                      }
                      onChange={
                        handleChange
                      }
                      required
                    >

                      <option value="">
                        Select patient
                      </option>


                      {
                        patients.map(
                          (
                            patient
                          ) => (

                            <option
                              key={
                                patient.id
                              }
                              value={
                                patient.id
                              }
                            >

                              {
                                patientName(
                                  patient
                                )
                              }

                            </option>

                          )
                        )
                      }

                    </select>

                  </div>


                  <div className="form-group receptionist-billing-form-gap">

                    <label htmlFor="billing-description">
                      Description
                    </label>


                    <input
                      id="billing-description"
                      type="text"
                      name="description"
                      value={
                        formData.description
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. Consultation Fee"
                      required
                    />

                  </div>


                  <div className="form-group receptionist-billing-form-gap">

                    <label htmlFor="billing-amount">
                      Amount
                    </label>


                    <div className="receptionist-amount-input">

                      <span>
                        ₹
                      </span>


                      <input
                        id="billing-amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        name="amount"
                        value={
                          formData.amount
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter amount"
                        required
                      />

                    </div>

                  </div>


                  {
                    error && (

                      <div className="error-message">

                        {error}

                      </div>

                    )
                  }


                  <div className="modal-actions">

                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={
                        submitting
                      }
                      onClick={
                        closeModal
                      }
                    >

                      Cancel

                    </button>


                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={
                        submitting
                      }
                    >

                      {
                        submitting ? (

                          <Loader2
                            size={17}
                            className="spin"
                          />

                        ) : (

                          <CreditCard
                            size={17}
                          />

                        )
                      }

                      {
                        submitting
                          ? "Creating..."
                          : "Create Bill"
                      }

                    </button>

                  </div>

                </form>

              </div>

            </div>

          )
        }

      </div>

    </Layout>

  );

}


export default Billing;
