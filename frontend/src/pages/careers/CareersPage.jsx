import React from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../../components/SEOHead";
import { careersRoles } from "../../data/careersRoles";
import "./CareersPage.scss";

const CareersPage = () => {
  const navigate = useNavigate();

  const applyForRole = (roleId) => {
    navigate(`/careers/apply${roleId ? `?role=${encodeURIComponent(roleId)}` : ""}`);
  };

  return (
    <>
      <SEOHead
        title="Careers | ExtensionShield"
        description="Join ExtensionShield. We're building the security, privacy, and governance layer for browser extensions. View open roles and apply."
        pathname="/careers"
      />

      <div className="careers-page">
        <div className="careers-content">
          <header className="careers-hero">
            <h1 className="careers-hero-title">Open roles</h1>
          </header>

          <section id="open-roles" className="careers-section careers-roles-list">
            <div className="careers-cards">
              {careersRoles.map((role) => (
                <article key={role.id} className="careers-role-card">
                  <div className="careers-role-card-header">
                    <h3>{role.title}</h3>
                    <div className="careers-role-meta">
                      <span>{role.department}</span>
                      <span>{role.location}</span>
                      <span>{role.type}</span>
                    </div>
                  </div>
                  <p className="careers-role-summary">{role.summary}</p>
                  <div className="careers-role-card-actions">
                    <button
                      type="button"
                      className="action-signin careers-btn-sm"
                      onClick={() => applyForRole(role.id)}
                    >
                      Apply
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default CareersPage;
