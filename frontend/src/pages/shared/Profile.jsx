import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";

import {
  useAuth,
} from "../../context/AuthContext";


const ROLE_LABELS = {
  ADMIN: "Administrator",
  DOCTOR: "Doctor",
  RECEPTIONIST: "Receptionist",
  PATIENT: "Patient",
};


function Profile() {

  const {
    user,
    refreshUser,
  } = useAuth();


  const [
    formData,
    setFormData,
  ] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const loadProfile =
    async (
      showRefresh = false
    ) => {

      try {

        if (showRefresh) {

          setRefreshing(true);

        } else {

          setLoading(true);

        }


        setError("");


        const response =
          await api.get(
            "/accounts/profile/"
          );


        const profile =
          response.data || {};


        setFormData({
          first_name:
            profile.first_name || "",

          last_name:
            profile.last_name || "",

          email:
            profile.email || "",

          phone:
            profile.phone || "",
        });

      } catch (err) {

        console.error(
          "Profile load error:",
          err
        );


        const status =
          err.response?.status;


        if (
          status === 403
        ) {

          setError(
            "You do not have permission to access this profile."
          );

        } else if (
          status === 404
        ) {

          setError(
            "Profile endpoint was not found."
          );

        } else {

          setError(
            err.response
              ?.data
              ?.detail ||
            "Unable to load profile."
          );

        }

      } finally {

        setLoading(false);
        setRefreshing(false);

      }

    };


  useEffect(() => {

    loadProfile();

  }, []);


  const handleChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;


      setFormData(
        (
          previous
        ) => ({
          ...previous,
          [name]: value,
        })
      );


      if (success) {

        setSuccess("");

      }

    };


  const getErrorMessage =
    (
      data
    ) => {

      if (!data) {

        return "Unable to update profile.";

      }


      if (
        typeof data.detail ===
        "string"
      ) {

        return data.detail;

      }


      const fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "non_field_errors",
      ];


      for (
        const field
        of fields
      ) {

        const value =
          data[field];


        if (
          Array.isArray(value) &&
          value.length
        ) {

          return value.join(" ");

        }


        if (
          typeof value ===
          "string"
        ) {

          return value;

        }

      }


      return "Unable to update profile.";

    };


  const validate =
    () => {

      const email =
        formData.email.trim();


      if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email
        )
      ) {

        setError(
          "Please enter a valid email address."
        );

        return false;

      }


      const phone =
        formData.phone.trim();


      if (
        phone &&
        !/^[0-9+\-\s()]{7,20}$/.test(
          phone
        )
      ) {

        setError(
          "Please enter a valid phone number."
        );

        return false;

      }


      return true;

    };


  const handleSubmit =
    async (
      event
    ) => {

      event.preventDefault();


      setError("");
      setSuccess("");


      if (!validate()) {

        return;

      }


      try {

        setSaving(true);


        const response =
          await api.patch(
            "/accounts/profile/",
            {
              first_name:
                formData.first_name.trim(),

              last_name:
                formData.last_name.trim(),

              email:
                formData.email.trim(),

              phone:
                formData.phone.trim(),
            }
          );


        const updatedProfile =
          response.data || {};


        let updatedUser =
          null;


        if (
          typeof refreshUser ===
          "function"
        ) {

          updatedUser =
            await refreshUser();

        }


        setFormData({
          first_name:
            updatedUser
              ?.first_name ??
            updatedProfile
              .first_name ??
            formData.first_name,

          last_name:
            updatedUser
              ?.last_name ??
            updatedProfile
              .last_name ??
            formData.last_name,

          email:
            updatedUser
              ?.email ??
            updatedProfile
              .email ??
            formData.email,

          phone:
            updatedUser
              ?.phone ??
            updatedProfile
              .phone ??
            formData.phone,
        });


        setSuccess(
          "Profile updated successfully."
        );

      } catch (err) {

        console.error(
          "Profile update error:",
          err
        );


        setError(
          getErrorMessage(
            err.response?.data
          )
        );

      } finally {

        setSaving(false);

      }

    };


  const roleLabel =
    ROLE_LABELS[
      user?.role
    ] || "User";


  const displayName =
    useMemo(
      () => {

        const name =
          `${formData.first_name} ${formData.last_name}`
            .trim();


        return (
          name ||
          user?.username ||
          "User"
        );

      },
      [
        formData.first_name,
        formData.last_name,
        user?.username,
      ]
    );


  const initials =
    useMemo(
      () => {

        const parts =
          displayName
            .split(" ")
            .filter(Boolean);


        if (
          parts.length === 0
        ) {

          return "U";

        }


        return parts
          .slice(0, 2)
          .map(
            (
              part
            ) =>
              part[0]
                ?.toUpperCase()
          )
          .join("");

      },
      [
        displayName,
      ]
    );


  if (loading) {

    return (

      <Layout>

        <div className="loading-screen">

          <Loader2
            size={24}
            className="spin"
          />

          Loading profile...

        </div>

      </Layout>

    );

  }


  return (

    <Layout>

      <div className="page-content shared-account-page">


        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              ACCOUNT
            </p>


            <h1>
              My Profile
            </h1>


            <p className="page-description">

              View and update your personal
              information.

            </p>

          </div>


          <button
            type="button"
            className="btn-secondary"
            disabled={
              refreshing ||
              saving
            }
            onClick={
              () =>
                loadProfile(
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


        <div className="shared-profile-grid">


          <section className="card shared-profile-summary">

            <div className="shared-profile-avatar">

              {
                initials
              }

            </div>


            <h2>
              {
                displayName
              }
            </h2>


            <p className="shared-profile-username">

              @
              {
                user?.username ||
                "user"
              }

            </p>


            <span className="status-badge status-completed">

              {
                roleLabel
              }

            </span>


            <div className="shared-profile-meta">


              <div>

                <ShieldCheck
                  size={17}
                />


                <span>
                  Username
                </span>


                <strong>

                  {
                    user?.username ||
                    "-"
                  }

                </strong>

              </div>


              <div>

                <Mail
                  size={17}
                />


                <span>
                  Email
                </span>


                <strong>

                  {
                    formData.email ||
                    "-"
                  }

                </strong>

              </div>


              <div>

                <Phone
                  size={17}
                />


                <span>
                  Phone
                </span>


                <strong>

                  {
                    formData.phone ||
                    "-"
                  }

                </strong>

              </div>


            </div>

          </section>


          <section className="card shared-profile-edit">

            <div className="card-header">

              <div>

                <h3>

                  <UserRound
                    size={18}
                  />

                  Personal Information

                </h3>


                <p>

                  Update the contact details
                  linked with your SmartCare
                  account.

                </p>

              </div>

            </div>


            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-grid">


                <div className="form-group">

                  <label>
                    First Name
                  </label>


                  <input
                    type="text"
                    name="first_name"
                    value={
                      formData.first_name
                    }
                    onChange={
                      handleChange
                    }
                    autoComplete="given-name"
                    placeholder="Enter first name"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Last Name
                  </label>


                  <input
                    type="text"
                    name="last_name"
                    value={
                      formData.last_name
                    }
                    onChange={
                      handleChange
                    }
                    autoComplete="family-name"
                    placeholder="Enter last name"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Email
                  </label>


                  <input
                    type="email"
                    name="email"
                    value={
                      formData.email
                    }
                    onChange={
                      handleChange
                    }
                    autoComplete="email"
                    placeholder="Enter email address"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Phone
                  </label>


                  <input
                    type="tel"
                    name="phone"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleChange
                    }
                    autoComplete="tel"
                    placeholder="Enter phone number"
                  />

                </div>


              </div>


              <div className="shared-form-actions">

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    saving
                  }
                >

                  {
                    saving ? (

                      <Loader2
                        size={17}
                        className="spin"
                      />

                    ) : (

                      <Save
                        size={17}
                      />

                    )
                  }


                  {
                    saving
                      ? "Saving..."
                      : "Save Changes"
                  }

                </button>

              </div>

            </form>

          </section>


        </div>

      </div>

    </Layout>

  );

}


export default Profile;
