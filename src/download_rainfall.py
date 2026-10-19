
from pathlib import Path
from datetime import datetime
import json
import time

import pandas as pd
import requests


# Ratnapura town coordinates
LATITUDE = 6.6828
LONGITUDE = 80.3992

# Historical study period
START_DATE = "20150101"
END_DATE = "20251231"

API_URL = (
    "https://power.larc.nasa.gov/api/temporal/daily/point"
)


def main():
    project_root = Path(__file__).resolve().parents[1]
    output_dir = project_root / "data" / "raw"
    output_dir.mkdir(parents=True, exist_ok=True)

    output_csv = output_dir / "ratnapura_daily_rainfall.csv"
    metadata_file = output_dir / "rainfall_metadata.json"

    params = {
        "parameters": "PRECTOTCORR",
        "community": "AG",
        "longitude": LONGITUDE,
        "latitude": LATITUDE,
        "start": START_DATE,
        "end": END_DATE,
        "format": "JSON",
        "time-standard": "LST",
    }

    print("Requesting daily rainfall from NASA POWER...")
    print(f"Location: {LATITUDE}, {LONGITUDE}")
    print(f"Period: {START_DATE} to {END_DATE}")

    response = None

    for attempt in range(1, 4):
        try:
            response = requests.get(
                API_URL,
                params=params,
                timeout=60,
            )
            response.raise_for_status()
            break

        except requests.RequestException as error:
            print(f"Attempt {attempt}/3 failed: {error}")

            if attempt == 3:
                raise RuntimeError(
                    "Could not download rainfall data. "
                    "Check your internet connection and try again later."
                ) from error

            time.sleep(3 * attempt)

    data = response.json()

    if "properties" not in data or "parameter" not in data["properties"]:
        raise ValueError(
            "Unexpected API response. Check the NASA POWER "
            "response and parameter availability."
        )

    parameters = data["properties"]["parameter"]

    if "PRECTOTCORR" not in parameters:
        raise ValueError(
            "PRECTOTCORR was not returned. Check the API response "
            "and NASA POWER parameter availability."
        )

    rainfall = parameters["PRECTOTCORR"]

    df = pd.DataFrame({
        "date": pd.to_datetime(
            list(rainfall.keys()),
            format="%Y%m%d",
        ),
        "rainfall_mm": list(rainfall.values()),
    })

    # NASA POWER uses -999 to represent missing data.
    df["rainfall_mm"] = pd.to_numeric(
        df["rainfall_mm"], errors="coerce"
    )
    df.loc[df["rainfall_mm"] == -999, "rainfall_mm"] = float("nan")

    df = df.sort_values("date").reset_index(drop=True)

    # Accumulated rainfall over the previous seven days,
    # including the current day.
    df["rainfall_7d_mm"] = (
        df["rainfall_mm"]
        .rolling(window=7, min_periods=7)
        .sum()
    )

    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month

    df.to_csv(output_csv, index=False)

    metadata = {
        "source": "NASA POWER Daily API",
        "api_url": response.url,
        "parameter": "PRECTOTCORR",
        "description": "Corrected precipitation",
        "unit": "mm/day",
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "start_date": START_DATE,
        "end_date": END_DATE,
        "retrieved_at_utc": datetime.utcnow().isoformat() + "Z",
        "note": (
            "Data represents a gridded estimate at the selected "
            "coordinate, not a local rain gauge. Seven-day rainfall "
            "is a derived feature. Missing values are not treated as zero."
        ),
    }

    with open(metadata_file, "w", encoding="utf-8") as file:
        json.dump(metadata, file, indent=2)

    print("\nDownload successful!")
    print(f"Records: {len(df)}")
    print(f"Missing daily rainfall values: {df['rainfall_mm'].isna().sum()}")
    print(f"Saved data: {output_csv}")
    print(f"Saved metadata: {metadata_file}")
    print("\nFirst five records:")
    print(df.head().to_string(index=False))


if __name__ == "__main__":
    main()
