import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { NextApiRequest, NextApiResponse } from "next";

// Use Puppeteer with Stealth Plugin
puppeteer.use(StealthPlugin());

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Define `url` and `page` as `const` since they are not reassigned
        const { url, page } = req.query;

        if (!url || typeof url !== "string") {
            return res.status(400).json({ success: false, error: "A valid URL is required." });
        }

        // Ensure `page` is treated as a number safely
        const pageNumber = typeof page === "string" ? parseInt(page, 10) || 1 : 1;
        const fullUrl = `${url}?page=${pageNumber}`; // Append page number to URL

        console.log("Launching Puppeteer...");
        const browser = await puppeteer.launch({ headless: true });
        const pageInstance = await browser.newPage();

        console.log("Scraping URL:", fullUrl);
        await pageInstance.goto(fullUrl, { waitUntil: "domcontentloaded" });

        await pageInstance.waitForSelector(".company--details", { timeout: 60000 });

        // Scrape company data
        const companies = await pageInstance.$$eval("article.row", (articles) =>
            articles.map((article) => {
                const companyNameElement = article.querySelector("h2.article--title");
                const websiteElement = article.querySelector("a[data-type='company--website']");
                const emailElement = article.querySelector(".company--emails a");
                const phoneElements = article.querySelectorAll(".company--phones a[href^='tel:']");
                const addressElement = article.querySelector(".company--address");

                const phoneNumbers = Array.from(phoneElements)
                    .map(phone => phone.textContent?.trim() || "N/A")
                    .join(", ");

                return {
                    companyName: companyNameElement ? companyNameElement.textContent?.trim() || "N/A" : "N/A",
                    website: websiteElement ? websiteElement.getAttribute('href') || "N/A" : "N/A",
                    email: emailElement ? emailElement.textContent?.trim() || "N/A" : "N/A",
                    phones: phoneNumbers || "N/A",
                    address: addressElement ? addressElement.textContent?.trim() || "N/A" : "N/A",
                };
            })
        );

        // Check if a "Next Page" button exists
        const nextPageExists = await pageInstance.$(".pagination a[href*='?page=']");
        const nextPage = nextPageExists ? Number(page) + 1 : null;

        console.log("Scraping complete. Total companies scraped:", companies.length);
        await browser.close();

        return res.status(200).json({ success: true, data: companies, nextPage });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error during scraping:", error);
            return res.status(500).json({
                success: false,
                error: `Failed to scrape data. Error: ${error.message}`,
            });
        } else {
            console.error("Unknown error during scraping:", error);
            return res.status(500).json({
                success: false,
                error: "An unknown error occurred",
            });
        }
    }
}
