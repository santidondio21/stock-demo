from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import unicodedata
import re
import cloudinary
import cloudinary.uploader
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET')
)

UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'dino_demo')]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
api_router = APIRouter(prefix="/api")

# ─── DEMO SEED DATA ───────────────────────────────────────────────────────────
DEMO_CATEGORIES = [
    {"name": "Juguetería", "id": "cat-jugueteria"},
]

DEMO_PRODUCTS = [
    {
        "id": "prod-001",
        "code": "JUG-001",
        "name": "Auto Radio Control Turbo",
        "image_url": "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400",
        "quantity": 15,
        "category_id": "cat-jugueteria",
        "precio": 4500.00,
    },
    {
        "id": "prod-002",
        "code": "JUG-002",
        "name": "Muñeca Articulada Deluxe",
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
        "quantity": 8,
        "category_id": "cat-jugueteria",
        "precio": 3200.00,
    },
    {
        "id": "prod-003",
        "code": "JUG-003",
        "name": "Lego Castillo Medieval 500 piezas",
        "image_url": "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400",
        "quantity": 5,
        "category_id": "cat-jugueteria",
        "precio": 8900.00,
    },
    {
        "id": "prod-004",
        "code": "JUG-004",
        "name": "Pelota Fútbol N°5 Pro",
        "image_url": "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=400",
        "quantity": 20,
        "category_id": "cat-jugueteria",
        "precio": 1800.00,
    },
]

# ─── MODELS ───────────────────────────────────────────────────────────────────

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CategoryCreate(BaseModel):
    name: str

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    name: str
    image_url: str
    quantity: int
    category_id: str
    precio: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProductCreate(BaseModel):
    code: str
    name: str
    image_url: str
    quantity: int
    category_id: str
    precio: float = 0.0

class ProductUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    image_url: Optional[str] = None
    quantity: Optional[int] = None
    category_id: Optional[str] = None
    precio: Optional[float] = None
    ingreso: Optional[int] = None
    egreso: Optional[int] = None

class ProductMovement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    type: str
    quantity_before: int
    quantity_after: int
    quantity_change: int
    description: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderProduct(BaseModel):
    product_id: str
    quantity: Optional[int] = None
    product_name: Optional[str] = None
    product_code: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_id: str
    business_name: str
    products: List[OrderProduct]
    status: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None

class OrderCreate(BaseModel):
    products: List[OrderProduct]

class OrderUpdate(BaseModel):
    products: List[OrderProduct]

class CompleteOrderRequest(BaseModel):
    quantities: dict

# ─── SESSION HELPERS ──────────────────────────────────────────────────────────

async def ensure_session(session_id: str):
    """Crea los datos demo para una sesión nueva si no existen."""
    existing = await db.demo_sessions.find_one({"session_id": session_id})
    if existing:
        return

    now = datetime.now(timezone.utc).isoformat()
    # Insertar categorías
    for cat in DEMO_CATEGORIES:
        await db.demo_categories.insert_one({
            **cat,
            "session_id": session_id,
            "created_at": now,
        })
    # Insertar productos
    for prod in DEMO_PRODUCTS:
        await db.demo_products.insert_one({
            **prod,
            "session_id": session_id,
            "created_at": now,
        })
    # Registrar sesión con TTL de 24hs
    await db.demo_sessions.insert_one({
        "session_id": session_id,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=24),
    })

# ─── SESSION INIT ─────────────────────────────────────────────────────────────

@api_router.post("/session/init")
async def init_session(session_id: str):
    await ensure_session(session_id)
    return {"status": "ok", "session_id": session_id}

# ─── CATEGORIES ───────────────────────────────────────────────────────────────

@api_router.get("/categories", response_model=List[Category])
async def get_categories(session_id: str):
    await ensure_session(session_id)
    cats = await db.demo_categories.find({"session_id": session_id}, {"_id": 0}).to_list(None)
    return cats

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate, session_id: str):
    await ensure_session(session_id)
    cat = Category(name=category.name)
    await db.demo_categories.insert_one({**cat.model_dump(), "session_id": session_id})
    return cat

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category: CategoryCreate, session_id: str):
    await ensure_session(session_id)
    await db.demo_categories.update_one(
        {"id": category_id, "session_id": session_id},
        {"$set": {"name": category.name}}
    )
    updated = await db.demo_categories.find_one({"id": category_id, "session_id": session_id}, {"_id": 0})
    return updated

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, session_id: str):
    await db.demo_categories.delete_one({"id": category_id, "session_id": session_id})
    return {"message": "deleted"}

# ─── SEARCH HELPER ────────────────────────────────────────────────────────────

def normalize_text(text):
    normalized = unicodedata.normalize('NFD', text)
    return ''.join(c for c in normalized if unicodedata.category(c) != 'Mn').lower()

def create_token_query(search: str):
    accent_map = {
        'a': '[aáàäâã\ufffd]', 'e': '[eéèëê\ufffd]', 'i': '[iíìïî\ufffd]',
        'o': '[oóòöôõ\ufffd]', 'u': '[uúùüû\ufffd]', 'n': '[nñ\ufffd]', 'c': '[cç\ufffd]'
    }
    tokens = search.strip().split()
    conditions = []
    for token in tokens:
        pattern = ''.join(accent_map.get(c, re.escape(c)) for c in token.lower())
        conditions.append({"$or": [
            {"name": {"$regex": pattern, "$options": "i"}},
            {"code": {"$regex": pattern, "$options": "i"}}
        ]})
    return {"$and": conditions} if conditions else {}

# ─── PRODUCTS ─────────────────────────────────────────────────────────────────

@api_router.get("/products", response_model=List[Product])
async def get_products(session_id: str, search: Optional[str] = None, category_id: Optional[str] = None):
    await ensure_session(session_id)
    query = {"session_id": session_id}
    if category_id and category_id != "all":
        query["category_id"] = category_id
    if search and search.strip():
        token_query = create_token_query(search)
        if "$and" in token_query:
            query["$and"] = token_query["$and"]
    products = await db.demo_products.find(query, {"_id": 0}).to_list(None)
    return products

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, session_id: str):
    await ensure_session(session_id)
    prod = Product(**product.model_dump())
    await db.demo_products.insert_one({**prod.model_dump(), "session_id": session_id})
    return prod

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductUpdate, session_id: str):
    await ensure_session(session_id)
    existing = await db.demo_products.find_one({"id": product_id, "session_id": session_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = {k: v for k, v in product.model_dump().items() if v is not None and k not in ["ingreso", "egreso"]}
    quantity_before = existing["quantity"]

    if product.ingreso:
        update_data["quantity"] = existing["quantity"] + product.ingreso
    elif product.egreso:
        update_data["quantity"] = max(0, existing["quantity"] - product.egreso)

    await db.demo_products.update_one(
        {"id": product_id, "session_id": session_id},
        {"$set": update_data}
    )

    if product.ingreso or product.egreso:
        change = product.ingreso or -(product.egreso or 0)
        movement = ProductMovement(
            product_id=product_id,
            type="ingreso" if product.ingreso else "egreso",
            quantity_before=quantity_before,
            quantity_after=update_data.get("quantity", quantity_before),
            quantity_change=abs(change),
            description=f"{'Ingreso' if product.ingreso else 'Egreso'} de {abs(change)} unidades"
        )
        await db.demo_movements.insert_one({**movement.model_dump(), "session_id": session_id})

    updated = await db.demo_products.find_one({"id": product_id, "session_id": session_id}, {"_id": 0})
    return Product(**updated)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, session_id: str):
    await db.demo_products.delete_one({"id": product_id, "session_id": session_id})
    return {"message": "deleted"}

@api_router.get("/products/{product_id}/movements", response_model=List[ProductMovement])
async def get_product_movements(product_id: str, session_id: str):
    movements = await db.demo_movements.find(
        {"product_id": product_id, "session_id": session_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return movements

# ─── UPLOAD IMAGE ─────────────────────────────────────────────────────────────

@api_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = cloudinary.uploader.upload(contents, folder="dino-demo", resource_type="image")
        return {"url": result["secure_url"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── ORDERS ───────────────────────────────────────────────────────────────────

@api_router.get("/orders", response_model=List[Order])
async def get_orders(session_id: str, business_role: Optional[str] = None):
    await ensure_session(session_id)
    query = {"session_id": session_id}
    if business_role:
        query["business_id"] = business_role
    orders = await db.demo_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(None)
    return orders

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate, session_id: str, business_role: str = "negocio1"):
    await ensure_session(session_id)
    business_names = {"negocio1": "Dino La Falda", "negocio2": "Dino Carlos Paz"}
    order_obj = Order(
        business_id=business_role,
        business_name=business_names.get(business_role, business_role),
        products=order.products,
        status="pending"
    )
    await db.demo_orders.insert_one({**order_obj.model_dump(), "session_id": session_id})
    return order_obj

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order: OrderUpdate, session_id: str):
    await db.demo_orders.update_one(
        {"id": order_id, "session_id": session_id},
        {"$set": {"products": [p.model_dump() for p in order.products]}}
    )
    updated = await db.demo_orders.find_one({"id": order_id, "session_id": session_id}, {"_id": 0})
    return updated

@api_router.delete("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, session_id: str):
    await db.demo_orders.update_one(
        {"id": order_id, "session_id": session_id},
        {"$set": {"status": "cancelled"}}
    )
    return {"message": "cancelled"}

@api_router.post("/orders/{order_id}/complete")
async def complete_order(order_id: str, request: CompleteOrderRequest, session_id: str):
    order = await db.demo_orders.find_one({"id": order_id, "session_id": session_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    updated_products = []
    for prod in order["products"]:
        pid = prod["product_id"]
        qty = request.quantities.get(pid, 0)
        if qty > 0:
            existing = await db.demo_products.find_one({"id": pid, "session_id": session_id})
            if existing:
                new_qty = max(0, existing["quantity"] - qty)
                await db.demo_products.update_one(
                    {"id": pid, "session_id": session_id},
                    {"$set": {"quantity": new_qty}}
                )
        updated_products.append({**prod, "quantity": qty})

    await db.demo_orders.update_one(
        {"id": order_id, "session_id": session_id},
        {"$set": {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "products": updated_products
        }}
    )
    return {"message": "completed"}

# ─── HEALTH ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "ok"}

app.include_router(api_router)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
