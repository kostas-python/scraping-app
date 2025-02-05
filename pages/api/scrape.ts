import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { NextApiRequest, NextApiResponse } from "next";

// Use Puppeteer with Stealth Plugin
puppeteer.use(StealthPlugin());

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log("Launching Puppeteer...");

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // URL is predefined (or you can extract it from the request)
        const url = `https://www.eop.gr/search/company?keyword=%CE%A5%CE%B4%CE%A1%CE%91%CE%A5%CE%9B%CE%99%CE%9A%CE%9F%CE%99&region=%CF%80%CE%B1%CF%84%CF%81%CE%B1&term_id=11082&parent_region=`;

        console.log("Scraping URL:", url);

        await page.goto(url, { waitUntil: "domcontentloaded" });

        // Screenshot for debugging
        await page.screenshot({ path: 'screenshot.png' });

        // Wait for the selector to appear with increased timeout
        await page.waitForSelector("article.row", { timeout: 60000 });

        // Scrape the company data
        const companies = await page.$$eval("article.row", (articles) =>
            articles.map((article) => {
                // Scraping all required details
                const companyNameElement = article.querySelector("h2.article--title");
                const websiteElement = article.querySelector("a[data-type='company--website']");
                const emailElement = article.querySelector(".company--emails a");
                const phoneElements = article.querySelectorAll(".company--phones a[href^='tel:']");
                const locationElement = article.querySelector("a.routing-link");
                const addressElement = article.querySelector(".company--address");
                const descriptionElement = article.querySelector(".company--description p");
                const categoryElement = article.querySelector(".company--category span");

                return {
                    companyName: companyNameElement ? companyNameElement.textContent?.trim() || "N/A" : "N/A",
                    website: websiteElement ? websiteElement.getAttribute('href') || "N/A" : "N/A",
                    email: emailElement ? emailElement.textContent?.trim() || "N/A" : "N/A",
                    phones: Array.from(phoneElements)
                        .map(phone => phone.textContent?.trim() || "N/A")
                        .join(", "),
                    location: locationElement ? locationElement.getAttribute('href') || "N/A" : "N/A",
                    address: addressElement ? addressElement.textContent?.trim() || "N/A" : "N/A",
                    description: descriptionElement ? descriptionElement.textContent?.trim() || "N/A" : "N/A",
                    category: categoryElement ? categoryElement.textContent?.trim() || "N/A" : "N/A",
                };
            })
        );

        console.log("Scraping complete. Total companies scraped:", companies.length);

        await browser.close();

        return res.status(200).json({ success: true, data: companies });
    } catch (error: any) {
        console.error("Error during scraping:", error);
        return res.status(500).json({
            success: false,
            error: `Failed to scrape data. Error: ${error.message}`,
        });
    }
}

