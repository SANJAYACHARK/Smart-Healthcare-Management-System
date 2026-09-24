import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Edit,
  IdCard,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Search,
  UserCog,
  UserRoundCheck,
  UserRoundX,
  X,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


const INITIAL_FORM = {
  username: "",
  password: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  employee_id: "",
};


function Receptionists() {

  const [
    receptionists,
    setReceptionists,
  ] = useState([]);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");


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
    togglingId,
    setTogglingId,
  ] = useState(null);


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
    editingReceptionist,
    setEditingReceptionist,
  ] = useState(null);


  const [
    formData,
    setFormData,
  ] = useState(
    INITIAL_FORM
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


  const fetchReceptionists =
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


        const response =
          await api.get(
            "/accounts/admin/receptionists/"
          );


        setReceptionists(
          normalizeResults(
            response
          )
        );

      } catch (err) {

        console.error(
          "Failed to fetch receptionists:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Failed to load receptionists."
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

    fetchReceptionists();

  }, []);


  const filteredReceptionists =
    useMemo(
      () => {

        const searchText =
          search
            .trim()
            .toLowerCase();


        return receptionists.filter(
          (
            person
          ) => {

            const fullName =
              `${person.first_name || ""} ${
                person.last_name || ""
              }`
                .trim()
                .toLowerCase();


            const matchesSearch =
              !searchText ||
              fullName.includes(
                searchText
              ) ||
              String(
                person.username ||
                ""
              )
                .toLowerCase()
                .includes(
                  searchText
                ) ||
              String(
                person.email ||
                ""
              )
                .toLowerCase()
                .includes(
                  searchText
                ) ||
              String(
                person.employee_id ||
                ""
              )
                .toLowerCase()
                .includes(
                  searchText
                ) ||
              String(
                person.phone ||
                ""
              )
                .toLowerCase()
                .includes(
                  searchText
                );


            const matchesStatus =
              statusFilter ===
              "ALL" ||
              (
                statusFilter ===
                "ACTIVE" &&
                person.is_active
              ) ||
              (
                statusFilter ===
                "INACTIVE" &&
                !person.is_active
              );


            return (
              matchesSearch &&
              matchesStatus
            );

          }
        );

      },
      [
        receptionists,
        search,
        statusFilter,
      ]
    );


  const stats =
    useMemo(
      () => {

        const active =
          receptionists.filter(
            (
              person
            ) =>
              person.is_active
          ).length;


        return {
          total:
            receptionists.length,

          active,

          inactive:
            receptionists.length -
            active,
        };

      },
      [
        receptionists,
      ]
    );


  const handleAddReceptionist =
    () => {

      setEditingReceptionist(
        null
      );


      setFormData({
        ...INITIAL_FORM,
      });


      setError("");
      setSuccess("");


      setShowModal(
        true
      );

    };


  const handleEditReceptionist =
    (
      person
    ) => {

      setEditingReceptionist(
        person
      );


      setFormData({
        username:
          person.username ||
          "",

        password: "",

        first_name:
          person.first_name ||
          "",

        last_name:
          person.last_name ||
          "",

        email:
          person.email ||
          "",

        phone:
          person.phone ||
          "",

        employee_id:
          person.employee_id ||
          "",
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


      setEditingReceptionist(
        null
      );


      setFormData({
        ...INITIAL_FORM,
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


  const formatBackendError =
    (
      err
    ) => {

      const backendError =
        err.response?.data;


      if (
        !backendError
      ) {

        return (
          "Unable to save receptionist."
        );

      }


      if (
        typeof backendError ===
        "string"
      ) {

        return backendError;

      }


      if (
        typeof backendError.detail ===
        "string"
      ) {

        return backendError.detail;

      }


      const entries =
        Object.entries(
          backendError
        );


      if (
        entries.length ===
        0
      ) {

        return (
          "Unable to save receptionist."
        );

      }


      return entries
        .map(
          (
            [
              field,
              value,
            ]
          ) => {

            const label =
              field
                .replaceAll(
                  "_",
                  " "
                )
                .replace(
                  /\b\w/g,
                  (
                    letter
                  ) =>
                    letter.toUpperCase()
                );


            const message =
              Array.isArray(
                value
              )
                ? value.join(
                    ", "
                  )
                : String(
                    value
                  );


            return `${label}: ${message}`;

          }
        )
        .join(
          " | "
        );

    };


  const validateForm =
    () => {

      if (
        !formData.first_name
          .trim()
      ) {

        return (
          "First name is required."
        );

      }


      if (
        !formData.email
          .trim()
      ) {

        return (
          "Email is required."
        );

      }


      if (
        !formData.employee_id
          .trim()
      ) {

        return (
          "Employee ID is required."
        );

      }


      if (
        !editingReceptionist &&
        !formData.username
          .trim()
      ) {

        return (
          "Username is required."
        );

      }


      if (
        !editingReceptionist &&
        formData.password.length <
          6
      ) {

        return (
          "Password must contain at least 6 characters."
        );

      }


      return "";

    };


  const handleSubmit =
    async (
      event
    ) => {

      event.preventDefault();


      const validationError =
        validateForm();


      if (
        validationError
      ) {

        setError(
          validationError
        );

        return;

      }


      try {

        setSubmitting(
          true
        );

        setError("");
        setSuccess("");


        if (
          editingReceptionist
        ) {

          const updateData = {
            first_name:
              formData.first_name
                .trim(),

            last_name:
              formData.last_name
                .trim(),

            email:
              formData.email
                .trim(),

            phone:
              formData.phone
                .trim(),

            employee_id:
              formData.employee_id
                .trim(),
          };


          await api.put(
            `/accounts/admin/receptionists/${editingReceptionist.id}/`,
            updateData
          );


          setSuccess(
            "Receptionist updated successfully."
          );

        } else {

          const createData = {
            username:
              formData.username
                .trim(),

            password:
              formData.password,

            first_name:
              formData.first_name
                .trim(),

            last_name:
              formData.last_name
                .trim(),

            email:
              formData.email
                .trim(),

            phone:
              formData.phone
                .trim(),

            employee_id:
              formData.employee_id
                .trim(),
          };


          await api.post(
            "/accounts/admin/receptionists/",
            createData
          );


          setSuccess(
            "Receptionist created successfully."
          );

        }


        setShowModal(
          false
        );


        setEditingReceptionist(
          null
        );


        setFormData({
          ...INITIAL_FORM,
        });


        await fetchReceptionists();

      } catch (err) {

        console.error(
          "Receptionist save error:",
          err
        );


        setError(
          formatBackendError(
            err
          )
        );

      } finally {

        setSubmitting(
          false
        );

      }

    };


  const toggleStatus =
    async (
      person
    ) => {

      try {

        setTogglingId(
          person.id
        );

        setError("");
        setSuccess("");


        await api.patch(
          `/accounts/admin/receptionists/${person.id}/`,
          {
            is_active:
              !person.is_active,
          }
        );


        setReceptionists(
          (
            previous
          ) =>
            previous.map(
              (
                item
              ) =>
                item.id ===
                person.id
                  ? {
                      ...item,
                      is_active:
                        !person.is_active,
                    }
                  : item
            )
        );


        setSuccess(
          person.is_active
            ? "Receptionist deactivated successfully."
            : "Receptionist activated successfully."
        );

      } catch (err) {

        console.error(
          "Status update failed:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to update receptionist status."
        );

      } finally {

        setTogglingId(
          null
        );

      }

    };


  const getName =
    (
      person
    ) => {

      const fullName =
        `${person.first_name || ""} ${
          person.last_name || ""
        }`.trim();


      return (
        fullName ||
        person.username ||
        "Receptionist"
      );

    };


  return (

    <Layout>

      <div className="page-content admin-receptionists-page">


        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              ADMINISTRATION
            </p>


            <h1>
              Manage Receptionists
            </h1>


            <p className="page-description">

              Create, update and manage
              receptionist accounts and
              their active status.

            </p>

          </div>


          <div className="admin-receptionists-header-actions">

            <button
              type="button"
              className="btn-secondary"
              disabled={
                refreshing
              }
              onClick={
                () =>
                  fetchReceptionists(
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
                handleAddReceptionist
              }
            >

              <Plus
                size={18}
              />

              Add Receptionist

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


        <div className="admin-receptionist-stats">


          <button
            type="button"
            className={
              statusFilter ===
              "ALL"
                ? "admin-receptionist-stat active"
                : "admin-receptionist-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "ALL"
                )
            }
          >

            <UserCog
              size={19}
            />

            <div>

              <strong>
                {
                  stats.total
                }
              </strong>

              <span>
                Total Receptionists
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
              "ACTIVE"
                ? "admin-receptionist-stat active"
                : "admin-receptionist-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "ACTIVE"
                )
            }
          >

            <UserRoundCheck
              size={19}
            />

            <div>

              <strong>
                {
                  stats.active
                }
              </strong>

              <span>
                Active Accounts
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
              "INACTIVE"
                ? "admin-receptionist-stat active"
                : "admin-receptionist-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "INACTIVE"
                )
            }
          >

            <UserRoundX
              size={19}
            />

            <div>

              <strong>
                {
                  stats.inactive
                }
              </strong>

              <span>
                Inactive Accounts
              </span>

            </div>

          </button>


          <div className="admin-receptionist-stat static">

            <IdCard
              size={19}
            />

            <div>

              <strong>
                {
                  stats.total
                }
              </strong>

              <span>
                Employee IDs
              </span>

            </div>

          </div>


        </div>


        <div className="card admin-receptionists-card">

          <div className="admin-receptionists-toolbar">

            <div className="search-box">

              <Search
                size={19}
              />


              <input
                type="text"
                placeholder="Search name, username, email, phone or employee ID..."
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
              className="admin-receptionists-filter"
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

              <option value="ALL">
                All Receptionists
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>

            </select>

          </div>


          <div className="table-responsive">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    Receptionist
                  </th>

                  <th>
                    Employee ID
                  </th>

                  <th>
                    Phone
                  </th>

                  <th>
                    Username
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {
                  loading ? (

                    <tr>

                      <td
                        colSpan="6"
                        className="admin-receptionist-empty-cell"
                      >

                        Loading receptionists...

                      </td>

                    </tr>

                  ) : filteredReceptionists
                    .length ===
                    0 ? (

                    <tr>

                      <td
                        colSpan="6"
                        className="admin-receptionist-empty-cell"
                      >

                        No receptionists found.

                      </td>

                    </tr>

                  ) : (

                    filteredReceptionists.map(
                      (
                        person
                      ) => (

                        <tr
                          key={
                            person.id
                          }
                        >

                          <td>

                            <div className="table-user">

                              <div className="table-avatar">

                                <UserCog
                                  size={18}
                                />

                              </div>


                              <div>

                                <strong>

                                  {
                                    getName(
                                      person
                                    )
                                  }

                                </strong>


                                <span>

                                  {
                                    person.email ||
                                    "-"
                                  }

                                </span>

                              </div>

                            </div>

                          </td>


                          <td>

                            <span className="admin-receptionist-employee-id">

                              <IdCard
                                size={14}
                              />

                              {
                                person.employee_id ||
                                "-"
                              }

                            </span>

                          </td>


                          <td>

                            {
                              person.phone ||
                              "-"
                            }

                          </td>


                          <td>

                            {
                              person.username ||
                              "-"
                            }

                          </td>


                          <td>

                            <span
                              className={
                                person.is_active
                                  ? "status-badge status-active"
                                  : "status-badge status-inactive"
                              }
                            >

                              {
                                person.is_active
                                  ? "Active"
                                  : "Inactive"
                              }

                            </span>

                          </td>


                          <td>

                            <div className="table-actions">

                              <button
                                type="button"
                                className="icon-btn"
                                title="Edit Receptionist"
                                disabled={
                                  togglingId ===
                                  person.id
                                }
                                onClick={
                                  () =>
                                    handleEditReceptionist(
                                      person
                                    )
                                }
                              >

                                <Edit
                                  size={17}
                                />

                              </button>


                              <button
                                type="button"
                                className={
                                  person.is_active
                                    ? "icon-btn admin-receptionist-power active"
                                    : "icon-btn admin-receptionist-power"
                                }
                                title={
                                  person.is_active
                                    ? "Deactivate Receptionist"
                                    : "Activate Receptionist"
                                }
                                disabled={
                                  togglingId ===
                                  person.id
                                }
                                onClick={
                                  () =>
                                    toggleStatus(
                                      person
                                    )
                                }
                              >

                                {
                                  togglingId ===
                                  person.id ? (

                                    <Loader2
                                      size={17}
                                      className="spin"
                                    />

                                  ) : (

                                    <Power
                                      size={17}
                                    />

                                  )
                                }

                              </button>

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
          showModal && (

            <div
              className="modal-overlay"
              role="presentation"
            >

              <div
                className="modal admin-receptionist-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-receptionist-modal-title"
              >

                <div className="modal-header">

                  <div>

                    <p className="page-eyebrow">
                      ADMINISTRATION
                    </p>


                    <h2 id="admin-receptionist-modal-title">

                      {
                        editingReceptionist
                          ? "Edit Receptionist"
                          : "Add Receptionist"
                      }

                    </h2>


                    <p>

                      {
                        editingReceptionist
                          ? "Update receptionist information."
                          : "Create a new receptionist account."
                      }

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
                    handleSubmit
                  }
                >

                  <div className="form-grid">


                    {
                      !editingReceptionist && (

                        <>

                          <div className="form-group">

                            <label htmlFor="receptionist-username">
                              Username
                            </label>


                            <input
                              id="receptionist-username"
                              name="username"
                              value={
                                formData.username
                              }
                              onChange={
                                handleChange
                              }
                              autoComplete="off"
                              required
                            />

                          </div>


                          <div className="form-group">

                            <label htmlFor="receptionist-password">
                              Password
                            </label>


                            <input
                              id="receptionist-password"
                              type="password"
                              name="password"
                              value={
                                formData.password
                              }
                              onChange={
                                handleChange
                              }
                              autoComplete="new-password"
                              minLength="6"
                              required
                            />

                          </div>

                        </>

                      )
                    }


                    <div className="form-group">

                      <label htmlFor="receptionist-first-name">
                        First Name
                      </label>


                      <input
                        id="receptionist-first-name"
                        name="first_name"
                        value={
                          formData.first_name
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />

                    </div>


                    <div className="form-group">

                      <label htmlFor="receptionist-last-name">
                        Last Name
                      </label>


                      <input
                        id="receptionist-last-name"
                        name="last_name"
                        value={
                          formData.last_name
                        }
                        onChange={
                          handleChange
                        }
                      />

                    </div>


                    <div className="form-group">

                      <label htmlFor="receptionist-email">
                        Email
                      </label>


                      <input
                        id="receptionist-email"
                        type="email"
                        name="email"
                        value={
                          formData.email
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />

                    </div>


                    <div className="form-group">

                      <label htmlFor="receptionist-phone">
                        Phone
                      </label>


                      <input
                        id="receptionist-phone"
                        name="phone"
                        value={
                          formData.phone
                        }
                        onChange={
                          handleChange
                        }
                      />

                    </div>


                    <div className="form-group">

                      <label htmlFor="receptionist-employee-id">
                        Employee ID
                      </label>


                      <div className="admin-receptionist-input-icon">

                        <IdCard
                          size={16}
                        />


                        <input
                          id="receptionist-employee-id"
                          name="employee_id"
                          value={
                            formData.employee_id
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="Example: REC-001"
                          required
                        />

                      </div>

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
                        submitting && (

                          <Loader2
                            size={16}
                            className="spin"
                          />

                        )
                      }

                      {
                        submitting
                          ? editingReceptionist
                            ? "Updating..."
                            : "Creating..."
                          : editingReceptionist
                            ? "Update Receptionist"
                            : "Create Receptionist"
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


export default Receptionists;
