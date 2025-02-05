import { chromium } from "playwright";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        let { url, page } = req.query;

        if (!url || typeof url !== "string") {
            return res.status(400).json({ success: false, error: "A valid URL is required." });
        }

        const pageNumber = typeof page === "string" ? parseInt(page, 10) || 1 : 1;
        const fullUrl = `${url}?page=${pageNumber}`;

        console.log("Launching Playwright...");
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const pageInstance = await context.newPage();

        console.log("Scraping URL:", fullUrl);
        await pageInstance.goto(fullUrl, { waitUntil: "domcontentloaded" });

        await pageInstance.waitForSelector(".company--details", { timeout: 60000 });

        // Scrape company data
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

        // Check if "Next Page" button exists
        const nextPageExists = await pageInstance.$(".pagination a[href*='?page=']");
        const nextPage = nextPageExists ? Number(page) + 1 : null;

        console.log("Scraping complete. Total companies scraped:", companies.length);
        await browser.close();

        return res.status(200).json({ success: true, data: companies, nextPage });
    } catch (error: any) {
        console.error("Error during scraping:", error);
        return res.status(500).json({
            success: false,
            error: `Failed to scrape data. Error: ${error.message}`,
        });
    }
}
