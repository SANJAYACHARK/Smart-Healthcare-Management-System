import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  Edit,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  Users,
  X,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


const INITIAL_FORM = {
  name: "",
  description: "",
  is_active: true,
};


function Departments() {

  const [
    departments,
    setDepartments,
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
    actionId,
    setActionId,
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
    search,
    setSearch,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");


  const [
    showModal,
    setShowModal,
  ] = useState(false);


  const [
    editingDepartment,
    setEditingDepartment,
  ] = useState(null);


  const [
    formData,
    setFormData,
  ] = useState(
    INITIAL_FORM
  );


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


      return [];

    };


  const fetchDepartments =
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
            "/departments/"
          );


        setDepartments(
          getResults(
            response
          )
        );

      } catch (err) {

        console.error(
          "Department load error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Failed to load departments."
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

    fetchDepartments();

  }, []);


  const stats =
    useMemo(
      () => {

        const active =
          departments.filter(
            (
              department
            ) =>
              department.is_active !==
              false
          ).length;


        const inactive =
          departments.length -
          active;


        const doctors =
          departments.reduce(
            (
              total,
              department
            ) =>
              total +
              Number(
                department.doctors_count ||
                0
              ),
            0
          );


        return {
          total:
            departments.length,

          active,

          inactive,

          doctors,
        };

      },
      [
        departments,
      ]
    );


  const filteredDepartments =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();


        return departments.filter(
          (
            department
          ) => {

            const matchesSearch =
              !text ||
              String(
                department.name ||
                ""
              )
                .toLowerCase()
                .includes(
                  text
                ) ||
              String(
                department.description ||
                ""
              )
                .toLowerCase()
                .includes(
                  text
                );


            const isActive =
              department.is_active !==
              false;


            const matchesStatus =
              statusFilter ===
              "ALL" ||
              (
                statusFilter ===
                "ACTIVE" &&
                isActive
              ) ||
              (
                statusFilter ===
                "INACTIVE" &&
                !isActive
              );


            return (
              matchesSearch &&
              matchesStatus
            );

          }
        );

      },
      [
        departments,
        search,
        statusFilter,
      ]
    );


  const openAddModal =
    () => {

      setEditingDepartment(
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


  const openEditModal =
    (
      department
    ) => {

      setEditingDepartment(
        department
      );


      setFormData({
        name:
          department.name ||
          "",

        description:
          department.description ||
          "",

        is_active:
          department.is_active !==
          false,
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


      setEditingDepartment(
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
        type,
        checked,
      } = event.target;


      setFormData(
        (
          previous
        ) => ({
          ...previous,

          [name]:
            type ===
            "checkbox"
              ? checked
              : value,
        })
      );

    };


  const formatBackendError =
    (
      err,
      fallback
    ) => {

      const data =
        err.response?.data;


      if (
        !data
      ) {

        return fallback;

      }


      if (
        typeof data ===
        "string"
      ) {

        return data;

      }


      if (
        data.detail
      ) {

        return data.detail;

      }


      if (
        data.name
      ) {

        return Array.isArray(
          data.name
        )
          ? data.name.join(
              ", "
            )
          : String(
              data.name
            );

      }


      const first =
        Object.values(
          data
        )[0];


      if (
        Array.isArray(
          first
        )
      ) {

        return first.join(
          ", "
        );

      }


      return (
        first
          ? String(
              first
            )
          : fallback
      );

    };


  const handleSubmit =
    async (
      event
    ) => {

      event.preventDefault();


      const name =
        formData.name
          .trim();


      if (
        !name
      ) {

        setError(
          "Department name is required."
        );

        return;

      }


      try {

        setSubmitting(
          true
        );

        setError("");
        setSuccess("");


        const payload = {
          name,

          description:
            formData.description
              .trim(),

          is_active:
            Boolean(
              formData.is_active
            ),
        };


        if (
          editingDepartment
        ) {

          await api.put(
            `/departments/${editingDepartment.id}/`,
            payload
          );


          setSuccess(
            "Department updated successfully."
          );

        } else {

          await api.post(
            "/departments/",
            payload
          );


          setSuccess(
            "Department created successfully."
          );

        }


        setShowModal(
          false
        );


        setEditingDepartment(
          null
        );


        setFormData({
          ...INITIAL_FORM,
        });


        await fetchDepartments();

      } catch (err) {

        console.error(
          "Department save error:",
          err
        );


        setError(
          formatBackendError(
            err,
            "Unable to save department."
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
      department
    ) => {

      try {

        setActionId(
          department.id
        );

        setError("");
        setSuccess("");


        await api.patch(
          `/departments/${department.id}/`,
          {
            is_active:
              !department.is_active,
          }
        );


        setDepartments(
          (
            previous
          ) =>
            previous.map(
              (
                item
              ) =>
                item.id ===
                department.id
                  ? {
                      ...item,

                      is_active:
                        !department.is_active,
                    }
                  : item
            )
        );


        setSuccess(
          department.is_active
            ? "Department deactivated successfully."
            : "Department activated successfully."
        );

      } catch (err) {

        console.error(
          "Department status update error:",
          err
        );


        setError(
          formatBackendError(
            err,
            "Unable to update department status."
          )
        );

      } finally {

        setActionId(
          null
        );

      }

    };


  const deleteDepartment =
    async (
      department
    ) => {

      const confirmed =
        window.confirm(
          `Delete ${department.name}?`
        );


      if (
        !confirmed
      ) {

        return;

      }


      try {

        setActionId(
          department.id
        );

        setError("");
        setSuccess("");


        await api.delete(
          `/departments/${department.id}/`
        );


        setDepartments(
          (
            previous
          ) =>
            previous.filter(
              (
                item
              ) =>
                item.id !==
                department.id
            )
        );


        setSuccess(
          "Department deleted successfully."
        );

      } catch (err) {

        console.error(
          "Department delete error:",
          err
        );


        setError(
          formatBackendError(
            err,
            "Unable to delete department."
          )
        );

      } finally {

        setActionId(
          null
        );

      }

    };


  return (

    <Layout>

      <div className="page-content admin-departments-page">


        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              ADMINISTRATION
            </p>


            <h1>
              Departments
            </h1>


            <p className="page-description">

              Manage hospital departments,
              doctor assignments and department
              account status.

            </p>

          </div>


          <div className="admin-departments-header-actions">

            <button
              type="button"
              className="btn-secondary"
              disabled={
                refreshing
              }
              onClick={
                () =>
                  fetchDepartments(
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
                openAddModal
              }
            >

              <Plus
                size={18}
              />

              Add Department

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


        <div className="admin-department-stats">


          <button
            type="button"
            className={
              statusFilter ===
              "ALL"
                ? "admin-department-stat active"
                : "admin-department-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "ALL"
                )
            }
          >

            <Building2
              size={19}
            />

            <div>

              <strong>
                {
                  stats.total
                }
              </strong>

              <span>
                Total Departments
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
              "ACTIVE"
                ? "admin-department-stat active"
                : "admin-department-stat"
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
                Active
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
              "INACTIVE"
                ? "admin-department-stat active"
                : "admin-department-stat"
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
                Inactive
              </span>

            </div>

          </button>


          <div className="admin-department-stat static">

            <Users
              size={19}
            />

            <div>

              <strong>
                {
                  stats.doctors
                }
              </strong>

              <span>
                Doctor Assignments
              </span>

            </div>

          </div>


        </div>


        <div className="card admin-departments-toolbar-card">

          <div className="admin-departments-toolbar">

            <div className="search-box">

              <Search
                size={19}
              />


              <input
                type="text"
                placeholder="Search department or description..."
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
              className="admin-departments-filter"
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
                All Departments
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>

            </select>

          </div>

        </div>


        {
          loading ? (

            <div className="card admin-department-loading">

              <Loader2
                size={20}
                className="spin"
              />

              Loading departments...

            </div>

          ) : filteredDepartments
            .length ===
            0 ? (

            <div className="card empty-state">

              <Building2
                size={32}
              />

              <h3>
                No departments found
              </h3>

              <p>

                Try changing the search or
                status filter.

              </p>

            </div>

          ) : (

            <div className="admin-department-grid">

              {
                filteredDepartments.map(
                  (
                    department
                  ) => (

                    <div
                      className="admin-department-card card"
                      key={
                        department.id
                      }
                    >

                      <div className="admin-department-card-top">

                        <div className="admin-department-icon">

                          <Building2
                            size={24}
                          />

                        </div>


                        <span
                          className={
                            department.is_active !==
                            false
                              ? "status-badge status-active"
                              : "status-badge status-inactive"
                          }
                        >

                          {
                            department.is_active !==
                            false
                              ? "Active"
                              : "Inactive"
                          }

                        </span>

                      </div>


                      <div className="admin-department-body">

                        <h3>

                          {
                            department.name
                          }

                        </h3>


                        <p>

                          {
                            department.description ||
                            "No description provided."
                          }

                        </p>

                      </div>


                      <div className="admin-department-info">

                        <span>
                          Doctors Assigned
                        </span>

                        <strong>

                          {
                            department.doctors_count ??
                            0
                          }

                        </strong>

                      </div>


                      <div className="admin-department-footer">

                        <div className="table-actions">


                          <button
                            type="button"
                            className="icon-btn"
                            title="Edit Department"
                            disabled={
                              actionId ===
                              department.id
                            }
                            onClick={
                              () =>
                                openEditModal(
                                  department
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
                              department.is_active !==
                              false
                                ? "icon-btn admin-department-power active"
                                : "icon-btn admin-department-power"
                            }
                            title={
                              department.is_active !==
                              false
                                ? "Deactivate Department"
                                : "Activate Department"
                            }
                            disabled={
                              actionId ===
                              department.id
                            }
                            onClick={
                              () =>
                                toggleStatus(
                                  department
                                )
                            }
                          >

                            {
                              actionId ===
                              department.id ? (

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


                          <button
                            type="button"
                            className="icon-btn danger-btn"
                            title="Delete Department"
                            disabled={
                              actionId ===
                              department.id
                            }
                            onClick={
                              () =>
                                deleteDepartment(
                                  department
                                )
                            }
                          >

                            <Trash2
                              size={17}
                            />

                          </button>


                        </div>

                      </div>

                    </div>

                  )
                )
              }

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
                className="modal admin-department-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-department-modal-title"
              >

                <div className="modal-header">

                  <div>

                    <p className="page-eyebrow">
                      ADMINISTRATION
                    </p>


                    <h2 id="admin-department-modal-title">

                      {
                        editingDepartment
                          ? "Edit Department"
                          : "Add Department"
                      }

                    </h2>


                    <p>

                      Manage hospital
                      department information.

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

                  <div className="form-group">

                    <label htmlFor="department-name">
                      Department Name
                    </label>


                    <input
                      id="department-name"
                      name="name"
                      value={
                        formData.name
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                  </div>


                  <div className="form-group admin-department-description-field">

                    <label htmlFor="department-description">
                      Description
                    </label>


                    <textarea
                      id="department-description"
                      name="description"
                      value={
                        formData.description
                      }
                      onChange={
                        handleChange
                      }
                      rows="5"
                    />

                  </div>


                  <label className="admin-department-active-control">

                    <input
                      type="checkbox"
                      name="is_active"
                      checked={
                        Boolean(
                          formData.is_active
                        )
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span>
                      Department is active
                    </span>

                  </label>


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
                          ? editingDepartment
                            ? "Updating..."
                            : "Creating..."
                          : editingDepartment
                            ? "Update Department"
                            : "Create Department"
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


export default Departments;
