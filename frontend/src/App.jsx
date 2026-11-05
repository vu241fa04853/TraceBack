
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const BACKEND_URL = "https://traceback-backend-hdfz.onrender.com";

const API = `${BACKEND_URL}/api/items/`;

const ADMIN_URL = `${BACKEND_URL}/admin/`;

const initialForm = {
  name: "",
  category: "Electronics",
  location: "",
  pickup_location: "",
  description: "",
  status: "Lost",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  image: null,
};

function App() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
   const [selectedItem, setSelectedItem] = useState(null);

  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");

  const [handoverForm, setHandoverForm] = useState({
    collector_name: "",
    collector_phone: "",
    collector_college_id: "",
    verification_notes: "",
  });

  const [handoverError, setHandoverError] = useState("");
  const [handoverLoading, setHandoverLoading] = useState(false);


  async function loadItems() {
    try {
      const response = await fetch(API);

      if (!response.ok) {
        throw new Error("Unable to load items");
      }

      const data = await response.json();
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function handleChange(e) {
    const { name, value, files } = e.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: name === "image" ? files[0] || null : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      const response = await fetch(API, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(errorData);
        throw new Error("Submission failed");
      }

      setMessage("Your report has been submitted successfully!");
      setForm({ ...initialForm });
      e.target.reset();

      await loadItems();
    } catch (error) {
      console.error(error);
      setMessage(
        "Could not submit. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function markReturned(id) {
    const confirmReturn = window.confirm(
      "Has the owner collected this item? Confirm to remove it from active listings."
    );

    if (!confirmReturn) return;

    try {
      const response = await fetch(`${API}${id}/mark_returned/`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      setMessage("Item marked as returned successfully!");
      await loadItems();
    } catch (error) {
      console.error(error);
      setMessage("Unable to update item. Please try again.");
    }
  }

  const activeItems = items.filter(
    (item) => item.status !== "Returned"
  );

  const filteredItems = useMemo(() => {
    return activeItems.filter((item) => {
      const text = [
        item.name,
        item.category,
        item.location,
        item.pickup_location,
        item.description,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" || item.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  const foundCount = activeItems.filter(
    (item) => item.status === "Found"
  ).length;

  const lostCount = activeItems.filter(
    (item) => item.status === "Lost"
  ).length;
  function openHandover(item) {
  setSelectedItem(item);

  setStaffUsername("");
  setStaffPassword("");

  setHandoverForm({
    collector_name: "",
    collector_phone: "",
    collector_college_id: "",
    verification_notes: "",
  });

  setHandoverError("");
}

function closeHandover() {
  setSelectedItem(null);
  setHandoverError("");
}

async function submitHandover(e) {
  e.preventDefault();

  if (!selectedItem) return;
  // Frontend validation

if (!staffUsername.trim() || !staffPassword) {
  setHandoverError("Staff username and password are required.");
  return;
}

if (handoverForm.collector_name.trim().length < 3) {
  setHandoverError("Enter a valid collector name.");
  return;
}

const phone = handoverForm.collector_phone
  .replace(/[\s-]/g, "")
  .replace(/^\+91/, "");

if (!/^[6-9]\d{9}$/.test(phone)) {
  setHandoverError("Enter a valid 10-digit Indian mobile number.");
  return;
}

if (handoverForm.collector_college_id.trim().length < 3) {
  setHandoverError("Enter a valid college ID.");
  return;
}

if (handoverForm.verification_notes.trim().length < 10) {
  setHandoverError("Please explain how ownership was verified.");
  return;
}

  setHandoverLoading(true);
  setHandoverError("");

  try {
    const credentials = btoa(
      `${staffUsername}:${staffPassword}`
    );

    const response = await fetch(
      `${API}${selectedItem.id}/handover/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${credentials}`,
        },
        body: JSON.stringify(handoverForm),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.error ||
        "Verification failed. Check staff login and details."
      );
    }

    setMessage("Handover recorded successfully. Item collected!");

    closeHandover();

    await loadItems();

  } catch (error) {
    setHandoverError(error.message);
  } finally {
    setHandoverLoading(false);
  }
}

  return (
    <div className="app">
      <nav className="navbar">
        <a
  href={ADMIN_URL}
  target="_blank"
  rel="noopener noreferrer"
  className="staff-admin-link"
>
  Staff Login / Handover Records
</a>
        <a href="#home" className="brand">
          <span className="brand-icon">T</span>
          TraceBack<span className="brand-dot">.</span>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#browse">Browse Items</a>
          <a href="#report" className="nav-button">
            Report an Item <span>↗</span>
          </a>
        </div>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="live-dot"></span>
              SMART CAMPUS LOST & FOUND
            </div>

            <h1>
              Lost something?
              <br />
              <span>Find your way back.</span>
            </h1>

            <p className="hero-description">
              A smarter way to report lost belongings, discover
              found items and reconnect people with what matters.
            </p>

            <div className="hero-actions">
              <a href="#report" className="primary-button">
                Report an item <span>→</span>
              </a>
              <a href="#browse" className="secondary-button">
                Explore items
              </a>
            </div>

            <div className="hero-note">
              <span>✓</span> Built for a safer, more connected campus
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-circle circle-one"></div>
            <div className="visual-circle circle-two"></div>

            <div className="visual-card">
              <div className="visual-top">
                <span className="visual-icon">⌕</span>
                <span className="visual-status">CAMPUS CONNECTED</span>
              </div>

              <div className="visual-search">
                <span>⌕</span>
                Find what you lost...
              </div>

              <div className="visual-item">
                <div className="visual-item-icon">🎒</div>
                <div>
                  <strong>Every item matters.</strong>
                  <p>One community. One solution.</p>
                </div>
              </div>

              <div className="visual-bottom">
                <span>TRACEBACK</span>
                <span>01 / RECOVER</span>
              </div>
            </div>

            <div className="floating-tag">
              <span>✦</span> Reconnect. Recover. Return.
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="stats-heading">
            <span>THE COMMUNITY AT A GLANCE</span>
            <p>Every report brings us closer.</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">▤</span>
              <div>
                <h2>{activeItems.length}</h2>
                <p>Active reports</p>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon green">✓</span>
              <div>
                <h2>{foundCount}</h2>
                <p>Found items</p>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon orange">⌕</span>
              <div>
                <h2>{lostCount}</h2>
                <p>Lost items</p>
              </div>
            </div>
          </div>
        </section>

        <section className="report-section" id="report">
          <div className="section-intro">
            <span className="section-label">
              CONTRIBUTE TO THE COMMUNITY
            </span>
            <h2>Make a report.</h2>
            <p>
              Lost something or found something? Share the details
              and help make a connection.
            </p>
          </div>

          <div className="form-card">
            <div className="form-heading">
              <div>
                <span className="form-step">NEW REPORT / 01</span>
                <h3>Item information</h3>
              </div>
              <span className="form-symbol">＋</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  Item name *
                  <input
                    name="name"
                    required
                    placeholder="e.g. Black wallet"
                    value={form.name}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Category
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    <option>Electronics</option>
                    <option>Books</option>
                    <option>ID Cards</option>
                    <option>Accessories</option>
                    <option>Others</option>
                  </select>
                </label>

                <label>
                  Campus location *
                  <input
                    name="location"
                    required
                    placeholder="Where was it lost or found?"
                    value={form.location}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Report type
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="Lost">I lost this item</option>
                    <option value="Found">I found this item</option>
                  </select>
                </label>

                <label className="full-width">
                  Exact pickup location *
                  <input
                    name="pickup_location"
                    required
                    placeholder="e.g. Library reception, Block A"
                    value={form.pickup_location}
                    onChange={handleChange}
                  />
                </label>

                <label className="full-width">
                  Description *
                  <textarea
                    name="description"
                    required
                    rows="4"
                    placeholder="Colour, brand or identifying features..."
                    value={form.description}
                    onChange={handleChange}
                  />
                </label>

                
<label className="full-width">
  Upload Item Photo

  <div className="photo-upload-options">
    <label className="camera-option">
      <span>📷</span>
      Take Photo
      <input
        type="file"
        name="image"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
      />
    </label>

    <label className="gallery-option">
      <span>🖼️</span>
      Choose from Gallery
      <input
        type="file"
        name="image"
        accept="image/*"
        onChange={handleChange}
      />
    </label>
  </div>

  {form.image && (
    <p className="selected-photo">
      Selected: {form.image.name}
    </p>
  )}
</label>


                <label>
                  Contact person's name *
                  <input
                    name="contact_name"
                    required
                    placeholder="Your name"
                    value={form.contact_name}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Contact phone number *
                  <input
                    name="contact_phone"
                    type="tel"
                    required
                    maxLength="20"
                    placeholder="Your phone number"
                    value={form.contact_phone}
                    onChange={handleChange}
                  />
                </label>

                <label className="full-width">
                  Contact email
                  <input
                    name="contact_email"
                    type="email"
                    placeholder="Your email address (optional)"
                    value={form.contact_email}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <div className="form-footer">
                <p>* Required fields</p>
                <button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit report →"}
                </button>
              </div>

              {message && (
                <p className="form-message" role="status">
                  {message}
                </p>
              )}
            </form>
          </div>
        </section>

        <section className="browse-section" id="browse">
          <div className="browse-heading">
            <div>
              <span className="section-label">CAMPUS DISCOVERY</span>
              <h2>Explore reported items.</h2>
              <p>
                Search through active reports from your community.
              </p>
            </div>

            <span className="result-count">
              {filteredItems.length} RESULTS
            </span>
          </div>

          <div className="search-toolbar">
            <div className="search-box">
              <span>⌕</span>
              <input
                placeholder="Search by name, category or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All reports</option>
              <option value="Lost">Lost items</option>
              <option value="Found">Found items</option>
            </select>
          </div>

          <div className="items-grid">
            {filteredItems.map((item) => (
              <article className="item-card" key={item.id}>
                {item.image && (
                  <img
                    src={
                      item.image.startsWith("http")
                        ? item.image
                        : `${BACKEND_URL}${item.image}`
                    }
                    alt={item.name}
                    className="item-photo"
                  />
                )}

                <div className="item-card-top">
                  <span
                    className={`status-badge ${
                      item.status === "Lost" ? "lost" : "found"
                    }`}
                  >
                    {item.status}
                  </span>

                  <span className="item-category">
                    {item.category}
                  </span>
                </div>

                <h3>{item.name}</h3>

                <p className="item-description">
                  {item.description}
                </p>

                <div className="item-location">
                  <span>⌖</span> Reported location: {item.location}
                </div>

                <div className="item-location">
                  <span>📍</span> Pickup location:{" "}
                  {item.pickup_location || "Not provided"}
                </div>

                <div className="item-contact">
                  <p>
                    <strong>Contact:</strong>{" "}
                    {item.contact_name || "Not provided"}
                  </p>

                  {item.contact_phone && (
                    <p>
                      <strong>Phone:</strong> {item.contact_phone}
                    </p>
                  )}

                  {item.contact_email && (
                    <p>
                      <strong>Email:</strong> {item.contact_email}
                    </p>
                  )}
                </div>

                {item.contact_phone && (
                  <a
                    className="primary-button"
                    href={`tel:${item.contact_phone}`}
                  >
                    Call contact →
                  </a>
                )}

                {item.status === "Found" && (
                  <button
                    type="button"
                    onClick={() => openHandover(item)}
                  >
                    Owner collected – Mark as Returned
                  </button>
                )}
              </article>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">⌕</div>
              <h3>No matching items found</h3>
              <p>
                Try another search or be the first to report an item.
              </p>
            </div>
          )}
        </section>

        <section className="closing-banner">
          <div>
            <span>SMALL ACTIONS. MEANINGFUL CONNECTIONS.</span>
            <h2>Let's bring things back together.</h2>
          </div>

          <a href="#report">Create a report ↗</a>
        </section>
      </main>

      <footer className="footer">
        <a href="#home" className="brand footer-brand">
          <span className="brand-icon">T</span>
          TraceBack<span className="brand-dot">.</span>
        </a>

        <p>Smart Campus Lost & Found Portal</p>
        <span>© 2026 TraceBack. All rights reserved.</span>
      </footer>
      {selectedItem && (
  <div className="handover-overlay">
    <div className="handover-modal">

      <h2>Item Collection Verification</h2>

      <p>
        Item: <strong>{selectedItem.name}</strong>
      </p>

      <p className="handover-info">
        Authorized staff must verify the collector before handing over this item.
      </p>

      <form onSubmit={submitHandover}>

        <h3>Staff Authentication</h3>

        <input
          type="text"
          placeholder="Staff Username"
          value={staffUsername}
          onChange={(e) => setStaffUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Staff Password"
          value={staffPassword}
          onChange={(e) => setStaffPassword(e.target.value)}
          required
        />

        <h3>Collector Details</h3>

        <input
          type="text"
          placeholder="Collector Full Name"
          value={handoverForm.collector_name}
          onChange={(e) =>
            setHandoverForm({
              ...handoverForm,
              collector_name: e.target.value,
            })
          }
          required
        />

       <input
  type="tel"
  placeholder="Collector Phone Number"
  maxLength={13}
  value={handoverForm.collector_phone}
  onChange={e => setHandoverForm({
    ...handoverForm,
    collector_phone: e.target.value
  })}
  required
/>

        <input
          type="text"
          placeholder="College ID Number"
          value={handoverForm.collector_college_id}
          onChange={(e) =>
            setHandoverForm({
              ...handoverForm,
              collector_college_id: e.target.value,
            })
          }
          required
        />

        <textarea
          placeholder="Ownership verification notes (How was ownership checked?)"
          value={handoverForm.verification_notes}
          onChange={(e) =>
            setHandoverForm({
              ...handoverForm,
              verification_notes: e.target.value,
            })
          }
          required
        />

        {handoverError && (
          <p className="handover-error">
            {handoverError}
          </p>
        )}

        <div className="handover-actions">

          <button
            type="button"
            className="cancel-handover"
            onClick={closeHandover}
            disabled={handoverLoading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="confirm-handover"
            disabled={handoverLoading}
          >
            {handoverLoading
              ? "Verifying..."
              : "Verify & Confirm Collection"}
          </button>

        </div>

      </form>
    </div>
  </div>
)}
    </div>
  );
}

export default App;
