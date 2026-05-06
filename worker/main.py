import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from scraper import scrape_catalog
from api_client import send_snapshot

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")
API_URL = os.getenv("WORKER_API_URL", "http://localhost:3000/snapshots")
SOURCE_URL = os.getenv("WORKER_SOURCE_URL", "https://books.toscrape.com")


async def main() -> None:
    print(f"Worker started. Scraping {SOURCE_URL}")
    products = await scrape_catalog(SOURCE_URL)
    if not products:
        print("No products were scraped. Exiting.")
        return

    payload = {
        "snapshotId": f"snapshot-{datetime.now(timezone.utc).isoformat()}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": SOURCE_URL,
        "products": products,
    }

    response = await send_snapshot(API_URL, payload)
    print("API response:", response)


if __name__ == "__main__":
    asyncio.run(main())
