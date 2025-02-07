import { chromium } from "playwright";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { url } = req.query;

        if (!url || typeof url !== "string" || !url.startsWith("http")) {
            return res.status(400).json({ success: false, error: "A valid URL is required." });
        }
        

        console.log("Launching Playwright...");
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const pageInstance = await context.newPage();

        console.log("Scraping URL:", url);
        await pageInstance.goto(url, { waitUntil: "domcontentloaded" });

        await pageInstance.waitForSelector(".company--details", { timeout: 60000 });

        const companies = await pageInstance.$$eval("article.row", (articles) =>
            articles.map((article) => {
                const companyName = article.querySelector("h2.article--title")?.textContent?.trim() || "N/A";
                const website = article.querySelector("a[data-type='company--website']")?.getAttribute('href') || "N/A";
                const email = article.querySelector(".company--emails a")?.textContent?.trim() || "N/A";
                const phones = Array.from(article.querySelectorAll(".company--phones a[href^='tel:']"))
                    .map(phone => phone.textContent?.trim() || "N/A")
                    .join(", ");
                const address = article.querySelector(".company--address")?.textContent?.trim() || "N/A";

                return { companyName, website, email, phones, address };
            })
        );

        // Detect next page URL from the pagination link
        // Get the base URL (without query parameters)
const baseUrl = new URL(url);
baseUrl.search = ""; // Remove any existing query params

// Select the "Next" button element
const nextPageElement = await pageInstance.$("a.pagination--link");

// Get the 'href' attribute
let nextPage = nextPageElement ? await nextPageElement.getAttribute("href") : null;

if (nextPage && nextPage !== "#" && !nextPage.startsWith("http")) {
    // If the nextPage is a relative URL, construct the full URL
    nextPage = new URL(nextPage, baseUrl).href;
} else if (nextPage === "#") {
    nextPage = null; // Prevent looping on invalid pages
}

console.log("Next page URL detected:", nextPage);



        console.log("Scraping complete. Total companies scraped:", companies.length);
        await browser.close();

        return res.status(200).json({ success: true, data: companies, nextPage });
    } catch (error: unknown) {
        console.error("Error during scraping:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

        return res.status(500).json({
            success: false,
            error: `Failed to scrape data. Error: ${errorMessage}`,
        });
    }
}

