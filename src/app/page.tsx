'use client'

import { useState } from "react";

const Home = () => {
  const [url, setUrl] = useState("");  // URL input state
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    if (!url) {
      setError("Please enter a URL to scrape.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send the URL to the backend API
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (data.success) {
        setCompanies(data.data); // Set the companies data in state
      } else {
        setError("Failed to fetch data.");
      }
    } catch (error) {
      setError("An error occurred while fetching the data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Company Data Scraper</h1>
      {/* Input field for URL */}
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL to scrape"
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />

      {/* Button to trigger scraping */}
      <button onClick={handleScrape} disabled={loading}>
        {loading ? "Scraping..." : "Scrape Data"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {companies.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Website</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company, index) => (
              <tr key={index}>
                <td>{company.companyName}</td>
                <td>{company.address}</td>
                <td>{company.phones}</td>
                <td>{company.email}</td>
                <td>{company.website}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Home;
