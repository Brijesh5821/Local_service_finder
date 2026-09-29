from datetime import datetime
from pymongo import ASCENDING
from app.database.connection import db

def initialize_database():
    # 1. Ensure all required collections exist
    required_collections = [
        "users",
        "categories",
        "services",
        "bookings",
        "reviews",
        "payments",
        "notifications"
    ]
    
    existing_collections = db.list_collection_names()
    for col in required_collections:
        if col not in existing_collections:
            db.create_collection(col)

    # Ensure recommended indexes automatically
    # users indexes
    db.users.create_index([("email", ASCENDING)], unique=True)
    db.users.create_index([("phone", ASCENDING)], unique=True)
    db.users.create_index([("role", ASCENDING)])
    db.users.create_index([("provider_category", ASCENDING)])
    db.users.create_index([("location", "2dsphere")])

    # services indexes
    db.services.create_index([("provider_id", ASCENDING)])
    db.services.create_index([("category_id", ASCENDING)])
    db.services.create_index([("status", ASCENDING)])
    db.services.create_index([("location", "2dsphere")])

    # bookings indexes
    db.bookings.create_index([("customer_id", ASCENDING)])
    db.bookings.create_index([("provider_id", ASCENDING)])
    db.bookings.create_index([("service_id", ASCENDING)])
    db.bookings.create_index([("booking_status", ASCENDING)])

    # reviews indexes
    db.reviews.create_index([("provider_id", ASCENDING)])
    db.reviews.create_index([("service_id", ASCENDING)])

    # payments indexes
    db.payments.create_index([("booking_id", ASCENDING)])
    db.payments.create_index([("payment_status", ASCENDING)])

    # 3. Insert default categories if they do not already exist
    default_categories = [
        "Plumber",
        "Electrician",
        "Painter",
        "Carpenter",
        "Cleaning",
        "AC Repair",
        "Beautician",
        "Appliance Repair",
        "Home Tutor",
        "Mechanic",
        "Photographer",
        "Driver",
        "Gardener",
        "Cook",
        "Pest Control",
        "Laptop Repair",
        "Mobile Repair",
        "RO Water Purifier",
        "Interior Designer",
        "Packers & Movers"
    ]

    for cat_name in default_categories:
        if not db.categories.find_one({"category_name": cat_name}):
            db.categories.insert_one({
                "category_name": cat_name,
                "icon": cat_name.lower().replace(" ", "_").replace("&", "and"),
                "image": f"https://placeholder.localfinder.com/categories/{cat_name.lower().replace(' ', '_').replace('&', 'and')}.jpg",
                "description": f"Professional {cat_name} services",
                "is_active": True,
                "created_at": datetime.utcnow()
            })

    # 3.5 Seed initial approved service providers if none exist
    if db.users.count_documents({"role": {"$in": ["Provider", "provider"]}}) == 0:
        from app.config.security import hash_password
        default_providers = [
            {
                "full_name": "Alex Rivera",
                "email": "alex.rivera@example.com",
                "phone": "9876543210",
                "password": hash_password("provider123"),
                "role": "Provider",
                "provider_category": "Electrician",
                "hourly_rate": 65.0,
                "average_rating": 4.9,
                "review_count": 142,
                "description": "Specialist in smart home integration & safety audits.",
                "profile_image": "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
                "city": "Ahmedabad",
                "is_active": True,
                "status": "active",
                "account_status": "approved",
                "created_at": datetime.utcnow()
            },
            {
                "full_name": "Maria Santos",
                "email": "maria.santos@example.com",
                "phone": "9876543211",
                "password": hash_password("provider123"),
                "role": "Provider",
                "provider_category": "Cleaning",
                "hourly_rate": 40.0,
                "average_rating": 5.0,
                "review_count": 310,
                "description": "Eco-friendly deep cleaning & post-construction setup.",
                "profile_image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
                "city": "Ahmedabad",
                "is_active": True,
                "status": "active",
                "account_status": "approved",
                "created_at": datetime.utcnow()
            },
            {
                "full_name": "David Miller",
                "email": "david.miller@example.com",
                "phone": "9876543212",
                "password": hash_password("provider123"),
                "role": "Provider",
                "provider_category": "Plumber",
                "hourly_rate": 75.0,
                "average_rating": 4.8,
                "review_count": 98,
                "description": "Emergency leaks, drain cleaning, and water heater installs.",
                "profile_image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
                "city": "Ahmedabad",
                "is_active": True,
                "status": "active",
                "account_status": "approved",
                "created_at": datetime.utcnow()
            }
        ]
        db.users.insert_many(default_providers)

    # 4. Seed services mapped to providers if the services collection is empty
    if db.services.count_documents({}) == 0:
        providers = list(db.users.find({"role": {"$in": ["Provider", "provider"]}}))
        
        default_services_map = {
            "AC Repair": [
                {
                    "title": "AC Split/Window Service & Deep Clean",
                    "description": "Thorough jet-pump cleaning of outdoor/indoor units, filter cleaning, and pressure checks.",
                    "price": "$$",
                    "price_value": 250.0
                },
                {
                    "title": "AC Installation & Gas Refill",
                    "description": "Standard split or window AC installation with copper piping support, gas pressure check and topping up.",
                    "price": "$$$",
                    "price_value": 450.0
                }
            ],
            "Cleaning": [
                {
                    "title": "Full Home Deep Cleaning",
                    "description": "Complete dusting, vacuuming, floor scrubbing, bathroom and kitchen deep sanitization.",
                    "price": "$$",
                    "price_value": 150.0
                },
                {
                    "title": "Bathroom & Kitchen Sanitization",
                    "description": "Targeted stain removal, oil/grease cleanup, floor polishing, and acid wash for clean tiles.",
                    "price": "$",
                    "price_value": 90.0
                }
            ],
            "Plumber": [
                {
                    "title": "Leak Detection & Pipe Repair",
                    "description": "Locate hidden water leakage and repair pipelines, kitchen sinks, or shower joints.",
                    "price": "$$",
                    "price_value": 200.0
                },
                {
                    "title": "Tap, Shower & Commode Fittings",
                    "description": "Install or replace premium bathroom fittings, shower heads, flush tanks, or kitchen taps.",
                    "price": "$$",
                    "price_value": 180.0
                }
            ],
            "Electrician": [
                {
                    "title": "Short Circuit & Fault Repair",
                    "description": "Locate tripping MCBs, burnt wires, and fix electrical supply outages safely.",
                    "price": "$$",
                    "price_value": 160.0
                },
                {
                    "title": "Light & Fan Smart Installations",
                    "description": "Mount new fans, LED tube lights, fancy chandeliers, and configure smart home switches.",
                    "price": "$",
                    "price_value": 80.0
                }
            ]
        }
        
        for provider in providers:
            category = provider.get("provider_category", "Home Services") or "Home Services"
            services_to_add = default_services_map.get(category, [
                {
                    "title": f"Professional {category} Work",
                    "description": f"Quality {category} service from certified professionals.",
                    "price": "$$",
                    "price_value": provider.get("hourly_rate") or 150.0
                }
            ])
            
            for s in services_to_add:
                db.services.insert_one({
                    "title": s["title"],
                    "description": s["description"],
                    "category_name": category,
                    "provider_id": str(provider["_id"]),
                    "provider_name": provider.get("full_name", "Service Pro"),
                    "provider_image": provider.get("profile_image", ""),
                    "price": s["price"],
                    "price_value": s["price_value"],
                    "status": "active",
                    "average_rating": provider.get("average_rating") or 4.5,
                    "city": provider.get("city", "Surendranagar"),
                    "availability": provider.get("availability"),
                    "created_at": datetime.utcnow()
                })

    # 5. Seed default admin if not exists
    if not db.users.find_one({"email": "admin@gmail.com"}):
        from app.config.security import hash_password
        db.users.insert_one({
            "full_name": "System Admin",
            "email": "admin@gmail.com",
            "phone": "9999999988",
            "password": hash_password("admin123"),
            "role": "Admin",
            "is_active": True,
            "status": "active",
            "account_status": "approved",
            "created_at": datetime.utcnow()
        })

    # 6. One-time migration to ensure all users have account_status
    for u in db.users.find({"account_status": {"$exists": False}}):
        role_lower = u.get("role", "User").lower()
        status_val = u.get("status")
        if role_lower == "admin":
            acc_status = "approved"
        elif status_val == "suspended":
            acc_status = "suspended"
        elif status_val == "active":
            acc_status = "approved"
        else:
            acc_status = "approved" # default fallback for existing test accounts
        
        db.users.update_one(
            {"_id": u["_id"]},
            {"$set": {"account_status": acc_status}}
        )

    # 7. Seed initial customer reviews if none exist
    if db.reviews.count_documents({}) == 0:
        default_reviews = [
            {
                "customer_name": "Riyu Patel",
                "customer_role": "Verified Customer",
                "rating": 5,
                "review_text": "The service provider arrived exactly on time and repaired the fixture in 30 minutes! Highly professional work.",
                "created_at": datetime.utcnow()
            },
            {
                "customer_name": "Aarav Sharma",
                "customer_role": "Homeowner",
                "rating": 5,
                "review_text": "Deep cleaning service was incredible. The team brought their own tools and left the house sparkling clean.",
                "created_at": datetime.utcnow()
            },
            {
                "customer_name": "Priya Mehta",
                "customer_role": "Apartment Tenant",
                "rating": 5,
                "review_text": "Amazing service. Finding a certified technician for a quick fixture replacement took me less than 2 minutes.",
                "created_at": datetime.utcnow()
            }
        ]
        db.reviews.insert_many(default_reviews)



