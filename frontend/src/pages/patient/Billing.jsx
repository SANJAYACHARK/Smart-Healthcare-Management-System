import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeIndianRupee,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  ReceiptText,
  RefreshCw,
  Search,
  WalletCards,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


function Billing() {

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
    error,
    setError,
  ] = useState("");


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");


  const [
    payingBillId,
    setPayingBillId,
  ] = useState(null);

  const [
    success,
    setSuccess,
  ] = useState("");


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


  const loadBills =
    async (
      showRefresh = false
    ) => {

      try {

        if (
          showRefresh
        ) {

          setRefreshing(
            true
          );

        } else {

          setLoading(
            true
          );

        }


        setError("");


        const response =
          await api.get(
            "/billing/patient/"
          );


        setBills(
          getResults(
            response
          )
        );

      } catch (err) {

        console.error(
          "Patient billing error:",
          err
        );


        setBills([]);


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

    loadBills();

  }, []);


  const toNumber = (
    value
  ) => {

    const number =
      Number(value);


    return Number.isFinite(
      number
    )
      ? number
      : 0;

  };


  const formatCurrency = (
    value
  ) => {

    return new Intl
      .NumberFormat(
        "en-IN",
        {
          style:
            "currency",

          currency:
            "INR",

          minimumFractionDigits:
            2,

          maximumFractionDigits:
            2,
        }
      )
      .format(
        toNumber(
          value
        )
      );

  };


  const formatDate = (
    value
  ) => {

    if (
      !value
    ) {

      return "-";

    }


    const safeValue =
      String(value)
        .includes("T")
        ? value
        : `${value}T00:00:00`;


    const date =
      new Date(
        safeValue
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return value;

    }


    return date
      .toLocaleDateString(
        "en-IN",
        {
          day:
            "2-digit",

          month:
            "short",

          year:
            "numeric",
        }
      );

  };


  const formatStatus = (
    value
  ) => {

    if (
      !value
    ) {

      return "Unpaid";

    }


    return String(value)
      .toLowerCase()
      .split("_")
      .map(
        (
          word
        ) =>
          word.charAt(0)
            .toUpperCase() +
          word.slice(1)
      )
      .join(" ");

  };


  const loadRazorpayScript =
    () =>
      new Promise(
        (
          resolve
        ) => {

          if (
            window.Razorpay
          ) {

            resolve(true);
            return;

          }

          const script =
            document.createElement(
              "script"
            );

          script.src =
            "https://checkout.razorpay.com/v1/checkout.js";

          script.async =
            true;

          script.onload =
            () => resolve(true);

          script.onerror =
            () => resolve(false);

          document.body.appendChild(
            script
          );

        }
      );


  const payBill =
    async (
      bill
    ) => {

      try {

        setPayingBillId(
          bill.id
        );

        setError("");
        setSuccess("");

        const loaded =
          await loadRazorpayScript();

        if (!loaded) {

          throw new Error(
            "Unable to load Razorpay Checkout."
          );

        }

        const orderResponse =
          await api.post(
            `/billing/patient/${bill.id}/payment/create-order/`,
            {
              amount:
                bill.amount_due ||
                bill.amount,
            }
          );

        const order =
          orderResponse.data;

        const options = {
          key:
            order.key_id,

          amount:
            order.amount,

          currency:
            order.currency,

          name:
            "Smart Healthcare",

          description:
            order.description ||
            "Hospital Bill Payment",

          order_id:
            order.order_id,

          handler:
            async (
              response
            ) => {

              try {

                await api.post(
                  "/billing/patient/payment/verify/",
                  response
                );

                setSuccess(
                  `Payment completed successfully for ${order.invoice_number}.`
                );

                await loadBills();

              } catch (
                verifyError
              ) {

                console.error(
                  "Payment verification error:",
                  verifyError
                );

                setError(
                  verifyError.response
                    ?.data
                    ?.detail ||
                  "Payment completed but verification failed. Please contact support."
                );

              } finally {

                setPayingBillId(
                  null
                );

              }

            },

          modal: {
            ondismiss:
              () =>
                setPayingBillId(
                  null
                ),
          },

          theme: {
            color:
              "#970747",
          },
        };

        const checkout =
          new window.Razorpay(
            options
          );

        checkout.on(
          "payment.failed",
          (
            response
          ) => {

            setError(
              response.error
                ?.description ||
              "Payment failed. Please try again."
            );

            setPayingBillId(
              null
            );

          }
        );

        checkout.open();

      } catch (err) {

        console.error(
          "Create payment order error:",
          err
        );

        setError(
          err.response
            ?.data
            ?.detail ||
          err.message ||
          "Unable to start payment."
        );

        setPayingBillId(
          null
        );

      }

    };


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

            const searchable =
              [
                bill.invoice_number,
                bill.description,
                bill.payment_status,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
              !text ||
              searchable.includes(
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

        let totalAmount =
          0;

        let paidAmount =
          0;

        let outstandingAmount =
          0;

        let unpaidCount =
          0;


        bills.forEach(
          (
            bill
          ) => {

            const amount =
              toNumber(
                bill.amount
              );


            totalAmount +=
              amount;


            const paid =
              toNumber(
                bill.amount_paid
              );

            const due =
              toNumber(
                bill.amount_due
              );

            paidAmount +=
              bill.amount_paid !==
              undefined
                ? paid
                : bill.payment_status ===
                  "PAID"
                ? amount
                : 0;

            outstandingAmount +=
              bill.amount_due !==
              undefined
                ? due
                : bill.payment_status ===
                  "PAID"
                ? 0
                : amount;

            if (
              bill.payment_status !==
              "PAID"
            ) {

              unpaidCount +=
                1;

            }

          }
        );


        return {
          totalAmount,
          paidAmount,
          outstandingAmount,
          unpaidCount,
        };

      },
      [
        bills,
      ]
    );


  return (

    <Layout>

      <div className="page-content patient-billing-page">


        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              PATIENT
            </p>


            <h1>
              Billing & Payments
            </h1>


            <p className="page-description">

              Review your hospital invoices,
              charges and current payment
              status.

            </p>

          </div>


          <button
            type="button"
            className="btn-secondary"
            disabled={
              refreshing
            }
            onClick={
              () =>
                loadBills(
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


        {
          error && (

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


        <div className="patient-billing-stats">


          <div className="patient-billing-stat">

            <ReceiptText
              size={20}
            />

            <div>

              <strong>
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


          <div className="patient-billing-stat">

            <CheckCircle2
              size={20}
            />

            <div>

              <strong>
                {
                  formatCurrency(
                    stats.paidAmount
                  )
                }
              </strong>

              <span>
                Paid
              </span>

            </div>

          </div>


          <div className="patient-billing-stat">

            <BadgeIndianRupee
              size={20}
            />

            <div>

              <strong>
                {
                  formatCurrency(
                    stats.outstandingAmount
                  )
                }
              </strong>

              <span>
                Open Bill Value
              </span>

            </div>

          </div>


          <div className="patient-billing-stat">

            <Clock3
              size={20}
            />

            <div>

              <strong>
                {stats.unpaidCount}
              </strong>

              <span>
                Open Bills
              </span>

            </div>

          </div>


        </div>


        <div className="card patient-billing-toolbar">

          <div className="search-box">

            <Search
              size={18}
            />


            <input
              type="text"
              placeholder="Search invoice number, description or status..."
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


          <select
            value={
              statusFilter
            }
            onChange={
              (
                event
              ) =>
                setStatusFilter(
                  event.target.value
                )
            }
          >

            <option value="ALL">
              All Statuses
            </option>

            <option value="UNPAID">
              Unpaid
            </option>

            <option value="PARTIAL">
              Partially Paid
            </option>

            <option value="PAID">
              Paid
            </option>

          </select>

        </div>


        {
          loading ? (

            <div className="card patient-billing-loading">

              <Loader2
                size={24}
                className="spin"
              />

              <span>
                Loading billing information...
              </span>

            </div>

          ) : filteredBills
            .length ===
            0 ? (

            <div className="card empty-state patient-billing-empty">

              <ReceiptText
                size={42}
              />


              <h3>

                {
                  bills.length ===
                  0
                    ? "No bills found"
                    : "No matching bills"
                }

              </h3>


              <p>

                {
                  bills.length ===
                  0
                    ? "Your hospital invoices will appear here when they are generated."
                    : "Try changing your search or payment-status filter."
                }

              </p>

            </div>

          ) : (

            <div className="card patient-billing-table-card">

              <div className="patient-billing-table-header">

                <div>

                  <h2>
                    Invoice History
                  </h2>

                  <p>

                    Showing {
                      filteredBills.length
                    } of {
                      bills.length
                    } bill{
                      bills.length ===
                      1
                        ? ""
                        : "s"
                    }.

                  </p>

                </div>


                <WalletCards
                  size={22}
                />

              </div>


              <div className="table-responsive">

                <table className="data-table patient-billing-table">

                  <thead>

                    <tr>

                      <th>
                        Invoice
                      </th>

                      <th>
                        Description
                      </th>

                      <th>
                        Date
                      </th>

                      <th>
                        Amount
                      </th>

                      <th>
                        Payment Status
                      </th>

                      <th>
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      filteredBills.map(
                        (
                          bill
                        ) => (

                          <tr
                            key={
                              bill.id
                            }
                          >

                            <td>

                              <div className="patient-invoice-number">

                                <FileText
                                  size={16}
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

                              <div className="patient-bill-description">

                                {
                                  bill.description ||
                                  "Hospital charges"
                                }

                              </div>

                            </td>


                            <td>

                              <div className="patient-bill-date">

                                <CalendarDays
                                  size={15}
                                />

                                {
                                  bill.created_at_display ||
                                  formatDate(
                                    bill.created_at ||
                                    bill.date
                                  )
                                }

                              </div>

                            </td>


                            <td>

                              <strong className="patient-bill-amount">

                                {
                                  formatCurrency(
                                    bill.amount
                                  )
                                }

                              </strong>

                            </td>


                            <td>

                              <span
                                className={`status-badge billing-status-${String(
                                  bill.payment_status ||
                                  "UNPAID"
                                ).toLowerCase()}`}
                              >

                                {
                                  formatStatus(
                                    bill.payment_status
                                  )
                                }

                              </span>

                            </td>


                            <td>

                              {
                                bill.payment_status ===
                                "PAID" ? (

                                  <span className="table-secondary">
                                    Paid in full
                                  </span>

                                ) : (

                                  <button
                                    type="button"
                                    className="btn-small patient-pay-now-btn"
                                    disabled={
                                      payingBillId ===
                                      bill.id
                                    }
                                    onClick={
                                      () =>
                                        payBill(
                                          bill
                                        )
                                    }
                                  >

                                    {
                                      payingBillId ===
                                      bill.id ? (

                                        <Loader2
                                          size={15}
                                          className="spin"
                                        />

                                      ) : (

                                        <CreditCard
                                          size={15}
                                        />

                                      )
                                    }

                                    {
                                      payingBillId ===
                                      bill.id
                                        ? "Starting..."
                                        : `Pay ${
                                            bill.amount_due
                                              ? formatCurrency(
                                                  bill.amount_due
                                                )
                                              : formatCurrency(
                                                  bill.amount
                                                )
                                          }`
                                    }

                                  </button>

                                )
                              }

                            </td>

                          </tr>

                        )
                      )
                    }

                  </tbody>

                </table>

              </div>

            </div>

          )
        }


      </div>

    </Layout>

  );

}


export default Billing;
