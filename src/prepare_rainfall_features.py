
from pathlib import Path

import pandas as pd


def main():
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "raw" / "ratnapura_daily_rainfall.csv"
    output_dir = root / "data" / "processed"
    output_dir.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        raise FileNotFoundError(
            f"Rainfall file not found: {input_path}\n"
            "Download the rainfall data first."
        )

    df = pd.read_csv(input_path)

    print("Columns found:", df.columns.tolist())

    # Identify the date column.
    date_candidates = [
        col for col in df.columns
        if col.strip().lower() in ["date", "datetime", "time"]
    ]

    if not date_candidates:
        raise ValueError(
            "No date column found. Check the printed column names "
            "and update the date-column selection."
        )

    date_col = date_candidates[0]
    df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
    df = df.dropna(subset=[date_col]).sort_values(date_col)
    df = df.drop_duplicates(subset=[date_col]).reset_index(drop=True)

    # Find the rainfall column.
    rainfall_candidates = [
        col for col in df.columns
        if "precip" in col.lower()
        or "rain" in col.lower()
        or "prectotcorr" in col.lower()
    ]

    if not rainfall_candidates:
        raise ValueError(
            "Could not identify a rainfall column. "
            "Check the column names printed above."
        )

    rainfall_col = rainfall_candidates[0]
    df[rainfall_col] = pd.to_numeric(df[rainfall_col], errors="coerce")

    # NASA POWER daily precipitation is normally reported in mm/day.
    # Negative or missing values should not be silently treated as rainfall.
    df.loc[df[rainfall_col] < 0, rainfall_col] = float("nan")

    df = df.rename(
        columns={
            date_col: "date",
            rainfall_col: "rainfall_mm"
        }
    )

    # Rolling rainfall totals, including the current day.
    df["rainfall_3day_mm"] = (
        df["rainfall_mm"].rolling(3, min_periods=3).sum()
    )
    df["rainfall_7day_mm"] = (
        df["rainfall_mm"].rolling(7, min_periods=7).sum()
    )
    df["rainfall_14day_mm"] = (
        df["rainfall_mm"].rolling(14, min_periods=14).sum()
    )

    # Keep an explicit daily date key for later joining.
    output_path = output_dir / "rainfall_features.csv"
    df.to_csv(output_path, index=False)

    print("\nRainfall feature preparation complete.")
    print(f"Saved: {output_path}")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"Rows: {len(df)}")
    print("\nSummary:")
    print(
        df[
            [
                "rainfall_mm",
                "rainfall_3day_mm",
                "rainfall_7day_mm",
                "rainfall_14day_mm",
            ]
        ].describe().round(2)
    )


if __name__ == "__main__":
    main()
