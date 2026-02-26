from __future__ import annotations

import json
import os
import threading
from datetime import datetime
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(title="Murojaatlar API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DATA_FILE = os.path.join(DATA_DIR, "murojaatlar.json")
_FILE_LOCK = threading.Lock()


def _ensure_data_file() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, ensure_ascii=False, indent=2)


def _read_items() -> list[dict[str, Any]]:
    _ensure_data_file()
    with _FILE_LOCK:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            raw = f.read().strip()
            if not raw:
                return []
            data = json.loads(raw)
            return data if isinstance(data, list) else []


def _write_items(items: list[dict[str, Any]]) -> None:
    _ensure_data_file()
    with _FILE_LOCK:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)


def _find_index_by_id(items: list[dict[str, Any]], item_id: int) -> int:
    for i, item in enumerate(items):
        if item.get("id") == item_id:
            return i
    return -1


class CreateMurojaatPayload(BaseModel):
    sarlavha: str
    mazmun: str = ""
    vaqt: Optional[str] = None
    muhim: bool = False
    bajarilgan: bool = False


class UpdateMurojaatPayload(BaseModel):
    sarlavha: Optional[str] = None
    mazmun: Optional[str] = None
    vaqt: Optional[str] = None
    muhim: Optional[bool] = None
    bajarilgan: Optional[bool] = None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/murojaatlar")
def get_all() -> list[dict[str, Any]]:
    return _read_items()


@app.get("/api/murojaatlar/{item_id}")
def get_one(item_id: int) -> dict[str, Any]:
    items = _read_items()
    idx = _find_index_by_id(items, item_id)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Topilmadi")
    return items[idx]


@app.post("/api/murojaatlar", status_code=201)
def create_item(payload: CreateMurojaatPayload) -> dict[str, Any]:
    sarlavha = payload.sarlavha.strip()
    mazmun = payload.mazmun.strip()
    vaqt = (payload.vaqt or "").strip() or datetime.now().isoformat(timespec="seconds")

    if not sarlavha:
        raise HTTPException(status_code=400, detail="sarlavha majburiy")

    items = _read_items()
    new_item = {
        "id": int(datetime.now().timestamp() * 1000),
        "sarlavha": sarlavha,
        "mazmun": mazmun,
        "vaqt": vaqt,
        "muhim": bool(payload.muhim),
        "bajarilgan": bool(payload.bajarilgan),
    }
    items.append(new_item)
    _write_items(items)
    return new_item


@app.put("/api/murojaatlar/{item_id}")
def update_item(item_id: int, payload: UpdateMurojaatPayload) -> dict[str, Any]:
    items = _read_items()
    idx = _find_index_by_id(items, item_id)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Topilmadi")

    item = items[idx]
    payload_data = payload.model_dump(exclude_unset=True)

    if "sarlavha" in payload_data:
        item["sarlavha"] = (payload_data.get("sarlavha") or "").strip()
    if "mazmun" in payload_data:
        item["mazmun"] = (payload_data.get("mazmun") or "").strip()
    if "vaqt" in payload_data:
        item["vaqt"] = (payload_data.get("vaqt") or "").strip()
    if "muhim" in payload_data:
        item["muhim"] = bool(payload_data.get("muhim"))
    if "bajarilgan" in payload_data:
        item["bajarilgan"] = bool(payload_data.get("bajarilgan"))

    if not str(item.get("sarlavha", "")).strip():
        raise HTTPException(status_code=400, detail="sarlavha bosh bolmasligi kerak")

    items[idx] = item
    _write_items(items)
    return item


@app.delete("/api/murojaatlar/{item_id}")
def delete_item(item_id: int) -> dict[str, Any]:
    items = _read_items()
    idx = _find_index_by_id(items, item_id)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Topilmadi")

    deleted = items.pop(idx)
    _write_items(items)
    return {"deleted": True, "item": deleted}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
