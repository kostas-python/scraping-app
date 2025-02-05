declare module "playwright-stealth" {
    import { BrowserContext } from "playwright";

    function stealth(context: BrowserContext): Promise<void>;
    export default stealth;
}
