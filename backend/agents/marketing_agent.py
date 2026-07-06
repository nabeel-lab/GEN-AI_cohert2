from typing import List, Dict
from models import MarketingCampaign

MARKETING_DATABASE: Dict[str, List[Dict[str, str]]] = {
    "cafe": [
        {"channel": "Instagram & Meta Local Ads", "strategy": "Target foodies within 3km radius with high-quality visual reels of pour-over prep and latte art.", "difficulty": "Easy"},
        {"channel": "Influencer Launch Invites", "strategy": "Host an exclusive 'Pre-opening Tasting Day' for local food bloggers and lifestyle micro-influencers.", "difficulty": "Medium"},
        {"channel": "Offline Footfall Campaign", "strategy": "Distribute premium discount vouchers and free espresso cards to local offices and co-working spaces.", "difficulty": "Easy"},
        {"channel": "Viral Mug Challenge", "strategy": "Initiate a social media campaign where customers share their quirky coffee cup expressions for free cookie rewards.", "difficulty": "Medium"}
    ],
    "bakery": [
        {"channel": "Aromatherapic Offline Push", "strategy": "Leverage natural baking scent blowers near store front to attract street foot traffic during fresh oven cycles.", "difficulty": "Medium"},
        {"channel": "Google Business Profile Optimization", "strategy": "Dominate local searches for 'fresh bread near me' by maintaining active review generation incentives.", "difficulty": "Easy"},
        {"channel": "Festival Gift Hampers Promotion", "strategy": "Launch pre-orders for premium Diwali/Christmas corporate gifting baskets 6 weeks early.", "difficulty": "Hard"},
        {"channel": "Sourdough Masterclass Events", "strategy": "Host weekend bread-making workshops to establish local baking domain authority.", "difficulty": "Medium"}
    ],
    "restaurant": [
        {"channel": "Food Aggregator Optimization (Zomato/Swiggy)", "strategy": "Run high-visibility bids during launch month to boost search presence and reviews.", "difficulty": "Medium"},
        {"channel": "Corporate lunch ties", "strategy": "Pitch pre-paid lunch combos and meal passes directly to HR representatives of nearby tech parks.", "difficulty": "Hard"},
        {"channel": "Grand Launch Event", "strategy": "Offer a buy-one-get-one-free promotional dinner on opening weekend to create immediate hype.", "difficulty": "Easy"},
        {"channel": "Viral Secret Menu Item", "strategy": "Create a highly visual, photogenic 'under-the-radar' dish only orderable via Instagram DM codes.", "difficulty": "Medium"}
    ],
    "retail": [
        {"channel": "In-Store Pop-Up Events", "strategy": "Partner with local organic drink brands to host mini weekend launch markets to drive footfall.", "difficulty": "Medium"},
        {"channel": "Hyper-local Reels & TikToks", "strategy": "Showcase behind-the-scenes product curations and styling tips using trending audio tracks.", "difficulty": "Easy"},
        {"channel": "Launch Discount Incentives", "strategy": "Provide an immediate 15% discount for customers subscribing to SMS/WhatsApp updates at checkout.", "difficulty": "Easy"},
        {"channel": "Eco-conscious Bag Trade-in", "strategy": "Offer discounts to customers returning old clothing or shopping bags to build sustainable goodwill.", "difficulty": "Medium"}
    ],
    "gym": [
        {"channel": "Corporate Wellness Bundles", "strategy": "Partner with tech corporates to offer bulk gym membership subsidies directly deducted from employee salaries.", "difficulty": "Hard"},
        {"channel": "Early-Bird Membership Discounts", "strategy": "Sell discounted pre-launch annual memberships before the gym equipment is fully installed.", "difficulty": "Medium"},
        {"channel": "Free 3-Day Guest Passes", "strategy": "Distribute guest passes via local societies and apartments for trial runs.", "difficulty": "Easy"},
        {"channel": "Local Transformation Challenge", "strategy": "Run a 60-day body transformation program with cash prizes to build client testimonials.", "difficulty": "Hard"}
    ],
    "salon": [
        {"channel": "Local Apartment Partnerships", "strategy": "Distribute resident-only discount pamphlets directly to letterboxes in premium societies.", "difficulty": "Easy"},
        {"channel": "Influencer Makeover Reels", "strategy": "Film transformational before-and-after styling videos with popular local beauty influencers.", "difficulty": "Medium"},
        {"channel": "First-Visit Welcoming Offers", "strategy": "Offer a complimentary head massage or manicure with any premium haircut on the first visit.", "difficulty": "Easy"},
        {"channel": "WhatsApp Booking Loyalty Hub", "strategy": "Create a seamless WhatsApp scheduling automation offering reward points for booking repeat visits.", "difficulty": "Medium"}
    ]
}

def get_marketing(business_type: str) -> List[MarketingCampaign]:
    key = business_type.lower().strip()
    if key not in MARKETING_DATABASE:
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
            
    campaigns = MARKETING_DATABASE[key]
    return [MarketingCampaign(**c) for c in campaigns]
