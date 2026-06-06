from pydantic import BaseModel, Field
from langchain_core.prompts import PromptTemplate
from langchain_ollama import OllamaLLM
from langchain_core.output_parsers import JsonOutputParser

class ExtractedOrder(BaseModel):
    customer_name: str = Field(description="Name of the customer")
    customer_phone: str = Field(description="Phone number of the customer. Leave empty if missing.")
    pickup_address: str = Field(description="Full pickup address. Leave empty if missing.")
    delivery_address: str = Field(description="Full delivery address.")
    package_weight: float = Field(description="Weight of the package in kg. Default to 1.0 if not specified.", default=1.0)
    priority: int = Field(description="Priority level from 1 (lowest) to 5 (highest). Default 3.", default=3)

class ExtractedOrdersList(BaseModel):
    orders: list[ExtractedOrder] = Field(description="List of all orders extracted from the document.")

class AIExtractor:
    def __init__(self):
        self.llm = OllamaLLM(model="llama3", format="json")
        self.parser = JsonOutputParser(pydantic_object=ExtractedOrdersList)
        
        template = """
        You are ROVIK's advanced Logistics AI Extractor.
        Your job is to parse the raw OCR text extracted from a delivery manifest or receipt, and output a structured JSON array of delivery orders.
        
        Rules:
        - Identify ALL individual orders present in the text.
        - Normalize the addresses so they are clean and readable.
        - DO NOT invent information. If a field like phone number is missing, leave it as an empty string.
        - Output strictly in the requested JSON format.
        
        Format Instructions:
        {format_instructions}
        
        Raw OCR Document Text:
        {ocr_text}
        """
        self.prompt = PromptTemplate(
            template=template,
            input_variables=["ocr_text"],
            partial_variables={"format_instructions": self.parser.get_format_instructions()},
        )
        self.chain = self.prompt | self.llm | self.parser

    async def extract_orders(self, ocr_text: str) -> list[dict]:
        """Extracts structured JSON orders from raw text using Llama3."""
        try:
            result = await self.chain.ainvoke({"ocr_text": ocr_text})
            # result is a dictionary matching ExtractedOrdersList
            return result.get("orders", [])
        except Exception as e:
            raise RuntimeError(f"AI Extraction failed to parse document: {str(e)}")

ai_extractor = AIExtractor()
