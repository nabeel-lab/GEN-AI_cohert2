from models import LocationMetrics

# Precise coordinates for popular micro-markets in Bangalore and Hyderabad
NEIGHBORHOOD_DATABASE = {
    # Bangalore
    "indiranagar": {"lat": 12.9719, "lng": 77.6412, "footfall": 92, "density": 85, "access": 88, "growth": 82},
    "koramangala": {"lat": 12.9352, "lng": 77.6245, "footfall": 95, "density": 90, "access": 85, "growth": 80},
    "whitefield": {"lat": 12.9698, "lng": 77.7500, "footfall": 80, "density": 65, "access": 78, "growth": 90},
    "jayanagar": {"lat": 12.9308, "lng": 77.5838, "footfall": 88, "density": 70, "access": 92, "growth": 75},
    "mg road": {"lat": 12.9738, "lng": 77.6119, "footfall": 94, "density": 88, "access": 95, "growth": 70},
    "bangalore": {"lat": 12.9716, "lng": 77.5946, "footfall": 85, "density": 75, "access": 85, "growth": 82},
    "bengaluru": {"lat": 12.9716, "lng": 77.5946, "footfall": 85, "density": 75, "access": 85, "growth": 82},
    
    # Hyderabad
    "gachibowli": {"lat": 17.4401, "lng": 78.3489, "footfall": 82, "density": 60, "access": 80, "growth": 95},
    "jubilee hills": {"lat": 17.4325, "lng": 78.4071, "footfall": 90, "density": 80, "access": 85, "growth": 88},
    "madhapur": {"lat": 17.4483, "lng": 78.3915, "footfall": 93, "density": 85, "access": 82, "growth": 92},
    "banjara hills": {"lat": 17.4173, "lng": 78.4428, "footfall": 88, "density": 78, "access": 86, "growth": 85},
    "hyderabad": {"lat": 17.3850, "lng": 78.4867, "footfall": 86, "density": 72, "access": 85, "growth": 88},
    "secunderabad": {"lat": 17.4399, "lng": 78.4983, "footfall": 80, "density": 68, "access": 88, "growth": 70}
}

def analyze_location(
    location_str: str,
    business_type: str,
    precise_lat: float = None,
    precise_lng: float = None,
) -> LocationMetrics:
    """
    Scores a location on footfall/competition/accessibility/growth using the
    hardcoded neighborhood heuristic dataset (no live footfall/GIS data source
    exists to compute these from real signals). The coordinates returned,
    however, prefer the exact point the user picked on the map (precise_lat/
    precise_lng, from the Uber-style location picker + Geocoding API) over the
    neighborhood's fixed centroid — so the report always reflects the real
    pin, even though the 0-100 scores remain a same-neighborhood approximation.
    """
    loc_lower = location_str.lower().strip()

    # Find matching neighborhood in our database
    matched_data = None
    for name, data in NEIGHBORHOOD_DATABASE.items():
        if name in loc_lower:
            matched_data = data
            break

    # Default fallback (Bangalore center) if no match is found
    if not matched_data:
        # Check if the text contains Hyderabad anywhere
        if "hyderabad" in loc_lower or "gachibowli" in loc_lower or "madhapur" in loc_lower:
            matched_data = NEIGHBORHOOD_DATABASE["hyderabad"]
        else:
            matched_data = NEIGHBORHOOD_DATABASE["bangalore"]

    # Adjust metrics slightly based on business type to make it feel customized
    bus_lower = business_type.lower()
    footfall = matched_data["footfall"]
    density = matched_data["density"]
    access = matched_data["access"]
    growth = matched_data["growth"]

    if "cafe" in bus_lower or "restaurant" in bus_lower:
        # Cafes care a lot about high footfall and access
        footfall = min(100, footfall + 2)
        access = min(100, access + 1)
    elif "gym" in bus_lower:
        # Gyms don't need high retail footfall but need growth
        footfall = max(30, footfall - 10)
        growth = min(100, growth + 4)
    elif "salon" in bus_lower:
        # Salons need good accessibility
        access = min(100, access + 3)
        density = max(10, density - 5)

    # Prefer the exact map-picked coordinates over the neighborhood centroid.
    latitude = precise_lat if precise_lat is not None else matched_data["lat"]
    longitude = precise_lng if precise_lng is not None else matched_data["lng"]

    return LocationMetrics(
        footfall_score=footfall,
        competition_density=density,
        accessibility_score=access,
        growth_potential=growth,
        latitude=latitude,
        longitude=longitude,
    )
