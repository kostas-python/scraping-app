import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { NextApiRequest, NextApiResponse } from "next";

// Use Puppeteer with Stealth Plugin
puppeteer.use(StealthPlugin());

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { url } = req.query;  // Get the URL from the query parameters
    
        if (!url || typeof url !== "string") {
          return res.status(400).json({
            success: false,
            error: "A valid URL is required.",
          });
        }
    
        console.log("Launching Puppeteer...");
    
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
    
        console.log("Scraping URL:", url);
    
        await page.goto(url, { waitUntil: "domcontentloaded" });
    
        // Screenshot for debugging
        await page.screenshot({ path: 'screenshot.png' });
    
        // Wait for the selector to appear with increased timeout
        await page.waitForSelector(".company--details", { timeout: 60000 });

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

                // Extracting the phone numbers as an array of strings
                const phoneNumbers = Array.from(phoneElements)
                    .map(phone => phone.textContent?.trim() || "N/A")
                    .join(", "); // Joining all phone numbers with commas

                return {
                    companyName: companyNameElement ? companyNameElement.textContent?.trim() || "N/A" : "N/A",
                    website: websiteElement ? websiteElement.getAttribute('href') || "N/A" : "N/A",
                    email: emailElement ? emailElement.textContent?.trim() || "N/A" : "N/A",
                    phones: phoneNumbers || "N/A", // Added phone number extraction
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

