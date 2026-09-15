"""
MFILM Lightweight Local Stream Consumer & Ingestion Worker
Consumes events from Kafka broker and inserts into ClickHouse HTTP interface.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

CLICKHOUSE_URL = os.getenv("CLICKHOUSE_URL", "http://localhost:8123")
CLICKHOUSE_DB = os.getenv("CLICKHOUSE_DB", "mfilm_analytics")
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9094")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "mfilm.streaming.events")

def insert_event_to_clickhouse(event_dict):
    """
    Inserts an event into ClickHouse table streaming_events via ClickHouse HTTP interface.
    """
    query = f"INSERT INTO {CLICKHOUSE_DB}.streaming_events FORMAT JSONEachRow"
    
    row_data = {
        "eventId": event_dict.get("eventId"),
        "eventType": event_dict.get("eventType"),
        "eventVersion": event_dict.get("eventVersion", "1"),
        "occurredAt": event_dict.get("occurredAt", time.strftime("%Y-%m-%d %H:%M:%S")),
        "receivedAt": event_dict.get("receivedAt", time.strftime("%Y-%m-%d %H:%M:%S")),
        "userId": event_dict.get("userId", "anonymous"),
        "sessionId": event_dict.get("sessionId", "unknown"),
        "movieId": event_dict.get("movieId", ""),
        "episodeId": event_dict.get("episodeId", ""),
        "metadata": json.dumps(event_dict.get("metadata", {})),
        "clientIp": event_dict.get("clientIp", ""),
        "userAgent": event_dict.get("userAgent", "")
    }

    url = f"{CLICKHOUSE_URL}/?query={urllib.parse.quote(query)}"
    payload = json.dumps(row_data).encode("utf-8")

    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("X-ClickHouse-User", os.getenv("CLICKHOUSE_USER", "default"))
    req.add_header("X-ClickHouse-Key", os.getenv("CLICKHOUSE_PASSWORD", "clickhouse_password"))
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status == 200
    except urllib.error.URLError as e:
        print(f"[!] ClickHouse insert error: {e}", file=sys.stderr)
        return False

def verify_clickhouse_connection():
    try:
        req = urllib.request.Request(f"{CLICKHOUSE_URL}/ping")
        with urllib.request.urlopen(req, timeout=3) as resp:
            content = resp.read().decode("utf-8").strip()
            return content == "Ok."
    except Exception as e:
        print(f"[!] ClickHouse ping failed: {e}")
        return False

if __name__ == "__main__":
    print(f"[*] MFILM Local Stream Ingestion Worker initialized.")
    ch_ok = verify_clickhouse_connection()
    print(f"[*] ClickHouse connection: {'HEALTHY' if ch_ok else 'NOT REACHABLE'}")
