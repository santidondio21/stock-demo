import csv
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')

async def import_products():
    # Connect to MongoDB
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"🔗 Conectado a MongoDB: {db_name}")
    
    # Read CSV file
    csv_file = '/tmp/productos.csv'
    
    # First, create categories
    categories_map = {}
    
    print("\n📋 Leyendo CSV y creando categorías...")
    
    with open(csv_file, 'r', encoding='utf-8', errors='replace') as file:
        reader = csv.DictReader(file, delimiter=';')
        
        # Extract unique categories
        unique_categories = set()
        products_data = []
        
        for row in reader:
            categoria = row.get('categoria', '').strip()
            if categoria and categoria != '':
                unique_categories.add(categoria)
            products_data.append(row)
        
        print(f"📦 Categorías únicas encontradas: {len(unique_categories)}")
        
        # Create categories in MongoDB
        for cat_name in unique_categories:
            # Check if category already exists
            existing_cat = await db.categories.find_one({"name": cat_name}, {"_id": 0})
            
            if existing_cat:
                categories_map[cat_name] = existing_cat['id']
                print(f"  ✓ Categoría existente: {cat_name}")
            else:
                cat_id = str(uuid.uuid4())
                category_doc = {
                    "id": cat_id,
                    "name": cat_name,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.categories.insert_one(category_doc)
                categories_map[cat_name] = cat_id
                print(f"  ➕ Categoría creada: {cat_name}")
    
    print(f"\n✅ Total de categorías: {len(categories_map)}")
    
    # Now import products
    print("\n📦 Importando productos...")
    
    inserted_count = 0
    skipped_count = 0
    error_count = 0
    
    for row in products_data:
        try:
            nombre = row.get('productos', '').strip()
            codigo = row.get('codigo', '').strip()
            cantidad_str = row.get('Cantidad', '0').strip()
            categoria = row.get('categoria', '').strip()
            
            # Skip if no name or code
            if not nombre or nombre == '':
                skipped_count += 1
                continue
            
            # Use "SIN-CODIGO" if no code provided
            if not codigo or codigo == '':
                codigo = f"SIN-CODIGO-{uuid.uuid4().hex[:8]}"
            
            # Check if product with this code already exists
            existing_product = await db.products.find_one({"code": codigo}, {"_id": 0})
            
            if existing_product:
                skipped_count += 1
                continue
            
            # Parse quantity
            try:
                cantidad = int(cantidad_str) if cantidad_str and cantidad_str != '' else 0
            except ValueError:
                cantidad = 0
            
            # Get category_id
            category_id = categories_map.get(categoria, list(categories_map.values())[0] if categories_map else str(uuid.uuid4()))
            
            # Create product document
            product_doc = {
                "id": str(uuid.uuid4()),
                "code": codigo,
                "name": nombre,
                "image_url": "https://images.unsplash.com/photo-1760621393386-3906922b0b78?w=400",
                "quantity": cantidad,
                "category_id": category_id,
                "precio": 0.0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.products.insert_one(product_doc)
            inserted_count += 1
            
            if inserted_count % 100 == 0:
                print(f"  ✓ Productos insertados: {inserted_count}")
        
        except Exception as e:
            error_count += 1
            print(f"  ❌ Error en producto: {nombre} - {str(e)}")
    
    print("\n" + "="*60)
    print("📊 RESUMEN DE IMPORTACIÓN")
    print("="*60)
    print(f"✅ Productos insertados:  {inserted_count}")
    print(f"⏭️  Productos omitidos:    {skipped_count}")
    print(f"❌ Errores:               {error_count}")
    print(f"📋 Total en CSV:          {len(products_data)}")
    print("="*60)
    
    # Show some statistics
    total_products = await db.products.count_documents({})
    total_categories = await db.categories.count_documents({})
    
    print(f"\n📈 ESTADO ACTUAL DE LA BASE DE DATOS")
    print(f"  Total productos:  {total_products}")
    print(f"  Total categorías: {total_categories}")
    
    client.close()
    print("\n✅ Importación completada!")

if __name__ == "__main__":
    asyncio.run(import_products())
