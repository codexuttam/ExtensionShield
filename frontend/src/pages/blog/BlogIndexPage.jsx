import React from "react";
import { Link, useNavigate } from "react-router-dom";
import SEOHead from "../../components/SEOHead";
import { blogPosts } from "../../data/blogPosts";
import "../compare/ComparePage.scss";
import "./BlogPostPage.scss";

const BlogIndexPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Browser Extension Security Blog | Permissions, Risk & Governance"
        description="Browser extension security guides: dangerous permissions, risky Chrome extensions, data theft, extension risk scores, governance, and honest scanner comparisons."
        pathname="/blog"
        ogType="website"
      />

      <div className="blog-post-page">
        <div className="compare-container">
          <div className="compare-back-wrapper">
          <button type="button" className="compare-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          </div>

          <header className="compare-header">
            <h1>Browser Extension Security Blog</h1>
            <p>
              Practical guides for checking extension safety, understanding permissions, detecting risky behavior, and building browser extension governance programs.
            </p>
          </header>

          <ul className="blog-index-list">
            {blogPosts.map((post) => (
              <li key={post.slug}>
                <Link to={`/blog/${post.slug}`} className="blog-index-link">
                  <span className="blog-index-meta">{post.category} · {post.date}</span>
                  <strong>{post.title}</strong>
                  <span className="blog-index-desc">{post.description}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="compare-cta">
            <Link to="/scan">Scan an extension with ExtensionShield →</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogIndexPage;
