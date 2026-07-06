from typing import Dict, Any
from models import CompetitorReport, Competitor

COMPETITOR_DATABASE: Dict[str, Dict[str, Any]] = {
    "cafe": {
        "competitors": [
            {
                "name": "The Brew Room",
                "rating": 4.5,
                "price_range": "INR 400-600 for two",
                "strengths": ["Premium artisan coffee selection", "Chic outdoor seating aesthetics", "Strong loyal student base"],
                "weaknesses": ["Slow table service", "Limited power sockets for remote workers", "High premium pricing"],
                "estimated_monthly_revenue": "INR 8,50,000"
            },
            {
                "name": "Roastery Coffee House",
                "rating": 4.7,
                "price_range": "INR 500-800 for two",
                "strengths": ["In-house fresh roasting beans", "Beautiful heritage villa vibes", "Exceptional menu options"],
                "weaknesses": ["Long wait times during weekends", "Congested parking spaces", "No direct delivery presence"],
                "estimated_monthly_revenue": "INR 15,00,000"
            },
            {
                "name": "Third Wave Coffee",
                "rating": 4.3,
                "price_range": "INR 350-500 for two",
                "strengths": ["Excellent co-working workspace setups", "Fast-growing franchise recognition", "Convenient mobile app ordering"],
                "weaknesses": ["A bit corporate / lacks cozy vibe", "Premium brand price friction", "Standardized snacks menu"],
                "estimated_monthly_revenue": "INR 12,00,000"
            }
        ],
        "swot": {
            "strengths": ["Access to premium local coffee bean supply chains", "Growing specialty coffee culture", "Strong community engagement"],
            "weaknesses": ["High initial commercial rent overheads", "Heavy reliance on skilled baristas", "High customer acquisition cost"],
            "opportunities": ["Curating cold brew subscription kits", "Introducing specialty vegan and gluten-free snack pairings", "Hosting community events/workshops"],
            "threats": ["Rapid expansion of established coffee chains", "Rising raw coffee bean costs", "Rent increases in popular districts"]
        },
        "gap_opportunity": "There is a distinct gap for a mid-priced specialty cafe that focuses heavily on high-speed internet and ergonomic workspace seating for remote professionals, pairing high-quality local brews with affordable quick bites."
    },
    "bakery": {
        "competitors": [
            {
                "name": "Le 15 Patisserie",
                "rating": 4.6,
                "price_range": "INR 300-500 for two",
                "strengths": ["Renowned signature macarons", "Highly premium brand image", "Strong gifting boxes line"],
                "weaknesses": ["Limited savory selection", "Expensive for daily consumption", "Small physical dining space"],
                "estimated_monthly_revenue": "INR 7,00,000"
            },
            {
                "name": "Glen's Bakehouse",
                "rating": 4.4,
                "price_range": "INR 400-600 for two",
                "strengths": ["Famous red velvet cupcakes", "Casual bistro menu options", "Spacious and cozy seating"],
                "weaknesses": ["Inconsistent quality across franchise sites", "Crowded ordering counters", "Desserts sit out long"],
                "estimated_monthly_revenue": "INR 14,00,000"
            },
            {
                "name": "Theobroma",
                "rating": 4.5,
                "price_range": "INR 250-450 for two",
                "strengths": ["Famous chocolate brownies", "Widespread franchise availability", "Efficient takeaway processes"],
                "weaknesses": ["Lacks custom specialty cake options", "Industrial factory-baked feel", "Premium margins"],
                "estimated_monthly_revenue": "INR 18,00,000"
            }
        ],
        "swot": {
            "strengths": ["High margins on baked flour goods", "Gifting appeal for festivals", "Consistent daily consumption staples"],
            "weaknesses": ["Very short product shelf life", "Strict ingredient quality control needed", "High wastage rates"],
            "opportunities": ["Customized designer cakes for local celebrations", "Sugar-free and diabetic-friendly pastry lines", "B2B catering to local corporates"],
            "threats": ["Supermarket discount bakery sections", "Fluctuations in dairy and egg prices", "Rising health consciousness limiting sugar intake"]
        },
        "gap_opportunity": "A boutique bakery specializing in sourdough, artisanal breads, and sugar-free/keto-friendly cakes will address underserved health-conscious demographics in affluent urban micro-markets."
    },
    "restaurant": {
        "competitors": [
            {
                "name": "Punjab Grill",
                "rating": 4.4,
                "price_range": "INR 1200-1800 for two",
                "strengths": ["Premium fine-dining ambience", "Classic North Indian menu consistency", "Excellent corporate booking crowd"],
                "weaknesses": ["High premium pricing", "Less appealing to younger generations", "Heavy, slow dining experience"],
                "estimated_monthly_revenue": "INR 25,00,000"
            },
            {
                "name": "Absolute Barbecues",
                "rating": 4.6,
                "price_range": "INR 800-1200 for two",
                "strengths": ["Popular DIY grill concept", "High value-for-money buffet", "Great birthday/group target packages"],
                "weaknesses": ["Very noisy and crowded dining floor", "Short table sitting limits", "Quality drops during peak rushes"],
                "estimated_monthly_revenue": "INR 35,00,000"
            },
            {
                "name": "Social",
                "rating": 4.3,
                "price_range": "INR 800-1200 for two",
                "strengths": ["Dynamic co-working by day, bar by night", "Extremely popular youth appeal", "Creative presentation and dishes"],
                "weaknesses": ["Lacks traditional family dining appeal", "Music can be too loud for conversations", "Inconsistent service speed"],
                "estimated_monthly_revenue": "INR 28,00,000"
            }
        ],
        "swot": {
            "strengths": ["High average ticket size", "Strong liquor margin potential", "Excellent group dining retention"],
            "weaknesses": ["Massive initial kitchen and setup capital", "High kitchen staff turnover", "Extremely complex inventory management"],
            "opportunities": ["Curated chef table tasting experiences", "Cloud kitchen brands to capture delivery market", "Locally sourced organic ingredients focus"],
            "threats": ["Aggressive discounting from aggregators (Zomato/Swiggy)", "Strict alcohol licensing laws", "Rapidly changing culinary trends"]
        },
        "gap_opportunity": "A casual-chic fusion restaurant focusing on locally sourced ingredients and a rotation of creative regional dishes can disrupt standard commercial franchise dining formats."
    },
    "retail": {
        "competitors": [
            {
                "name": "Decathlon",
                "rating": 4.6,
                "price_range": "INR 500-3000 average spend",
                "strengths": ["Massive warehouse-style variety", "High-quality budget private labels", "Interactive play-before-buy layout"],
                "weaknesses": ["Lacks premium designer brands", "Staff assistance is limited", "Locations often outer suburbs"],
                "estimated_monthly_revenue": "INR 50,00,000"
            },
            {
                "name": "Westside",
                "rating": 4.3,
                "price_range": "INR 1000-2500 average spend",
                "strengths": ["Trendsetting fast-fashion rotation", "Clean and premium store navigation", "Strong membership club program"],
                "weaknesses": ["Inconsistent sizing stocks", "Long lines at trial rooms", "Slightly higher pricing than online-first brands"],
                "estimated_monthly_revenue": "INR 40,00,000"
            },
            {
                "name": "Miniso",
                "rating": 4.4,
                "price_range": "INR 150-800 average spend",
                "strengths": ["Aesthetic Japanese-styled lifestyle items", "Low price points with high impulse buys", "Prime shopping mall placements"],
                "weaknesses": ["Product quality can be fragile", "High dependency on imported stock pipelines", "Lacks functional essential items"],
                "estimated_monthly_revenue": "INR 15,00,000"
            }
        ],
        "swot": {
            "strengths": ["High visual merchandising appeal", "Direct touch-and-feel trust building", "Immediate gratification purchase cycles"],
            "weaknesses": ["High upfront lease and inventory overheads", "Heavy pressure from e-commerce competition", "Complex stock-keeping units (SKUs) tracking"],
            "opportunities": ["O2O (Online-to-Offline) scan-and-deliver options", "Curating experiential retail demo zones", "Exclusive local designer capsule collabs"],
            "threats": ["E-commerce giants (Amazon, Ajio, Myntra) price matching", "Economic downturns reducing discretionary spend", "Supply chain customs tariff delays"]
        },
        "gap_opportunity": "There is a strong opportunity for a curated lifestyle store that hosts physical events (e.g. pop-up flea markets, workshops) converting simple footfalls into high-loyalty community advocates."
    },
    "gym": {
        "competitors": [
            {
                "name": "Cult.fit",
                "rating": 4.7,
                "price_range": "INR 12,000-18,000 annual pass",
                "strengths": ["Massive fitness center network", "Fun group class formats (HRX, Yoga)", "Seamless mobile app booking integration"],
                "weaknesses": ["No traditional bodybuilding heavy equipment", "Extremely crowded during peak slots", "Trainer individual attention is limited"],
                "estimated_monthly_revenue": "INR 20,00,000"
            },
            {
                "name": "Gold's Gym",
                "rating": 4.3,
                "price_range": "INR 18,000-25,000 annual pass",
                "strengths": ["High-end strength and cardio equipment", "Experienced certified coaches", "Global brand recognition prestige"],
                "weaknesses": ["Dated interior styling in older sites", "Pushy sales pitches for personal training", "Higher pricing structure"],
                "estimated_monthly_revenue": "INR 12,00,000"
            },
            {
                "name": "Anytime Fitness",
                "rating": 4.4,
                "price_range": "INR 20,000-30,000 annual pass",
                "strengths": ["Convenient 24/7 gym floor availability", "Clean and highly modern design", "Reciprocal global membership access"],
                "weaknesses": ["Smaller floor space areas", "Higher price premium than local gyms", "Limited group class schedules"],
                "estimated_monthly_revenue": "INR 9,50,000"
            }
        ],
        "swot": {
            "strengths": ["Highly predictable monthly recurring subscription revenues", "High client lifetime value", "Strong cross-selling of health supplements"],
            "weaknesses": ["Heavy initial capital for imported gym machines", "High customer churn after first 3 months", "Equipment wear-and-tear depreciation"],
            "opportunities": ["Custom corporate wellness packages for tech parks", "Integrating in-house dietitians and juice bars", "Providing hybrid training via home stream options"],
            "threats": ["Low-priced government/public park outdoor gyms", "High density of neighborhood gyms undercutting pricing", "Injuries leading to liability claims"]
        },
        "gap_opportunity": "A premium boutique gym focusing exclusively on strength athletics (Powerlifting, Olympic weightlifting) with a cap on active members to avoid peak crowd congestion can command high membership premiums."
    },
    "salon": {
        "competitors": [
            {
                "name": "Geetanjali Salon",
                "rating": 4.5,
                "price_range": "INR 500-2000 per service",
                "strengths": ["Premium luxury branding", "Celebrity stylist roster", "High-end product lines (Kérastase, L'Oréal)"],
                "weaknesses": ["Extremely high service prices", "Lengthy wait times despite reservations", "Overpriced upselling tactics"],
                "estimated_monthly_revenue": "INR 18,00,000"
            },
            {
                "name": "Naturals Salon",
                "rating": 4.2,
                "price_range": "INR 200-800 per service",
                "strengths": ["Excellent franchise footprints", "Affordable family pricing models", "Wide spectrum of grooming services"],
                "weaknesses": ["Varied quality standards by location", "High stylist employee turnover", "Simple, basic store aesthetics"],
                "estimated_monthly_revenue": "INR 10,00,000"
            },
            {
                "name": "Toni & Guy",
                "rating": 4.4,
                "price_range": "INR 800-3000 per service",
                "strengths": ["High fashion haircut styling reputation", "Rigorous stylist education training", "Modern sleek salon designs"],
                "weaknesses": ["Often targets premium tier audiences only", "A la carte styling gets very expensive", "Lacks package discount choices"],
                "estimated_monthly_revenue": "INR 15,00,000"
            }
        ],
        "swot": {
            "strengths": ["High frequency repeat visit schedules", "High personal trust-based service loyalty", "Excellent retail product margins (20-30%)"],
            "weaknesses": ["Heavily dependent on individual star stylists", "Hygiene standard compliance requires constant audit", "High staff poaching rates"],
            "opportunities": ["Gender-neutral specialized hair styling services", "In-salon express spa treatments for tech employees", "Home grooming service app options"],
            "threats": ["Rapid rise of home-salon services (Urban Company)", "Economic downturns deferring premium treatments", "Rising commercial space lease rates"]
        },
        "gap_opportunity": "A sleek, express unisex styling bar focusing on fast, affordable, high-quality hair wash & blowouts, shaves, and quick manicures with transparent digital booking will capture busy professionals."
    }
}

def analyze_competitors(business_type: str) -> CompetitorReport:
    # Normalize input
    key = business_type.lower().strip()
    # Check if business type is in database, otherwise fall back to 'cafe'
    if key not in COMPETITOR_DATABASE:
        # Fallbacks based on keywords
        if "food" in key or "restaurant" in key or "dine" in key or "eatery" in key:
            key = "restaurant"
        elif "bake" in key or "pastry" in key or "cake" in key:
            key = "bakery"
        elif "shop" in key or "store" in key or "boutique" in key or "cloth" in key:
            key = "retail"
        elif "fit" in key or "gym" in key or "workout" in key or "crossfit" in key:
            key = "gym"
        elif "hair" in key or "salon" in key or "spa" in key or "beauty" in key:
            key = "salon"
        else:
            key = "cafe" # Default fallback
            
    data = COMPETITOR_DATABASE[key]
    competitors_list = [Competitor(**c) for c in data["competitors"]]
    return CompetitorReport(
        competitors=competitors_list,
        swot=data["swot"],
        gap_opportunity=data["gap_opportunity"]
    )
