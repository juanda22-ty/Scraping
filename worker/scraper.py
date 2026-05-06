import asyncio
import random
from typing import Any, Dict, List
from urllib.parse import urljoin
from playwright.async_api import async_playwright


async def _delay() -> None:
    await asyncio.sleep(random.uniform(0.5, 2.0))


async def scrape_page(context, page_url: str) -> List[Dict[str, Any]]:
    page = await context.new_page()
    try:
        await page.goto(page_url, timeout=30000, wait_until='domcontentloaded')
        await page.wait_for_load_state('networkidle', timeout=20000)
        await page.wait_for_selector("article.product_pod", timeout=10000)
        await _delay()

        items = await page.locator("article.product_pod").all()
        products: List[Dict[str, Any]] = []
        for item in items:
            title = await item.locator("h3 a").get_attribute("title")
            href = await item.locator("h3 a").get_attribute("href")
            price_text = await item.locator(".price_color").text_content() or ""
            price = float(price_text.replace("£", "").strip())
            available = "In stock" in (await item.locator(".availability").text_content() or "")
            product_url = urljoin(page_url, href or "")
            products.append(
                {
                    "id": product_url,
                    "title": title or "",
                    "price": price,
                    "currency": "GBP",
                    "url": product_url,
                    "available": available,
                }
            )
        return products
    except Exception as exc:
        print(f"Error scraping {page_url}: {exc}")
        return []
    finally:
        await page.close()


async def scrape_catalog(base_url: str) -> List[Dict[str, Any]]:
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context()
        try:
            page_urls = [base_url]
            cursor = await context.new_page()
            await cursor.goto(base_url, timeout=30000)
            while True:
                next_handle = await cursor.query_selector("li.next a")
                if not next_handle:
                    break
                next_link = await next_handle.get_attribute("href")
                if not next_link:
                    break
                next_url = urljoin(cursor.url, next_link)
                page_urls.append(next_url)
                await cursor.goto(next_url, timeout=30000)
            await cursor.close()

            print(f"Found {len(page_urls)} page(s) to scrape")
            tasks = []
            semaphore = asyncio.Semaphore(3)

            async def bound_scrape(url: str) -> List[Dict[str, Any]]:
                async with semaphore:
                    return await scrape_page(context, url)

            for url in page_urls:
                tasks.append(bound_scrape(url))

            results = await asyncio.gather(*tasks, return_exceptions=True)
            products: List[Dict[str, Any]] = []
            for result in results:
                if isinstance(result, Exception):
                    print("Page task failed:", result)
                    continue
                products.extend(result)

            print(f"Scraped {len(products)} products")
            return products
        finally:
            await browser.close()
