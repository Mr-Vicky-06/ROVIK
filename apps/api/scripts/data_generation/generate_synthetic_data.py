import random
import uuid
from datetime import datetime, timedelta
import pandas as pd

# Hardcoded bounding boxes for specific Indian cities
CITIES = {
    "Bangalore": {"lat_min": 12.85, "lat_max": 13.10, "lon_min": 77.45, "lon_max": 77.75},
    "Chennai":   {"lat_min": 12.90, "lat_max": 13.15, "lon_min": 80.15, "lon_max": 80.30},
    "Hyderabad": {"lat_min": 17.30, "lat_max": 17.55, "lon_min": 78.35, "lon_max": 78.60}
}

NUM_ORDERS = 50_000
NUM_RIDERS = 2_000
NUM_VEHICLES = 2_000

def get_random_location(city_name=None):
    if not city_name:
        city_name = random.choice(list(CITIES.keys()))
    bounds = CITIES[city_name]
    lat = random.uniform(bounds["lat_min"], bounds["lat_max"])
    lon = random.uniform(bounds["lon_min"], bounds["lon_max"])
    return lat, lon, city_name

def generate_vehicles():
    print(f"Generating {NUM_VEHICLES} Vehicles...")
    vehicles = []
    types = ["bike", "scooter", "van"]
    fuel_types = ["electric", "gasoline", "diesel"]
    
    for _ in range(NUM_VEHICLES):
        v_type = random.choices(types, weights=[0.4, 0.4, 0.2])[0]
        capacity = random.randint(10, 25) if v_type in ["bike", "scooter"] else random.randint(300, 800)
        
        vehicles.append({
            "id": str(uuid.uuid4()),
            "vehicle_type": v_type,
            "registration_number": f"IND-{random.randint(1000,9999)}",
            "capacity_kg": float(capacity),
            "fuel_type": random.choice(fuel_types) if v_type != "bike" else "none",
            "operating_cost_per_km": round(random.uniform(2.0, 8.0), 2),
            "is_active": True
        })
    
    df = pd.DataFrame(vehicles)
    df.to_csv("synthetic_vehicles.csv", index=False)
    print("-> synthetic_vehicles.csv created.")
    return vehicles

def generate_riders(vehicles):
    print(f"Generating {NUM_RIDERS} Riders...")
    riders = []
    statuses = ["offline", "available", "busy", "break", "inactive"]
    
    vehicle_ids = [v["id"] for v in vehicles]
    
    for i in range(NUM_RIDERS):
        v_id = vehicle_ids[i] if i < len(vehicle_ids) else None
        lat, lon, _ = get_random_location()
        
        riders.append({
            "id": str(uuid.uuid4()),
            "user_id": str(uuid.uuid4()),
            "vehicle_id": v_id,
            "status": random.choices(statuses, weights=[0.2, 0.4, 0.3, 0.05, 0.05])[0],
            "current_latitude": lat,
            "current_longitude": lon,
            "availability": random.random() > 0.4,
            "average_speed_kmh": round(random.uniform(15.0, 45.0), 2),
            "completed_deliveries": random.randint(0, 5000)
        })
    
    df = pd.DataFrame(riders)
    df.to_csv("synthetic_riders.csv", index=False)
    print("-> synthetic_riders.csv created.")
    return riders

def generate_orders():
    print(f"Generating {NUM_ORDERS} Orders...")
    orders = []
    priorities = ["low", "medium", "high", "urgent"]
    now = datetime.now()
    
    for _ in range(NUM_ORDERS):
        city = random.choice(list(CITIES.keys()))
        p_lat, p_lon, _ = get_random_location(city)
        d_lat, d_lon, _ = get_random_location(city)
        priority = random.choices(priorities, weights=[0.2, 0.5, 0.2, 0.1])[0]
        
        hours_added = 24 if priority == "low" else 12 if priority == "medium" else 4 if priority == "high" else 1
        deadline = now + timedelta(hours=random.randint(1, hours_added))
        
        orders.append({
            "id": str(uuid.uuid4()),
            "order_number": f"ORD-{random.randint(100000, 999999)}",
            "city": city,
            "pickup_latitude": p_lat,
            "pickup_longitude": p_lon,
            "delivery_latitude": d_lat,
            "delivery_longitude": d_lon,
            "priority": priority,
            "package_weight": round(random.uniform(0.5, 20.0), 2),
            "delivery_deadline": deadline.isoformat(),
            "status": "pending",
            "created_at": (now - timedelta(hours=random.randint(0, 72))).isoformat()
        })
        
    df = pd.DataFrame(orders)
    df.to_csv("synthetic_orders.csv", index=False)
    print("-> synthetic_orders.csv created.")

if __name__ == "__main__":
    print("=== ROVIK INDIAN SYNTHETIC DATA GENERATOR ===")
    vehicles = generate_vehicles()
    riders = generate_riders(vehicles)
    generate_orders()
    print("=== DONE ===")
