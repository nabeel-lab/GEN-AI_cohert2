from typing import List, Dict, Any
from models import CustomerPersona

PERSONA_DATABASE: Dict[str, List[Dict[str, Any]]] = {
    "cafe": [
        {
            "name": "Wired WFH Vikram",
            "demographics": {"age": "26", "occupation": "Software Engineer", "income": "INR 1.2L / month"},
            "behaviors": ["Works from cafes 3 days a week", "Orders premium pour-overs", "Spends 4+ hours per visit"],
            "pain_points": ["Slow Wi-Fi disconnections", "Lack of charging slots near tables", "Noisy environments during meetings"],
            "needs": ["High-speed robust Wi-Fi", "Quiet corners or call booths", "Healthy quick lunch options"]
        },
        {
            "name": "Socializing Sneha",
            "demographics": {"age": "21", "occupation": "College Student", "income": "INR 15k allowance"},
            "behaviors": ["Meets friends at cafes daily", "Active Instagram poster", "Looks for budget combos"],
            "pain_points": ["Expensive coffee items", "Un-aesthetic dull lighting", "Strict rules against photo-taking"],
            "needs": ["Instagrammable aesthetics", "Affordable college discounts", "Shareable snack platters"]
        },
        {
            "name": "Corporate Consultant Kabir",
            "demographics": {"age": "38", "occupation": "Management Consultant", "income": "INR 2.5L / month"},
            "behaviors": ["Holds client catch-ups at upscale cafes", "Prefers premium espresso/cortado", "Values parking space"],
            "pain_points": ["Difficulty finding valet/parking", "Slow invoice bill generation", "Lack of professional ambience"],
            "needs": ["Premium quiet seating", "Ample parking/valet options", "Express billing services"]
        }
    ],
    "bakery": [
        {
            "name": "Healthy Mother Meera",
            "demographics": {"age": "34", "occupation": "Marketing Director", "income": "INR 1.8L / month"},
            "behaviors": ["Buys weekly sourdough bread", "Selects organic ingredients", "Treats kids to sugar-free pastries"],
            "pain_points": ["High sugar levels in standard items", "Presence of artificial preservatives", "Lack of allergen labeling"],
            "needs": ["Gluten-free and sugar-free options", "Organic and clean ingredients", "Clear nutrition disclosures"]
        },
        {
            "name": "Gifting Gourmet Gautham",
            "demographics": {"age": "29", "occupation": "UX Designer", "income": "INR 95k / month"},
            "behaviors": ["Buys premium gift hampers", "Orders custom cakes for parties", "Seeks unique bakery flavors"],
            "pain_points": ["Boring cookie gift designs", "Poor packaging causing damage in transit", "Inability to schedule late deliveries"],
            "needs": ["Premium premium aesthetic boxes", "Custom customized cake consultations", "Reliable door delivery options"]
        },
        {
            "name": "Budget Bread Rohan",
            "demographics": {"age": "23", "occupation": "Junior Accountant", "income": "INR 45k / month"},
            "behaviors": ["Buys daily white/brown bread loaves", "Prefers quick takeaway counters", "Looks for evening discount sales"],
            "pain_points": ["High prices for standard bread", "Long queues during morning hours", "Stale evening stocks"],
            "needs": ["Affordable daily staple prices", "Express takeaway counters", "Fresh morning bakes"]
        }
    ],
    "restaurant": [
        {
            "name": "Family Feast Farhan",
            "demographics": {"age": "42", "occupation": "Business Owner", "income": "INR 3.0L / month"},
            "behaviors": ["Dines out with family on weekends", "Orders classic sharing platters", "Values child-friendly spots"],
            "pain_points": ["Long weekend table waits", "Restless children in tight spaces", "Lack of clean family washrooms"],
            "needs": ["Spacious seating allocations", "Kids play zone or highchairs", "Prior reservation booking options"]
        },
        {
            "name": "Foodie Influencer Isha",
            "demographics": {"age": "24", "occupation": "Content Creator", "income": "INR 80k / month"},
            "behaviors": ["Tries brand new restaurants weekly", "Films food tasting reels", "Prefers experimental fusion dishes"],
            "pain_points": ["Poor plate lighting", "Standard boring menu presentations", "Rude staff interrupting filming"],
            "needs": ["Bright, warm interior lighting", "Creative artistic food styling", "Invitations to exclusive tastings"]
        },
        {
            "name": "Executive Dinner Divya",
            "demographics": {"age": "35", "occupation": "Tech VP", "income": "INR 4.0L / month"},
            "behaviors": ["Hosts corporate dinners", "Orders fine wines and spirits", "Demands high service standards"],
            "pain_points": ["Noisy and chaotic main dining floors", "Inattentive staff during critical meetings", "Unprofessional guest hosting"],
            "needs": ["Private dining rooms (PDR)", "Highly trained dedicated staff", "Premium corporate billing options"]
        }
    ],
    "retail": [
        {
            "name": "Smart Shopper Shruti",
            "demographics": {"age": "30", "occupation": "HR Manager", "income": "INR 90k / month"},
            "behaviors": ["Compares prices online before buying", "Visits stores for fit/quality check", "Buys during sales"],
            "pain_points": ["Pushy showroom sales executives", "Mismatched online/offline pricing", "Out-of-stock retail sizes"],
            "needs": ["Transparent price matching", "No-pressure shopping layout", "Easy in-store click-to-home orders"]
        },
        {
            "name": "Trendset Setter Tarun",
            "demographics": {"age": "22", "occupation": "Fashion Student", "income": "INR 25k allowance"},
            "behaviors": ["Buys streetwear drops immediately", "Follows viral TikTok/Insta styles", "Resells capsule pieces"],
            "pain_points": ["Slow arrival of international trends", "Lacks local unique designs", "High price tags on fresh drops"],
            "needs": ["Fast fashion stock turnaround", "Limited edition collaborations", "Affordable style alternatives"]
        },
        {
            "name": "Aesthetic Collector Amit",
            "demographics": {"age": "36", "occupation": "Architect", "income": "INR 1.6L / month"},
            "behaviors": ["Buys high-end minimal home decor", "Prefers indie boutique brands", "Appreciates sustainable goods"],
            "pain_points": ["Generic mass-manufactured plastics", "Lack of origin sustainability details", "Cluttered un-organized store layouts"],
            "needs": ["Eco-friendly organic materials", "Minimalist visual merchandising", "Story-driven brand cards"]
        }
    ],
    "gym": [
        {
            "name": "Busy Builder Balaji",
            "demographics": {"age": "31", "occupation": "Project Manager", "income": "INR 1.1L / month"},
            "behaviors": ["Workouts 5 AM before office", "Focuses on heavy strength lifting", "Drinks daily protein shakes"],
            "pain_points": ["Gym not open early enough", "Waiting for squat racks at peak hours", "Broken/out-of-order machines"],
            "needs": ["Early morning 5 AM opening", "Multiple heavy power rack zones", "Prompt equipment maintenance"]
        },
        {
            "name": "Cardio Queen Kavya",
            "demographics": {"age": "28", "occupation": "Data Analyst", "income": "INR 75k / month"},
            "behaviors": ["Attends group Zumba/Spin classes", "Uses smart fitness track apps", "Prefers clean shower areas"],
            "pain_points": ["Smelly/dirty locker shower rooms", "Repetitive boring class formats", "Uncertified pushy gym trainers"],
            "needs": ["Immaculately clean facilities", "Dynamic engaging class formats", "Easy mobile booking interfaces"]
        },
        {
            "name": "Senior Active Suresh",
            "demographics": {"age": "62", "occupation": "Retired Professor", "income": "INR 50k pension"},
            "behaviors": ["Exercises daily for mobility/joints", "Prefers guided stretching", "Socializes with gym peers"],
            "pain_points": ["Loud blaring EDM background music", "Heavy crowds of teenagers", "Intimidating complex machine setups"],
            "needs": ["Gentle mobility programs", "Low-noise workout timeslots", "Attentive supportive coach staff"]
        }
    ],
    "salon": [
        {
            "name": "Groomed Gent Gaurav",
            "demographics": {"age": "29", "occupation": "Sales Director", "income": "INR 1.3L / month"},
            "behaviors": ["Gets haircuts every 2 weeks", "Orders custom beard styling", "Uses premium hair clays"],
            "pain_points": ["Inconsistent cuts by random stylists", "Long walk-in queue times", "Basic layout lacks male focus"],
            "needs": ["Stylist booking retention", "Express shave packages", "Relaxed premium grooming chair"]
        },
        {
            "name": "Pampered Princess Priyanka",
            "demographics": {"age": "27", "occupation": "Publicist", "income": "INR 85k / month"},
            "behaviors": ["Gets monthly express facials/nails", "Hosts bridal shower spa groups", "Asks for organic products"],
            "pain_points": ["Loud conversation overlaps", "Harsh chemical smells", "Rushed low-quality massage steps"],
            "needs": ["Calming spa partitions", "Premium clean aromatherapy", "Loyalty packages discounts"]
        },
        {
            "name": "Time-Poor Tanya",
            "demographics": {"age": "33", "occupation": "Startup Founder", "income": "INR 2.0L / month"},
            "behaviors": ["Gets hair-color during online calls", "Demands instant appointment slots", "Buys express products"],
            "pain_points": ["No stable desk lap tray", "Slow wifi connection", "Delayed service starts"],
            "needs": ["Workstation desk setups", "Superfast private Wi-Fi", "Double-service multitasking (nails + hair)"]
        }
    ]
}

def get_personas(business_type: str) -> List[CustomerPersona]:
    key = business_type.lower().strip()
    if key not in PERSONA_DATABASE:
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
            
    personas_data = PERSONA_DATABASE[key]
    return [CustomerPersona(**p) for p in personas_data]
