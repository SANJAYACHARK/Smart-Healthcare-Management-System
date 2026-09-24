import {
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";

import {
  useAuth,
} from "../../context/AuthContext";


function Settings() {

  const {
    user,
  } = useAuth();


  const [
    formData,
    setFormData,
  ] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });


  const [
    showCurrent,
    setShowCurrent,
  ] = useState(false);


  const [
    showNew,
    setShowNew,
  ] = useState(false);


  const [
    showConfirm,
    setShowConfirm,
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
          [name]: value,
        })
      );


      if (error) {

        setError("");

      }


      if (success) {

        setSuccess("");

      }

    };


  const getErrorMessage =
    (
      data
    ) => {

      if (!data) {

        return "Unable to change password.";

      }


      if (
        typeof data.detail ===
        "string"
      ) {

        return data.detail;

      }


      const fields = [
        "current_password",
        "new_password",
        "confirm_password",
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


      return "Unable to change password.";

    };


  const passwordChecks =
    useMemo(
      () => {

        const value =
          formData.new_password;


        return {
          length:
            value.length >= 8,

          uppercase:
            /[A-Z]/.test(value),

          lowercase:
            /[a-z]/.test(value),

          number:
            /\d/.test(value),

          match:
            Boolean(
              value &&
              formData.confirm_password &&
              value ===
              formData.confirm_password
            ),
        };

      },
      [
        formData.new_password,
        formData.confirm_password,
      ]
    );


  const validate =
    () => {

      if (
        !formData.current_password
      ) {

        setError(
          "Current password is required."
        );

        return false;

      }


      if (
        !formData.new_password
      ) {

        setError(
          "New password is required."
        );

        return false;

      }


      if (
        formData.new_password.length <
        8
      ) {

        setError(
          "New password must contain at least 8 characters."
        );

        return false;

      }


      if (
        formData.new_password !==
        formData.confirm_password
      ) {

        setError(
          "New password and confirmation do not match."
        );

        return false;

      }


      if (
        formData.current_password ===
        formData.new_password
      ) {

        setError(
          "New password must be different from the current password."
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


        await api.post(
          "/accounts/change-password/",
          {
            current_password:
              formData.current_password,

            new_password:
              formData.new_password,

            confirm_password:
              formData.confirm_password,
          }
        );


        setFormData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });


        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);


        setSuccess(
          "Password changed successfully."
        );

      } catch (err) {

        console.error(
          "Change password error:",
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


  return (

    <Layout>

      <div className="page-content shared-account-page">


        <div className="page-header">

          <p className="page-eyebrow">
            ACCOUNT
          </p>


          <h1>
            Settings
          </h1>


          <p className="page-description">

            Manage your account security
            and password.

          </p>

        </div>


        <div className="shared-settings-grid">


          <section className="card shared-settings-card">

            <div className="settings-card-heading">

              <div className="settings-icon">

                <LockKeyhole
                  size={21}
                />

              </div>


              <div>

                <h3>
                  Change Password
                </h3>


                <p>

                  Use a strong password
                  that you do not use
                  elsewhere.

                </p>

              </div>

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


            <form
              onSubmit={
                handleSubmit
              }
            >


              <div className="form-group">

                <label>
                  Current Password
                </label>


                <div className="password-wrapper">

                  <input
                    type={
                      showCurrent
                        ? "text"
                        : "password"
                    }
                    name="current_password"
                    value={
                      formData.current_password
                    }
                    onChange={
                      handleChange
                    }
                    autoComplete="current-password"
                    placeholder="Enter current password"
                    required
                  />


                  <button
                    type="button"
                    className="password-toggle"
                    onClick={
                      () =>
                        setShowCurrent(
                          (
                            previous
                          ) =>
                            !previous
                        )
                    }
                    aria-label={
                      showCurrent
                        ? "Hide current password"
                        : "Show current password"
                    }
                  >

                    {
                      showCurrent ? (

                        <EyeOff
                          size={18}
                        />

                      ) : (

                        <Eye
                          size={18}
                        />

                      )
                    }

                  </button>

                </div>

              </div>


              <div className="form-group shared-settings-field">

                <label>
                  New Password
                </label>


                <div className="password-wrapper">

                  <input
                    type={
                      showNew
                        ? "text"
                        : "password"
                    }
                    name="new_password"
                    value={
                      formData.new_password
                    }
                    onChange={
                      handleChange
                    }
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    minLength={8}
                    required
                  />


                  <button
                    type="button"
                    className="password-toggle"
                    onClick={
                      () =>
                        setShowNew(
                          (
                            previous
                          ) =>
                            !previous
                        )
                    }
                    aria-label={
                      showNew
                        ? "Hide new password"
                        : "Show new password"
                    }
                  >

                    {
                      showNew ? (

                        <EyeOff
                          size={18}
                        />

                      ) : (

                        <Eye
                          size={18}
                        />

                      )
                    }

                  </button>

                </div>

              </div>


              <div className="form-group shared-settings-field">

                <label>
                  Confirm New Password
                </label>


                <div className="password-wrapper">

                  <input
                    type={
                      showConfirm
                        ? "text"
                        : "password"
                    }
                    name="confirm_password"
                    value={
                      formData.confirm_password
                    }
                    onChange={
                      handleChange
                    }
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    minLength={8}
                    required
                  />


                  <button
                    type="button"
                    className="password-toggle"
                    onClick={
                      () =>
                        setShowConfirm(
                          (
                            previous
                          ) =>
                            !previous
                        )
                    }
                    aria-label={
                      showConfirm
                        ? "Hide password confirmation"
                        : "Show password confirmation"
                    }
                  >

                    {
                      showConfirm ? (

                        <EyeOff
                          size={18}
                        />

                      ) : (

                        <Eye
                          size={18}
                        />

                      )
                    }

                  </button>

                </div>

              </div>


              <button
                type="submit"
                className="btn-primary shared-settings-submit"
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

                    <ShieldCheck
                      size={17}
                    />

                  )
                }


                {
                  saving
                    ? "Updating..."
                    : "Update Password"
                }

              </button>

            </form>

          </section>


          <aside className="card shared-security-card">

            <div className="shared-security-icon">

              <KeyRound
                size={24}
              />

            </div>


            <h3>
              Password Security
            </h3>


            <p>

              Signed in as

              {" "}

              <strong>

                {
                  user?.username ||
                  "User"
                }

              </strong>

              .

            </p>


            <div className="shared-password-checks">

              <div
                className={
                  passwordChecks.length
                    ? "passed"
                    : ""
                }
              >

                <CheckCircle2
                  size={16}
                />

                At least 8 characters

              </div>


              <div
                className={
                  passwordChecks.uppercase
                    ? "passed"
                    : ""
                }
              >

                <CheckCircle2
                  size={16}
                />

                One uppercase letter

              </div>


              <div
                className={
                  passwordChecks.lowercase
                    ? "passed"
                    : ""
                }
              >

                <CheckCircle2
                  size={16}
                />

                One lowercase letter

              </div>


              <div
                className={
                  passwordChecks.number
                    ? "passed"
                    : ""
                }
              >

                <CheckCircle2
                  size={16}
                />

                One number

              </div>


              <div
                className={
                  passwordChecks.match
                    ? "passed"
                    : ""
                }
              >

                <CheckCircle2
                  size={16}
                />

                Passwords match

              </div>

            </div>

          </aside>


        </div>

      </div>

    </Layout>

  );

}


export default Settings;
