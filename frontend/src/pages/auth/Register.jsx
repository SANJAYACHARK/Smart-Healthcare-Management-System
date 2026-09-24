import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  UserPlus,
  Loader2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";


function Register() {

  const navigate = useNavigate();

  const { register } = useAuth();


  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirm: "",
  });


  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");
    setSuccess("");


    if (
      form.password !==
      form.password_confirm
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }


    try {

      setLoading(true);

      await register(form);

      setSuccess(
        "Patient account created successfully. Redirecting to login..."
      );


      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {

      const data =
        error.response?.data;

      if (data) {

        const firstError =
          Object.values(data)
            .flat()
            .join(" ");

        setError(firstError);

      } else {

        setError(
          "Unable to create account."
        );

      }

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="auth-page">

      <div className="auth-brand-panel">

        <div className="auth-brand">

          <div className="auth-logo">
            <UserPlus size={28} />
          </div>

          <h1>SmartCare</h1>

        </div>


        <div className="auth-brand-content">

          <h2>
            Start Your
            <br />
            Health Journey.
          </h2>

          <p>
            Create your SmartCare patient
            account and manage appointments,
            prescriptions, reports and
            medical records in one place.
          </p>

        </div>

      </div>


      <div className="auth-form-panel">

        <div className="auth-form-container">

          <div className="auth-heading">

            <h1>
              Create Patient Account
            </h1>

            <p>
              Register to access SmartCare.
            </p>

          </div>


          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}


          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}


          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >

            <div className="form-row">

              <div className="form-group">

                <label>
                  First Name
                </label>

                <input
                  className="form-control"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Last Name
                </label>

                <input
                  className="form-control"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>


            <div className="form-group">

              <label>
                Username
              </label>

              <input
                className="form-control"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
              />

            </div>


            <div className="form-group">

              <label>
                Email
              </label>

              <input
                className="form-control"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />

            </div>


            <div className="form-group">

              <label>
                Phone
              </label>

              <input
                className="form-control"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
              />

            </div>


            <div className="form-row">

              <div className="form-group">

                <label>
                  Password
                </label>

                <input
                  className="form-control"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  minLength={8}
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Confirm Password
                </label>

                <input
                  className="form-control"
                  type="password"
                  name="password_confirm"
                  value={
                    form.password_confirm
                  }
                  onChange={handleChange}
                  minLength={8}
                  required
                />

              </div>

            </div>


            <button
              className="btn-primary auth-submit"
              type="submit"
              disabled={loading}
            >

              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="spin"
                  />

                  Creating Account...
                </>
              ) : (
                "Create Patient Account"
              )}

            </button>

          </form>


          <div className="auth-register">

            <span>
              Already have an account?
            </span>

            <Link to="/login">
              Sign In
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;