import asyncio
import json
from pathlib import Path
from typing import Any, Dict
import httpx


def _backup_failed_payload(payload: Dict[str, Any]) -> None:
    backup_file = Path(__file__).parent.parent / "failed_snapshot.json"
    backup_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Saved failed payload to {backup_file}")


async def send_snapshot(api_url: str, payload: Dict[str, Any], retries: int = 3) -> Dict[str, Any]:
    last_error = None
    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(1, retries + 1):
            try:
                response = await client.post(api_url, json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.RequestError as exc:
                last_error = exc
                print(f"Request error on attempt {attempt}: {exc}")
            except httpx.HTTPStatusError as exc:
                last_error = exc
                print(f"HTTP error on attempt {attempt}: {exc.response.status_code} {exc.response.text}")

            await asyncio.sleep(2 ** attempt)

    _backup_failed_payload(payload)
    raise RuntimeError(f"Failed to send snapshot after {retries} attempts")
