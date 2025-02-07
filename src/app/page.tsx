'use client'

import { useState, useEffect, useCallback } from "react";
import { saveAs } from "file-saver";

// Define the company data structure
interface Company {
  companyName: string;
  address: string;
  phones: string;
  email: string;
  website: string;
}

const Home = () => {
  const [url, setUrl] = useState(""); 
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);

  const fetchCompanies = async (fetchUrl = url, append = false) => {
    if (!fetchUrl) {
        setError("Invalid URL");
        return;
    }

    setLoading(true);
    setError(null);

    try {
        const res = await fetch(`/api/scrape?url=${encodeURIComponent(fetchUrl)}`);
        const data = await res.json();

        if (data.success) {
            setCompanies((prev) => (append ? [...prev, ...data.data] : data.data));
            setNextPageUrl(data.nextPage || null); // Store full next page URL
            setHasMore(!!data.nextPage);
        } else {
            setError("Failed to fetch data.");
        }
    } finally {
        setLoading(false);
    }
};


// Handle next page load
const handleNextPage = () => {
  if (!loading && hasMore && nextPageUrl) {
      fetchCompanies(nextPageUrl, true); // ✅ Uses nextPageUrl (a string)
  }
};



const handleScrape = () => {
  setCompanies([]);
  setPage(1);
  setHasMore(false);
  setNextPageUrl(null); // Reset nextPageUrl
  fetchCompanies(url, false); // ✅ Pass the base URL instead of "1"
};



  const handleReset = () => {
    setUrl("");
    setCompanies([]);
    setLoading(false);
    setError(null);
    setPage(1);
    setHasMore(false);
  };

  const downloadCSV = () => {
    if (companies.length === 0) return;
    const header = "Company Name, Address, Phone, Email, Website\n";
    const rows = companies.map(company => `${company.companyName},${company.address},${company.phones},${company.email},${company.website}`).join("\n");
    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "companies.csv");
  };

  return (
    <div className="p-6 max-w-4xl mt-20 mx-auto">
      <h1 className="text-2xl text-center text-green-600 font-bold mb-4">Company Data Scraper</h1>
      <div className="flex mb-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL to scrape"
          className="w-full text-black p-2 border rounded"
        />
        <button onClick={handleReset} className="ml-4 py-2 px-4 bg-red-800 text-white rounded hover:bg-red-700 transition">
          Reset
        </button>
      </div>

      <div className="flex justify-center items-center">
        <button 
          onClick={handleScrape} 
          disabled={loading} 
          className="w-[800px] mt-6 mb-10 py-2 px-8 text-black font-bold bg-white rounded-full transition hover:scale-105 hover:text-white hover:bg-green-700 shadow-md"
        >
          {loading ? "Scraping..." : "Scrape Data"}
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {companies.length > 0 && (
        <>
          <div className="flex justify-center">
            <table className="w-full max-w-4xl border-collapse border border-gray-300">
              <thead>
                <tr className="bg-green-800 text-white">
                  <th className="p-2 border">Company Name</th>
                  <th className="p-2 border">Address</th>
                  <th className="p-2 border">Phone</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Website</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company, index) => (
                  <tr key={index} className="text-center">
                    <td className="p-2 border">{company.companyName}</td>
                    <td className="p-2 border">{company.address}</td>
                    <td className="p-2 border">{company.phones}</td>
                    <td className="p-2 border">{company.email}</td>
                    <td className="p-2 border">{company.website}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex py-10 justify-center items-center">
            <button onClick={downloadCSV} className="w-96 bg-green-800 text-white py-2 rounded mt-4 hover:bg-green-600 transition">
              Download CSV
            </button>
          </div>

          {hasMore && (
    <button 
        onClick={handleNextPage} 
        disabled={loading} 
        className="w-full bg-green-700 text-white py-2 rounded mt-4 hover:bg-green-600 transition"
    >
        {loading ? "Loading..." : "Load More"}
    </button>
)}

        </>
      )}
    </div>
  );
};

export default Home;
