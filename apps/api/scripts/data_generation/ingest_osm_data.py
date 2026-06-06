import osmnx as ox
import os

# Constrain to exactly what the prompt required to stay under the 2 GB OSM limit.
CITIES = ["Chennai, India", "Bangalore, India", "Hyderabad, India"]
OUTPUT_DIR = "osm_graphs"

def download_and_save_graph(city_name):
    print(f"[{city_name}] Downloading OpenStreetMap road network...")
    try:
        # 'drive' network restricts to drivable public streets (no walking paths) to save space.
        G = ox.graph_from_place(city_name, network_type='drive')
        
        # We must add speeds and travel times for routing and ETA ML scaling
        G = ox.add_edge_speeds(G)
        G = ox.add_edge_travel_times(G)
        
        # Save graph in GraphML format
        filename = f"{city_name.split(',')[0].lower().replace(' ', '_')}_drive.graphml"
        filepath = os.path.join(OUTPUT_DIR, filename)
        ox.save_graphml(G, filepath)
        
        # Compute some basic stats for validation
        stats = ox.basic_stats(G)
        
        print(f"[{city_name}] Successfully saved to {filepath}.")
        print(f"[{city_name}] Network stats: {stats['n']} nodes, {stats['m']} edges.")
        
    except Exception as e:
        print(f"[{city_name}] Failed to download or process network: {str(e)}")

if __name__ == "__main__":
    print("=== ROVIK OSM DATA INGESTION ===")
    print("This script downloads the drivable road networks to power OR-Tools and ML scaling.")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for city in CITIES:
        download_and_save_graph(city)
        
    print("=== OSM INGESTION COMPLETE ===")
