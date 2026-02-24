import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEOHead from "../../components/SEOHead";
import { careersRoles, getRoleById, CAREERS_APPLY_EMAIL } from "../../data/careersRoles";
import "./CareersApplyPage.scss";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const CareersApplyPage = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role");
  const selectedRole = roleParam ? getRoleById(roleParam) : null;
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: roleParam || "",
    linkedin: "",
    github: "",
    resumeLink: "",
    note: "",
  });
  const [submitState, setSubmitState] = useState("idle"); // idle | sending | success | error
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    if (roleParam && getRoleById(roleParam)) {
      setForm((f) => ({ ...f, role: roleParam }));
    }
  }, [roleParam]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildMailto = () => {
    const subject = form.role
      ? `Application: ${(getRoleById(form.role) || {}).title || form.role}`
      : "Application | ExtensionShield Careers";
    const body = [
      `Name: ${form.fullName}`,
      `Email: ${form.email}`,
      form.role ? `Role: ${(getRoleById(form.role) || {}).title || form.role}` : "",
      form.linkedin ? `LinkedIn: ${form.linkedin}` : "",
      form.github ? `GitHub: ${form.github}` : "",
      form.resumeLink ? `Resume: ${form.resumeLink}` : "",
      form.note ? `\nNote:\n${form.note}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return `mailto:${CAREERS_APPLY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitState("sending");
    setSubmitMessage("");

    const payload = {
      full_name: form.fullName.trim(),
      email: form.email.trim(),
      role_id: form.role || null,
      linkedin_url: form.linkedin.trim() || null,
      github_url: form.github.trim() || null,
      resume_link: form.resumeLink.trim() || null,
      note: form.note.trim() || null,
    };

    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/careers/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const detail = data.detail;
          const message =
            typeof detail === "string"
              ? detail
              : Array.isArray(detail) && detail[0]?.msg
                ? detail[0].msg
                : null;
          setSubmitState("error");
          setSubmitMessage(message || "Something went wrong. Please try again or use the mailto link below.");
          return;
        }
        setSubmitState("success");
        setSubmitMessage("Your application has been submitted. We'll be in touch.");
        setForm({ fullName: "", email: "", role: "", linkedin: "", github: "", resumeLink: "", note: "" });
        return;
      } catch (err) {
        setSubmitState("error");
        setSubmitMessage(err?.message || "Network error. You can send your application via email below.");
        return;
      }
    }

    // No API: open mailto
    window.location.href = buildMailto();
    setSubmitState("idle");
  };

  return (
    <>
      <SEOHead
        title="Apply | Careers | ExtensionShield"
        description="Apply to join ExtensionShield. Submit your application for open engineering and security roles."
        pathname="/careers/apply"
      />

      <div className="careers-apply-page">
        <div className="careers-apply-content">
          <header className="careers-apply-header">
            <Link to="/careers" className="careers-apply-back page-back">
              ← Careers
            </Link>
          </header>

          <div className="careers-apply-card">
          {selectedRole && (
            <div className="careers-apply-role-details">
              <h2 className="careers-apply-role-title">{selectedRole.title}</h2>
              <div className="careers-apply-role-meta">
                <span>{selectedRole.department}</span>
                <span>{selectedRole.location}</span>
                <span>{selectedRole.type}</span>
              </div>
              <p className="careers-apply-role-what">{selectedRole.whatYouWillWorkOn}</p>
              <div className="careers-apply-role-blocks">
                <div className="careers-apply-role-block">
                  <h4>Responsibilities</h4>
                  <ul>
                    {selectedRole.responsibilities.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="careers-apply-role-block">
                  <h4>Requirements</h4>
                  <ul>
                    {selectedRole.requirements.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="careers-apply-role-block">
                  <h4>Nice to have</h4>
                  <ul>
                    {selectedRole.niceToHaves.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form className="careers-apply-form" onSubmit={handleSubmit}>
            <div className="careers-form-row">
              <label htmlFor="careers-fullName">Full name</label>
              <input
                id="careers-fullName"
                name="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                className="careers-input"
              />
            </div>
            <div className="careers-form-row">
              <label htmlFor="careers-email">Email</label>
              <input
                id="careers-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="careers-input"
              />
            </div>
            <div className="careers-form-row">
              <label htmlFor="careers-role">Role</label>
              <select
                id="careers-role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="careers-input careers-select"
              >
                <option value="">Select a role</option>
                {careersRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="careers-form-row">
              <label htmlFor="careers-linkedin">LinkedIn</label>
              <input
                id="careers-linkedin"
                name="linkedin"
                type="url"
                value={form.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/yourprofile"
                className="careers-input"
              />
            </div>
            <div className="careers-form-row">
              <label htmlFor="careers-github">GitHub</label>
              <input
                id="careers-github"
                name="github"
                type="url"
                value={form.github}
                onChange={handleChange}
                placeholder="https://github.com/yourusername"
                className="careers-input"
              />
            </div>
            <div className="careers-form-row">
              <label htmlFor="careers-resumeLink">Resume link</label>
              <input
                id="careers-resumeLink"
                name="resumeLink"
                type="url"
                value={form.resumeLink}
                onChange={handleChange}
                placeholder="Link to your resume (Google Doc, PDF, etc.)"
                className="careers-input"
              />
            </div>
            <div className="careers-form-row">
              <label htmlFor="careers-note">Note (optional)</label>
              <textarea
                id="careers-note"
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Anything else you'd like us to know"
                rows={4}
                className="careers-input careers-textarea"
              />
            </div>

            {submitState === "success" && (
              <div className="careers-form-message success">{submitMessage}</div>
            )}
            {submitState === "error" && (
              <div className="careers-form-message error">{submitMessage}</div>
            )}

            <div className="careers-form-actions">
              <button
                type="submit"
                className="action-signin"
                disabled={submitState === "sending"}
              >
                {submitState === "sending" ? "Sending…" : "Submit application"}
              </button>
            </div>

            {!API_BASE_URL && (
              <p className="careers-form-fallback">
                Or send your application directly to{" "}
                <a href={buildMailto()} className="careers-link">
                  {CAREERS_APPLY_EMAIL}
                </a>
              </p>
            )}
          </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CareersApplyPage;
