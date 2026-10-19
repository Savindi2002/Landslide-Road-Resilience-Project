
import time
import osmnx as ox

# Healthcare facilities to download
tags = {
    "amenity": ["hospital", "clinic"],
    "healthcare": ["hospital", "clinic"],
}

healthcare = None
max_attempts = 5

for attempt in range(max_attempts):
    try:
        print(
            f"Downloading hospitals and clinics "
            f"(attempt {attempt + 1}/{max_attempts})..."
        )

        healthcare = ox.features_from_place(
            STUDY_AREA,
            tags=tags,
        )

        print(
            f"Healthcare locations downloaded: "
            f"{len(healthcare)}"
        )
        break

    except Exception as error:
        print(f"Download failed: {error}")

        if attempt < max_attempts - 1:
            wait = 30 * (2 ** attempt)
            print(f"Retrying in {wait} seconds...")
            time.sleep(wait)
        else:
            print(
                "Healthcare download failed after all attempts. "
                "You can retry this section later."
            )

# Save the data only if the download succeeded
if healthcare is not None:
    healthcare_file = output_dir / "healthcare_facilities.gpkg"

    healthcare.to_file(
        healthcare_file,
        driver="GPKG",
    )

    print(f"Healthcare data saved: {healthcare_file}")
