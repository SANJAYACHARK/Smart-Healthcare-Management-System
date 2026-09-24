import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeIndianRupee,
  Building2,
  Edit,
  GraduationCap,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Search,
  Stethoscope,
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
  department: "",
  specialization: "",
  experience_years: "",
  qualification: "",
  consultation_fee: "",
};


function Doctors() {

  const [
    doctors,
    setDoctors,
  ] = useState([]);


  const [
    departments,
    setDepartments,
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
    editingDoctor,
    setEditingDoctor,
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


  const fetchDoctors =
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
            "/accounts/admin/doctors/"
          );


        setDoctors(
          getResults(
            response
          )
        );

      } catch (err) {

        console.error(
          "Admin doctors load error:",
          err
        );


        setDoctors([]);


        setError(
          err.response
            ?.data
            ?.detail ||
          "Failed to load doctors."
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


  const fetchDepartments =
    async () => {

      try {

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


        setDepartments([]);

      }

    };


  useEffect(() => {

    fetchDoctors();
    fetchDepartments();

  }, []);


  const filteredDoctors =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();


        return doctors.filter(
          (
            doctor
          ) => {

            const fullName =
              `${doctor.first_name || ""} ${
                doctor.last_name || ""
              }`
                .trim()
                .toLowerCase();


            const username =
              String(
                doctor.username ||
                ""
              ).toLowerCase();


            const email =
              String(
                doctor.email ||
                ""
              ).toLowerCase();


            const specialization =
              String(
                doctor.specialization ||
                ""
              ).toLowerCase();


            const department =
              String(
                doctor.department_name ||
                ""
              ).toLowerCase();


            const matchesSearch =
              !text ||
              fullName.includes(
                text
              ) ||
              username.includes(
                text
              ) ||
              email.includes(
                text
              ) ||
              specialization.includes(
                text
              ) ||
              department.includes(
                text
              );


            const matchesStatus =
              statusFilter ===
              "ALL" ||
              (
                statusFilter ===
                "ACTIVE" &&
                doctor.is_active
              ) ||
              (
                statusFilter ===
                "INACTIVE" &&
                !doctor.is_active
              );


            return (
              matchesSearch &&
              matchesStatus
            );

          }
        );

      },
      [
        doctors,
        search,
        statusFilter,
      ]
    );


  const stats =
    useMemo(
      () => {

        const active =
          doctors.filter(
            (
              doctor
            ) =>
              doctor.is_active
          ).length;


        const inactive =
          doctors.length -
          active;


        const departmentCount =
          new Set(
            doctors
              .map(
                (
                  doctor
                ) =>
                  doctor.department_name
              )
              .filter(Boolean)
          ).size;


        return {
          total:
            doctors.length,

          active,

          inactive,

          departmentCount,
        };

      },
      [
        doctors,
      ]
    );


  const doctorName =
    (
      doctor
    ) => {

      const fullName =
        `${doctor.first_name || ""} ${
          doctor.last_name || ""
        }`.trim();


      return (
        fullName ||
        doctor.username ||
        "Doctor"
      );

    };


  const formatCurrency =
    (
      amount
    ) => {

      const numeric =
        Number(
          amount
        );


      if (
        Number.isNaN(
          numeric
        )
      ) {

        return (
          amount ||
          "-"
        );

      }


      return new Intl.NumberFormat(
        "en-IN",
        {
          style:
            "currency",

          currency:
            "INR",

          maximumFractionDigits:
            numeric % 1 ===
            0
              ? 0
              : 2,
        }
      ).format(
        numeric
      );

    };


  const handleAddDoctor =
    () => {

      setEditingDoctor(
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


  const handleEditDoctor =
    (
      doctor
    ) => {

      setEditingDoctor(
        doctor
      );


      setFormData({
        username:
          doctor.username ||
          "",

        password:
          "",

        first_name:
          doctor.first_name ||
          "",

        last_name:
          doctor.last_name ||
          "",

        email:
          doctor.email ||
          "",

        phone:
          doctor.phone ||
          "",

        department:
          doctor.department
            ? String(
                doctor.department
              )
            : "",

        specialization:
          doctor.specialization ||
          "",

        experience_years:
          doctor.experience_years ??
          "",

        qualification:
          doctor.qualification ||
          "",

        consultation_fee:
          doctor.consultation_fee ??
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


      setEditingDoctor(
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
        typeof data.detail ===
        "string"
      ) {

        return data.detail;

      }


      if (
        typeof data ===
        "object"
      ) {

        const message =
          Object.entries(
            data
          )
            .map(
              (
                [
                  field,
                  value,
                ]
              ) =>
                `${field}: ${
                  Array.isArray(
                    value
                  )
                    ? value.join(
                        ", "
                      )
                    : value
                }`
            )
            .join(
              " | "
            );


        if (
          message
        ) {

          return message;

        }

      }


      return fallback;

    };


  const handleSubmit =
    async (
      event
    ) => {

      event.preventDefault();


      try {

        setSubmitting(
          true
        );

        setError("");
        setSuccess("");


        const departmentValue =
          formData.department
            ? Number(
                formData.department
              )
            : null;


        const experienceValue =
          Number(
            formData.experience_years
          );


        const feeValue =
          formData.consultation_fee
            ? Number(
                formData.consultation_fee
              )
            : 0;


        if (
          Number.isNaN(
            experienceValue
          ) ||
          experienceValue <
          0
        ) {

          setError(
            "Experience years must be a valid non-negative number."
          );

          return;

        }


        if (
          Number.isNaN(
            feeValue
          ) ||
          feeValue <
          0
        ) {

          setError(
            "Consultation fee must be a valid non-negative number."
          );

          return;

        }


        if (
          editingDoctor
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

            department:
              departmentValue,

            specialization:
              formData.specialization
                .trim(),

            experience_years:
              experienceValue,

            qualification:
              formData.qualification
                .trim(),

            consultation_fee:
              feeValue,
          };


          await api.put(
            `/accounts/admin/doctors/${editingDoctor.id}/`,
            updateData
          );


          setSuccess(
            "Doctor updated successfully."
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

            department:
              departmentValue,

            specialization:
              formData.specialization
                .trim(),

            experience_years:
              experienceValue,

            qualification:
              formData.qualification
                .trim(),

            consultation_fee:
              feeValue,
          };


          await api.post(
            "/accounts/admin/doctors/",
            createData
          );


          setSuccess(
            "Doctor created successfully."
          );

        }


        setShowModal(
          false
        );


        setEditingDoctor(
          null
        );


        setFormData({
          ...INITIAL_FORM,
        });


        await fetchDoctors();

      } catch (err) {

        console.error(
          "Doctor save error:",
          err
        );


        setError(
          formatBackendError(
            err,
            "Unable to save doctor."
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
      doctor
    ) => {

      try {

        setTogglingId(
          doctor.id
        );

        setError("");
        setSuccess("");


        const nextStatus =
          !doctor.is_active;


        await api.patch(
          `/accounts/admin/doctors/${doctor.id}/`,
          {
            is_active:
              nextStatus,
          }
        );


        setDoctors(
          (
            previous
          ) =>
            previous.map(
              (
                item
              ) =>
                item.id ===
                doctor.id
                  ? {
                      ...item,

                      is_active:
                        nextStatus,
                    }
                  : item
            )
        );


        setSuccess(
          nextStatus
            ? "Doctor activated successfully."
            : "Doctor deactivated successfully."
        );

      } catch (err) {

        console.error(
          "Doctor status update error:",
          err
        );


        setError(
          formatBackendError(
            err,
            "Unable to update doctor status."
          )
        );

      } finally {

        setTogglingId(
          null
        );

      }

    };


  return (

    <Layout>

      <div className="page-content admin-doctors-page">


        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              ADMINISTRATION
            </p>


            <h1>
              Manage Doctors
            </h1>


            <p className="page-description">

              Add, update, activate and
              manage doctor accounts.

            </p>

          </div>


          <div className="admin-doctors-header-actions">

            <button
              type="button"
              className="btn-secondary"
              disabled={
                refreshing
              }
              onClick={
                () =>
                  fetchDoctors(
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
                handleAddDoctor
              }
            >

              <Plus
                size={18}
              />

              Add Doctor

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


        <div className="admin-doctor-stats">


          <button
            type="button"
            className={
              statusFilter ===
              "ALL"
                ? "admin-doctor-stat active"
                : "admin-doctor-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "ALL"
                )
            }
          >

            <Stethoscope
              size={19}
            />

            <div>

              <strong>
                {
                  stats.total
                }
              </strong>

              <span>
                Total Doctors
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
              "ACTIVE"
                ? "admin-doctor-stat active"
                : "admin-doctor-stat"
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
                Active Doctors
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
              "INACTIVE"
                ? "admin-doctor-stat active"
                : "admin-doctor-stat"
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
                Inactive Doctors
              </span>

            </div>

          </button>


          <div className="admin-doctor-stat static">

            <Building2
              size={19}
            />

            <div>

              <strong>
                {
                  stats.departmentCount
                }
              </strong>

              <span>
                Departments
              </span>

            </div>

          </div>


        </div>


        <div className="card admin-doctors-card">


          <div className="admin-doctors-toolbar">

            <div className="search-box">

              <Search
                size={19}
              />


              <input
                type="text"
                placeholder="Search doctor, email, specialization or department..."
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
              className="admin-doctors-filter"
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
                All Doctors
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
                    Doctor
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Specialization
                  </th>

                  <th>
                    Experience
                  </th>

                  <th>
                    Fee
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
                        colSpan="7"
                        className="admin-doctor-empty-cell"
                      >

                        <Loader2
                          size={18}
                          className="spin"
                        />

                        Loading doctors...

                      </td>

                    </tr>

                  ) : filteredDoctors
                    .length ===
                    0 ? (

                    <tr>

                      <td
                        colSpan="7"
                        className="admin-doctor-empty-cell"
                      >

                        No doctors found.

                      </td>

                    </tr>

                  ) : (

                    filteredDoctors.map(
                      (
                        doctor
                      ) => (

                        <tr
                          key={
                            doctor.id
                          }
                        >

                          <td>

                            <div className="table-user">

                              <div className="table-avatar">

                                <Stethoscope
                                  size={18}
                                />

                              </div>


                              <div>

                                <strong>

                                  Dr. {
                                    doctorName(
                                      doctor
                                    )
                                  }

                                </strong>


                                <span>

                                  {
                                    doctor.email ||
                                    "-"
                                  }

                                </span>

                              </div>

                            </div>

                          </td>


                          <td>

                            <div className="status-label">

                              <Building2
                                size={14}
                              />

                              {
                                doctor.department_name ||
                                "Not Assigned"
                              }

                            </div>

                          </td>


                          <td>

                            <strong>

                              {
                                doctor.specialization ||
                                "-"
                              }

                            </strong>

                          </td>


                          <td>

                            {
                              doctor.experience_years ??
                              0
                            } Years

                          </td>


                          <td>

                            <span className="admin-doctor-fee">

                              <BadgeIndianRupee
                                size={14}
                              />

                              {
                                formatCurrency(
                                  doctor.consultation_fee
                                )
                              }

                            </span>

                          </td>


                          <td>

                            <span
                              className={
                                doctor.is_active
                                  ? "status-badge status-active"
                                  : "status-badge status-inactive"
                              }
                            >

                              {
                                doctor.is_active
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
                                title="Edit Doctor"
                                disabled={
                                  togglingId ===
                                  doctor.id
                                }
                                onClick={
                                  () =>
                                    handleEditDoctor(
                                      doctor
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
                                  doctor.is_active
                                    ? "icon-btn admin-doctor-power active"
                                    : "icon-btn admin-doctor-power"
                                }
                                title={
                                  doctor.is_active
                                    ? "Deactivate Doctor"
                                    : "Activate Doctor"
                                }
                                disabled={
                                  togglingId ===
                                  doctor.id
                                }
                                onClick={
                                  () =>
                                    toggleStatus(
                                      doctor
                                    )
                                }
                              >

                                {
                                  togglingId ===
                                  doctor.id ? (

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
                className="modal admin-doctor-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-doctor-modal-title"
              >

                <div className="modal-header">

                  <div>

                    <p className="page-eyebrow">
                      ADMINISTRATION
                    </p>


                    <h2 id="admin-doctor-modal-title">

                      {
                        editingDoctor
                          ? "Edit Doctor"
                          : "Add Doctor"
                      }

                    </h2>


                    <p>

                      {
                        editingDoctor
                          ? "Update doctor account and professional details."
                          : "Create a doctor account and assign professional details."
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
                      !editingDoctor && (

                        <>

                          <div className="form-group">

                            <label htmlFor="doctor-username">
                              Username
                            </label>


                            <input
                              id="doctor-username"
                              name="username"
                              value={
                                formData.username
                              }
                              onChange={
                                handleChange
                              }
                              required
                            />

                          </div>


                          <div className="form-group">

                            <label htmlFor="doctor-password">
                              Password
                            </label>


                            <input
                              id="doctor-password"
                              name="password"
                              type="password"
                              minLength="6"
                              value={
                                formData.password
                              }
                              onChange={
                                handleChange
                              }
                              required
                            />

                          </div>

                        </>

                      )
                    }


                    <div className="form-group">

                      <label htmlFor="doctor-first-name">
                        First Name
                      </label>


                      <input
                        id="doctor-first-name"
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

                      <label htmlFor="doctor-last-name">
                        Last Name
                      </label>


                      <input
                        id="doctor-last-name"
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

                      <label htmlFor="doctor-email">
                        Email
                      </label>


                      <input
                        id="doctor-email"
                        name="email"
                        type="email"
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

                      <label htmlFor="doctor-phone">
                        Phone
                      </label>


                      <input
                        id="doctor-phone"
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

                      <label htmlFor="doctor-department">
                        Department
                      </label>


                      <select
                        id="doctor-department"
                        name="department"
                        value={
                          formData.department
                        }
                        onChange={
                          handleChange
                        }
                      >

                        <option value="">
                          Not Assigned
                        </option>


                        {
                          departments.map(
                            (
                              department
                            ) => (

                              <option
                                key={
                                  department.id
                                }
                                value={
                                  department.id
                                }
                              >

                                {
                                  department.name
                                }

                              </option>

                            )
                          )
                        }

                      </select>

                    </div>


                    <div className="form-group">

                      <label htmlFor="doctor-specialization">
                        Specialization
                      </label>


                      <input
                        id="doctor-specialization"
                        name="specialization"
                        value={
                          formData.specialization
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />

                    </div>


                    <div className="form-group">

                      <label htmlFor="doctor-experience">
                        Experience Years
                      </label>


                      <input
                        id="doctor-experience"
                        name="experience_years"
                        type="number"
                        min="0"
                        value={
                          formData.experience_years
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />

                    </div>


                    <div className="form-group">

                      <label htmlFor="doctor-qualification">
                        Qualification
                      </label>


                      <input
                        id="doctor-qualification"
                        name="qualification"
                        value={
                          formData.qualification
                        }
                        onChange={
                          handleChange
                        }
                      />

                    </div>


                    <div className="form-group">

                      <label htmlFor="doctor-fee">
                        Consultation Fee
                      </label>


                      <input
                        id="doctor-fee"
                        name="consultation_fee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          formData.consultation_fee
                        }
                        onChange={
                          handleChange
                        }
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
                        submitting && (

                          <Loader2
                            size={16}
                            className="spin"
                          />

                        )
                      }

                      {
                        submitting
                          ? editingDoctor
                            ? "Updating..."
                            : "Creating..."
                          : editingDoctor
                            ? "Update Doctor"
                            : "Create Doctor"
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


export default Doctors;
