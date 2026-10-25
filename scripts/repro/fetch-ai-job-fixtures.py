#!/usr/bin/env python3
"""Fetch exact production ai_jobs payloads → local JSON fixtures (read-only).

Saves the literal payloads of the incident jobs so the repro script replays
them through the REAL engine verbatim (zero DB writes, zero provider calls).
"""
import json
import os
import urllib.request

SB = "https://wyopqryzfjifyeyvyxfy.supabase.co"
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "repro-fixtures")
os.makedirs(OUT, exist_ok=True)

JOBS = {
    # plan_nutrition for Samar (real keto client, insulin resistance, 132.5kg)
    "a8201f6c": "a8201f6c-5f18-4b34-8871-64ca882aef8e",
    # plan_nutrition for the test user (owner's test client)
    "15ebfcd6": "15ebfcd6-1574-4679-b811-f6a6d8849fab",
    # failed meal_regenerate (keto 815 kcal, 3x «وصلت 0»)
    "a26cf95e": "a26cf95e-1129-47da-b9f4-2886598534aa",
    # the 16:29 post-deploy meal swaps (test client plan 3df83197)
    "b165b018": "b165b018-3da8-49ec-81b7-53a194ca63b5",
    "83a1966e": "83a1966e-8e78-40b3-8f15-35b39b485ad0",
    "4c06d8d4": "4c06d8d4-5a81-40d2-a5f4-c7e6e874d4a5",
}


def rest(path):
    req = urllib.request.Request(
        f"{SB}/rest/v1/{path}",
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}"},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())


def main():
    if not KEY:
        raise SystemExit("missing SUPABASE_SERVICE_ROLE_KEY")
    for name, jid in JOBS.items():
        rows = rest(f"ai_jobs?select=job_type,payload,result&id=eq.{jid}")
        if not rows:
            print(f"{name}: NOT FOUND")
            continue
        row = rows[0]
        # strip PII-ish free text? NO — the engine consumes the verbatim
        # payload; fixtures stay LOCAL (never committed).
        path = os.path.join(OUT, f"{name}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"job_type": row["job_type"], "payload": row["payload"], "db_result": row["result"]}, f, ensure_ascii=False, indent=1)
        print(f"{name}: {row['job_type']} → {path}")


if __name__ == "__main__":
    main()
