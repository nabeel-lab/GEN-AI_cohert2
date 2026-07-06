// Pre-baked demo scenarios for judges — no Gemini calls, instant results
// Each is a complete FinalReport JSON ready to display on ResultsPage

export const DEMO_SCENARIOS = [
  {
    id: "cafe",
    label: "☕ Specialty Coffee Café",
    subtitle: "Bangalore | ₹15 Lakhs",
    report: {
      session_id: "demo-cafe-001",
      timestamp: new Date().toISOString(),
      request: {
        business_type: "cafe",
        location: "Indiranagar, Bangalore",
        budget: 1500000,
        description: "A specialty coffee café with cold brew focus, targeting young professionals and remote workers.",
      },
      business_profile: {
        business_type: "cafe",
        products: ["Premium single-origin coffee", "Cold brew concentrate", "Artisan pastries"],
        target_customers: ["Remote workers", "Students", "Coffee enthusiasts"],
        unique_value: "Focus on third-wave coffee culture and digital nomad workspace",
        risks: ["High rent in micro-markets", "Coffee bean sourcing volatility", "Barista retention"],
      },
      market_intelligence: {
        demand_score: 85,
        trend: "growing",
        top_3_trends: [
          "50%+ growth in premium cold-brew consumption in metro India",
          "Remote work driving micro-café demand",
          "Instagram-worthy café experiences driving discovery",
        ],
        seasonality: "Moderate summer dip, strong winter demand",
        market_size_estimate: "INR 12–18 Crores micro-market in Indiranagar",
        detailed_analysis: "Strong demand from the young professional demographic.",
      },
      competitors: {
        competitors: [
          {
            name: "Blue Tokai",
            rating: 4.7,
            price_range: "INR 300–500 for two",
            strengths: ["Direct trade coffee", "Roastery transparency", "Premium brand"],
            weaknesses: ["High price point", "Limited seating", "Long wait times"],
            estimated_monthly_revenue: "INR 18,00,000",
          },
        ],
        swot: {
          strengths: ["High margins", "Customer loyalty potential", "Instagram appeal"],
          weaknesses: ["Perishable inventory", "Skilled labor needed", "Rent competition"],
          opportunities: ["Subscription boxes", "B2B office supply", "Merchandise"],
          threats: ["Chain café expansion", "Inflation in coffee prices", "Delivery platform commissions"],
        },
        gap_opportunity: "Position as the premium-but-accessible third-wave café for remote workers",
      },
      location: {
        footfall_score: 88,
        competition_density: 72,
        accessibility_score: 90,
        growth_potential: 82,
        latitude: 12.9719,
        longitude: 77.6412,
      },
      finance: {
        monthly_rent_estimate: 45000,
        staff_cost_estimate: 120000,
        raw_material_cost: 27000,
        break_even_months: 8,
        projected_revenue_month_6: 280000,
        projected_revenue_month_12: 480000,
        roi_percentage: 22.5,
        profit_forecast: [
          { month: 1, revenue: 150000, cost: 192000, profit: -42000 },
          { month: 2, revenue: 185000, cost: 195000, profit: -10000 },
          { month: 3, revenue: 220000, cost: 200000, profit: 20000 },
          { month: 6, revenue: 280000, cost: 210000, profit: 70000 },
          { month: 12, revenue: 480000, cost: 250000, profit: 230000 },
        ],
      },
      personas: [
        {
          name: "Priya (Remote SWE)",
          demographics: { age: "28–35", income: "12L+", occupation: "Software engineer" },
          behaviors: ["Works 2–3 days/week from café", "High-ticket coffee spender", "Social media active"],
          pain_points: ["No reliable workspace at home", "Isolation from peers", "Limited specialty coffee"],
          needs: ["Fast WiFi", "Quiet corner seating", "Premium coffee"],
        },
      ],
      supply_chain: [
        {
          category: "Coffee beans",
          suppliers: ["Blue Tokai", "Araku Coffee", "Direct import"],
          risk_level: "Medium",
        },
      ],
      marketing: [
        {
          channel: "Instagram",
          strategy: "Daily latte-art posts, reels, influencer collabs",
          difficulty: "Easy",
        },
      ],
      risk: {
        risk_score: 45,
        risk_level: "Low",
        mitigations: [
          "Lock in rent for 3 years at fixed rate",
          "Bulk-buy coffee beans quarterly",
          "Cross-train all staff on core operations",
        ],
      },
      decision: {
        go_no_go: "GO",
        confidence_score: 78,
        business_health_score: 72,
        top_3_recommendations: [
          "Launch with 'Coffee Subscription' model for remote workers",
          "Establish direct-trade relationships with 2–3 coffee farms",
          "Create Instagram content calendar before launch",
        ],
        next_steps: {
          now: ["Secure location lease", "Hire lead barista"],
          "3_months": ["Interior design + equipment setup", "Social media campaign"],
          "6_months": ["Break-even trajectory", "Launch loyalty program"],
          "1_year": ["Expand seating area", "Introduce merchandise line"],
        },
        executive_summary:
          "The specialty café market in Bangalore is robust, with this concept capturing a gap for premium-but-accessible coffee targeting remote workers. With ₹15L budget, the café reaches break-even in month 8 and achieves 22.5% ROI in year 1.",
        top_opportunities: [
          "Subscription model (50% margin, recurring revenue)",
          "B2B corporate coffee supply to nearby tech parks",
          "Merchandise line (beans, apparel, cups)",
        ],
        biggest_risks: [
          "Commercial rent in Indiranagar rising 10–15% annually",
          "Dependency on skilled barista availability",
          "Delivery platform commission eating into margins",
        ],
        market_outlook: "Growing 15%+ annually, driven by remote work and third-wave coffee culture.",
        financial_outlook: "Conservative 22.5% ROI with low-cost CAC via organic Instagram discovery.",
        recommended_launch_window: "September–October (post-monsoon, pre-festive season peak)",
        expected_roi_summary: "22.5% in year 1; likely 35%+ in year 2 with optimizations.",
        reasoning: "Strong demand signal (85/100) and healthy margins make this viable.",
        confidence_factors: [
          "Market demand is growing (85/100 demand score)",
          "Competitive analysis shows ₹18L+ monthly revenue peers",
          "Location score 88 (excellent foot traffic + professionals)",
        ],
        key_strengths: ["Strong brand differentiation", "High-margin product", "Digital-native customer base"],
        key_weaknesses: ["Perishable inventory", "Skilled labor scarcity"],
        hidden_opportunities: ["Subscription boxes shipped nationally", "Coffee workshop events"],
        critical_risks: ["Rent inflation", "Barista burnout"],
        patterns: [
          "Strong demand despite high competition (85 demand vs. 72 density)",
          "Remote work driving micro-café footfall in tech hubs",
        ],
        score_breakdown: {
          market: 85,
          location: 88,
          finance: 65,
          competition: 28,
          risk: 55,
          customer_fit: 84,
          supply_chain: 72,
          marketing: 80,
        },
      },
    },
  },
  {
    id: "gym",
    label: "💪 Premium 24/7 Gym",
    subtitle: "Whitefield, Bangalore | ₹25 Lakhs",
    report: {
      session_id: "demo-gym-001",
      timestamp: new Date().toISOString(),
      request: {
        business_type: "gym",
        location: "Whitefield, Bangalore",
        budget: 2500000,
        description: "A premium 24/7 fitness gym with personal training and group HIIT classes targeting tech professionals.",
      },
      business_profile: {
        business_type: "gym",
        products: ["24/7 gym access", "Personal training", "Group HIIT classes"],
        target_customers: ["Tech professionals", "Fitness enthusiasts", "Time-constrained professionals"],
        unique_value: "Premium gym experience with 24/7 access and tech integration for busy professionals",
        risks: ["High equipment maintenance cost", "Staff retention in fitness industry", "Seasonal churn"],
      },
      market_intelligence: {
        demand_score: 78,
        trend: "growing",
        top_3_trends: [
          "Premium gym market growing 18%+ in tier-1 cities post-COVID",
          "Tech-enabled fitness tracking and 24/7 access as key differentiators",
          "Group fitness (HIIT, yoga) attracting younger demographics",
        ],
        seasonality: "Jan–Feb peak (New Year resolutions), summer dip (Apr–Jun)",
        market_size_estimate: "INR 8–15 Crores micro-market in Whitefield",
        detailed_analysis: "Strong demand from high-income tech workforce in Whitefield.",
      },
      competitors: {
        competitors: [
          {
            name: "Cult.fit",
            rating: 4.7,
            price_range: "₹12K–18K annual",
            strengths: ["Large network", "Fun group classes", "Mobile app"],
            weaknesses: ["Crowded during peak hours", "Limited heavy equipment"],
            estimated_monthly_revenue: "INR 20,00,000",
          },
        ],
        swot: {
          strengths: ["Recurring revenue model", "High customer lifetime value", "Premium positioning"],
          weaknesses: ["Equipment depreciation", "Staff turnover"],
          opportunities: ["Wellness coaching addon", "Nutrition programs", "Corporate memberships"],
          threats: ["Fitness-app disruption", "Home-gym trend post-COVID"],
        },
        gap_opportunity:
          "Premium 24/7 gym for busy professionals with AI coaching and sleep-tracking integration",
      },
      location: {
        footfall_score: 80,
        competition_density: 65,
        accessibility_score: 78,
        growth_potential: 90,
        latitude: 12.9698,
        longitude: 77.75,
      },
      finance: {
        monthly_rent_estimate: 90000,
        staff_cost_estimate: 225000,
        raw_material_cost: 12500,
        break_even_months: 12,
        projected_revenue_month_6: 350000,
        projected_revenue_month_12: 620000,
        roi_percentage: -49.5,
        profit_forecast: [
          { month: 1, revenue: 180000, cost: 327500, profit: -147500 },
          { month: 6, revenue: 350000, cost: 340000, profit: 10000 },
          { month: 12, revenue: 620000, cost: 370000, profit: 250000 },
        ],
      },
      personas: [
        {
          name: "Arjun (Startup Founder)",
          demographics: { age: "32–40", income: "20L+", occupation: "CTO/Founder" },
          behaviors: ["Intense 5–6 days/week gym schedule", "Premium membership paying", "Coaches trained"],
          pain_points: ["Unpredictable schedule", "Needs 24/7 access", "Value health highly"],
          needs: ["Flexible hours", "Professional coaching", "Clean, safe facility"],
        },
      ],
      supply_chain: [
        {
          category: "Gym equipment",
          suppliers: ["Johnson Health Tech", "Life Fitness", "Used equipment dealers"],
          risk_level: "Medium",
        },
      ],
      marketing: [
        {
          channel: "Google Maps",
          strategy: "Paid local search, 5-star reviews, corporate partnerships",
          difficulty: "Medium",
        },
      ],
      risk: {
        risk_score: 40,
        risk_level: "Medium",
        mitigations: [
          "Equipment warranty & maintenance contracts",
          "Tiered pricing to reduce churn",
          "Corp partnerships for stable revenue",
        ],
      },
      decision: {
        go_no_go: "PROCEED WITH CAUTION",
        confidence_score: 57,
        business_health_score: 57,
        top_3_recommendations: [
          "Lock in corporate B2B partnerships before launch (reduces churn)",
          "Invest in equipment durability over variety (lower capex ongoing)",
          "Launch with tiered memberships (budget + premium) to diversify revenue",
        ],
        next_steps: {
          now: ["Secure prime location in tech park adjacency", "Order core equipment"],
          "3_months": ["Build app + member tracking", "Hire core coaching team"],
          "6_months": ["Launch group classes", "Corporate membership drive"],
          "1_year": ["Audit full P&L", "Consider expansion to adjacent tech parks"],
        },
        executive_summary:
          "Premium 24/7 gym in Whitefield targets high-income tech professionals. Year-1 ROI is negative (-49.5%) due to high capex & staffing, but month 12 profitability signals strong unit economics post-break-even.",
        top_opportunities: [
          "Corporate memberships (3–5 Lakhs/company annually)",
          "Wellness coaching addon services",
          "Sleep + nutrition tracking integration",
        ],
        biggest_risks: [
          "Member churn during monsoon/summer (seasonal fitness drop)",
          "Intense competition from Cult.fit and Gold's Gym",
          "High depreciation on cardio/strength equipment",
        ],
        market_outlook: "18%+ growth in premium gym segment; 24/7 and tech integration are key differentiators.",
        financial_outlook:
          "Year 1 is investment-heavy (-49.5% ROI), but 2–3 year horizon shows 35–50% margins once equipment fully depreciated.",
        recommended_launch_window: "December–January (New Year resolution wave)",
        expected_roi_summary: "Negative year 1; breakeven month 12; then 40%+ growth yr 2–3.",
        reasoning: "Strong market demand but high initial capex + staffing costs make this a capital-intensive play.",
        confidence_factors: [
          "Growing 18%+ market (78 demand)",
          "Tech park adjacency ensures high engagement",
          "Corporate partnerships de-risk churn",
        ],
        key_strengths: ["Prime location", "Recurring revenue", "Corporate anchor potential"],
        key_weaknesses: ["High capex", "Staff-intensive operations", "Seasonal churn"],
        hidden_opportunities: [
          "Sleep-tracking partnerships (Oura Ring, Apple Watch sync)",
          "Virtual coaching to scale beyond location",
        ],
        critical_risks: ["Member churn > 5%/month", "Equipment breakdown during peak hours"],
        patterns: [
          "Capital-intensive businesses need 12–18 month runway",
          "Corporate partnerships critical to reduce churn",
        ],
        score_breakdown: {
          market: 78,
          location: 86,
          finance: 0,
          competition: 28,
          risk: 60,
          customer_fit: 82,
          supply_chain: 68,
          marketing: 65,
        },
      },
    },
  },
  {
    id: "restaurant",
    label: "🍽️ Casual Dining Restaurant",
    subtitle: "Koramangala, Bangalore | ₹30 Lakhs",
    report: {
      session_id: "demo-restaurant-001",
      timestamp: new Date().toISOString(),
      request: {
        business_type: "restaurant",
        location: "Koramangala, Bangalore",
        budget: 3000000,
        description: "A casual dining restaurant focusing on regional Indian cuisine with a modern twist.",
      },
      business_profile: {
        business_type: "restaurant",
        products: ["Regional Indian cuisine", "Set meals", "Alcohol service"],
        target_customers: ["Young professionals", "Families", "Food enthusiasts"],
        unique_value: "Modern twist on traditional regional Indian cuisine in a casual, Instagram-friendly setting",
        risks: ["Fluctuating food costs", "Staff turnover in F&B", "Delivery platform dependence"],
      },
      market_intelligence: {
        demand_score: 88,
        trend: "growing",
        top_3_trends: [
          "Regional Indian cuisine renaissance in metro India",
          "Casual dining (₹400–600 per head) outgrowing fine dining",
          "Delivery platforms driving 40%+ of restaurant orders",
        ],
        seasonality: "Peak in monsoon (booths, cozy seating appeal), dip in summer",
        market_size_estimate: "INR 25–35 Crores micro-market in Koramangala",
        detailed_analysis: "Extremely strong market fundamentals with proven consumer interest.",
      },
      competitors: {
        competitors: [
          {
            name: "Chikhalwali",
            rating: 4.5,
            price_range: "₹350–450 per head",
            strengths: ["Authentic recipes", "Casual vibe", "Affordable"],
            weaknesses: ["Limited seating", "Slow service during peak"],
            estimated_monthly_revenue: "INR 22,00,000",
          },
        ],
        swot: {
          strengths: ["High volume potential", "Delivery channel scale", "Food cost leverage"],
          weaknesses: ["Tight margins", "Staff-dependent quality", "Lease risk"],
          opportunities: ["Cloud kitchen expansion", "Catering for events", "Franchising"],
          threats: ["Delivery commission erosion", "Food inflation", "New entrants"],
        },
        gap_opportunity:
          "Modern casual regional dining with consistent quality and strong digital presence in Koramangala's food hub",
      },
      location: {
        footfall_score: 95,
        competition_density: 90,
        accessibility_score: 85,
        growth_potential: 80,
        latitude: 12.9352,
        longitude: 77.6245,
      },
      finance: {
        monthly_rent_estimate: 85000,
        staff_cost_estimate: 180000,
        raw_material_cost: 128000,
        break_even_months: 6,
        projected_revenue_month_6: 420000,
        projected_revenue_month_12: 750000,
        roi_percentage: 18.5,
        profit_forecast: [
          { month: 1, revenue: 250000, cost: 293000, profit: -43000 },
          { month: 3, revenue: 350000, cost: 310000, profit: 40000 },
          { month: 6, revenue: 420000, cost: 330000, profit: 90000 },
          { month: 12, revenue: 750000, cost: 380000, profit: 370000 },
        ],
      },
      personas: [
        {
          name: "Divya (Marketing Manager)",
          demographics: { age: "26–32", income: "10L–15L", occupation: "Marketing professional" },
          behaviors: ["Eats out 3–4x weekly", "Shares on Instagram", "Orders via delivery"],
          pain_points: ["Limited healthy options", "Inconsistent quality", "Service delays"],
          needs: ["Fast service", "Quality food", "Instagram-worthy plating"],
        },
      ],
      supply_chain: [
        {
          category: "Fresh produce & spices",
          suppliers: ["Local mandis", "Wholesale vendors", "Organic farms"],
          risk_level: "High",
        },
      ],
      marketing: [
        {
          channel: "Instagram + Delivery",
          strategy: "Daily food reels, influencer collabs, delivery platform optimization",
          difficulty: "Easy",
        },
      ],
      risk: {
        risk_score: 35,
        risk_level: "Low",
        mitigations: [
          "Negotiate long-term supply contracts",
          "Cross-train kitchen staff",
          "Monitor delivery platform algorithms monthly",
        ],
      },
      decision: {
        go_no_go: "GO",
        confidence_score: 82,
        business_health_score: 76,
        top_3_recommendations: [
          "Lock in supplier agreements for spices + produce (3-month forward)",
          "Launch on Swiggy + Zomato day 1 (40%+ of orders expected)",
          "Create rotating 'Regional Special' menu to drive repeat visits",
        ],
        next_steps: {
          now: ["Negotiate 5-year lease", "Finalize menu with test kitchen"],
          "3_months": ["Interior fit-out", "Hire head chef + kitchen team"],
          "6_months": ["Soft opening + reviews", "Optimize supply chain"],
          "1_year": ["Achieve break-even", "Plan catering/cloud kitchen expansion"],
        },
        executive_summary:
          "Casual dining restaurant in Koramangala (highest footfall location in Bangalore) with modern regional Indian concept. Projects 18.5% ROI with break-even in month 6.",
        top_opportunities: [
          "Delivery-only 'cloud kitchen' 2nd location (lower capex)",
          "Catering for corporate + wedding events (10–15% margin uplift)",
          "Franchising model (already proven concept)",
        ],
        biggest_risks: [
          "Food cost inflation eroding margins",
          "Delivery platform commission increasing to 35%+",
          "Competitive restaurant openings in Koramangala",
        ],
        market_outlook:
          "Casual dining growing 12%+ annually; delivery platforms consolidating but stable for established restaurants.",
        financial_outlook:
          "Year 1 solid at 18.5% ROI; year 2–3 margins improve as operations optimize and scale.",
        recommended_launch_window: "June–July (monsoon, stable supply chains post-monsoon)",
        expected_roi_summary: "18.5% in year 1; 30%+ in year 2 with scale and optimization.",
        reasoning: "Koramangala is the safest restaurant location in Bangalore with proven demand.",
        confidence_factors: [
          "Highest demand score (88/100) for restaurants in city",
          "Proven competitors doing ₹20L+ monthly",
          "Koramangala is the #1 food destination in Bangalore",
        ],
        key_strengths: ["Prime location", "Strong demand", "Proven concept"],
        key_weaknesses: ["Intense competition", "Thin margins", "Staff-dependent quality"],
        hidden_opportunities: [
          "Alcohol license upsell (30%+ margin improvement)",
          "Private dining events premium positioning",
        ],
        critical_risks: ["Food poisoning incident", "Staff turnover during service"],
        patterns: [
          "Restaurants in food hubs (Koramangala) break even 6 months vs. 12 months elsewhere",
          "Delivery platforms now critical (40%+ of orders)",
        ],
        score_breakdown: {
          market: 88,
          location: 95,
          finance: 65,
          competition: 10,
          risk: 65,
          customer_fit: 88,
          supply_chain: 45,
          marketing: 85,
        },
      },
    },
  },
];

export function getDemoScenarioById(id) {
  return DEMO_SCENARIOS.find((s) => s.id === id);
}

export function getDemoScenarioByIndex(index) {
  return DEMO_SCENARIOS[index % DEMO_SCENARIOS.length];
}
