import pytest
from unittest.mock import patch, MagicMock

from routeiq.application.ingestion.ai_extractor import ai_extractor
from routeiq.application.ingestion.geocoding_service import geocoding_service

@pytest.mark.asyncio
async def test_ai_extraction_valid_text():
    raw_ocr_text = """
    DELIVERY MANIFEST
    Order #1234
    Customer: John Doe
    Phone: 555-0192
    Deliver To: 123 Tech Lane, San Francisco, CA 94105
    Weight: 5.2 kg
    Priority: 4
    """
    
    # Mocking Ollama's response
    with patch.object(ai_extractor.llm, 'ainvoke') as mock_ainvoke:
        mock_ainvoke.return_value = '''{
            "orders": [
                {
                    "customer_name": "John Doe",
                    "customer_phone": "555-0192",
                    "pickup_address": "",
                    "delivery_address": "123 Tech Lane, San Francisco, CA 94105",
                    "package_weight": 5.2,
                    "priority": 4
                }
            ]
        }'''
        
        orders = await ai_extractor.extract_orders(raw_ocr_text)
        assert len(orders) == 1
        assert orders[0]["customer_name"] == "John Doe"
        assert orders[0]["package_weight"] == 5.2

@pytest.mark.asyncio
async def test_ai_extraction_empty_text():
    with patch.object(ai_extractor.llm, 'ainvoke') as mock_ainvoke:
        mock_ainvoke.return_value = '{"orders": []}'
        orders = await ai_extractor.extract_orders("")
        assert len(orders) == 0

@pytest.mark.asyncio
async def test_geocoding_success():
    with patch('geopy.geocoders.Nominatim.geocode') as mock_geocode:
        mock_location = MagicMock()
        mock_location.latitude = 37.7749
        mock_location.longitude = -122.4194
        mock_geocode.return_value = mock_location
        
        # Geocoding service caches responses, so we need to clear it or use a unique address
        address = "San Francisco, CA"
        coords = await geocoding_service.geocode_address(address)
        
        assert coords is not None
        assert coords[0] == 37.7749
        assert coords[1] == -122.4194

@pytest.mark.asyncio
async def test_geocoding_failure():
    with patch('geopy.geocoders.Nominatim.geocode') as mock_geocode:
        mock_geocode.return_value = None
        
        address = "This is a completely invalid address that does not exist anywhere 12345"
        coords = await geocoding_service.geocode_address(address)
        
        assert coords is None
