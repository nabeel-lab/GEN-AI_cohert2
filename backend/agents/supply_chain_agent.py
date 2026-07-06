from typing import List, Dict, Any
from models import SupplyChainItem

SUPPLY_DATABASE: Dict[str, List[Dict[str, Any]]] = {
    "cafe": [
        {"category": "Specialty Coffee Beans", "suppliers": ["Araku Coffee B2B", "Blue Tokai Roasters wholesale", "Chikmagalur Growers Collective"], "risk_level": "Low"},
        {"category": "Commercial Espresso Machines", "suppliers": ["La Marzocco India", "Nuova Simonelli distributors", "Astoria India"], "risk_level": "Medium"},
        {"category": "Dairy & Milk Alternatives", "suppliers": ["Nandini Dairy", "Milky Mist", "Sofit (Oat/Soy wholesale)"], "risk_level": "Low"},
        {"category": "Eco-friendly Packaging", "suppliers": ["BioPak India", "Pappco Greenware", "Ecoware wholesale"], "risk_level": "Low"}
    ],
    "bakery": [
        {"category": "Artisanal Flour & Grains", "suppliers": ["Twin Birds Flour Mills", "Pillsbury Professional", "Organic Tattva"], "risk_level": "Low"},
        {"category": "Baking Ovens & Proofers", "suppliers": ["Unox India", "Rational India", "Sveba Dahlen distributors"], "risk_level": "High"},
        {"category": "Dairy, Butter & Cream", "suppliers": ["Amul B2B", "Mother Dairy wholesale", "President Butter India"], "risk_level": "Low"},
        {"category": "Cake Decoration & Cocoa", "suppliers": ["Callebaut India", "Morde Chocolate", "Puratos India"], "risk_level": "Medium"}
    ],
    "restaurant": [
        {"category": "Fresh Produce & Vegetables", "suppliers": ["Ninjacart", "WayCool B2B", "Local APMC Mandi contract"], "risk_level": "Medium"},
        {"category": "Poultry, Seafood & Meat", "suppliers": ["Licious Business", "FreshToHome B2B", "Local certified vendors"], "risk_level": "Medium"},
        {"category": "Kitchen Commercial Equipment", "suppliers": ["Fagor Professional India", "Hobart India", "Continental Equipment"], "risk_level": "High"},
        {"category": "Pantry Staples & Oils", "suppliers": ["Adani Wilmar wholesale", "Metro Cash & Carry", "Reliance Retail B2B"], "risk_level": "Low"}
    ],
    "retail": [
        {"category": "Apparel & Textiles", "suppliers": ["Tirupur Garment Hub", "Surat Textile market contracts", "Ludhiana knitwear manufacturers"], "risk_level": "Medium"},
        {"category": "Store Racks & Visual Display", "suppliers": ["Instor India", "Slotco Steel", "Local custom carpentry"], "risk_level": "Low"},
        {"category": "Point of Sale (POS) Systems", "suppliers": ["Posiflex India", "Epson printers wholesale", "Petpooja / Shopify POS"], "risk_level": "Low"},
        {"category": "Branded Retail Bags", "suppliers": ["Schumann Packaging", "Bella bags wholesale", "Local recycled paper manufacturers"], "risk_level": "Low"}
    ],
    "gym": [
        {"category": "Strength Training Machines", "suppliers": ["Jerai Fitness", "Jerai Commercial", "Being Strong India"], "risk_level": "Medium"},
        {"category": "Premium Cardio Equipment", "suppliers": ["Life Fitness India", "Precor India", "Matrix Fitness wholesale"], "risk_level": "High"},
        {"category": "Rubber Gym Flooring", "suppliers": ["Neoflex India", "Aerolite floors", "Local industrial rubber suppliers"], "risk_level": "Low"},
        {"category": "Access Control & Gym Software", "suppliers": ["BioEnable", "Matrix Access systems", "Fitternity / Gympic B2B"], "risk_level": "Low"}
    ],
    "salon": [
        {"category": "Hair Care Products", "suppliers": ["L'Oréal Professionnel India", "Schwarzkopf Professional", "Wella Professionals"], "risk_level": "Low"},
        {"category": "Skin & Aesthetic Products", "suppliers": ["Dermalogica India", "O3+ Professional", "Cheryl's Cosmeceuticals"], "risk_level": "Low"},
        {"category": "Salon Chairs & Furniture", "suppliers": ["Marc Salon Furniture", "Ikonic Professional B2B", "Esthetic India"], "risk_level": "Medium"},
        {"category": "Grooming Tools & Dryers", "suppliers": ["Ikonic tools wholesale", "Wahl India", "Dyson Professional"], "risk_level": "Low"}
    ]
}

def get_supply_chain(business_type: str) -> List[SupplyChainItem]:
    key = business_type.lower().strip()
    if key not in SUPPLY_DATABASE:
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
            key = "cafe"
            
    items = SUPPLY_DATABASE[key]
    return [SupplyChainItem(**i) for i in items]
