import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / 'backend' / '.env')

async def init_users():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    users = [
        {
            "id": "deposito-user",
            "username": "deposito",
            "password": bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            "role": "deposito"
        },
        {
            "id": "negocio1-user",
            "username": "negocio1",
            "password": bcrypt.hashpw("negocio123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            "role": "negocio1"
        },
        {
            "id": "negocio2-user",
            "username": "negocio2",
            "password": bcrypt.hashpw("negocio123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            "role": "negocio2"
        }
    ]
    
    for user in users:
        existing = await db.users.find_one({"username": user["username"]})
        if not existing:
            await db.users.insert_one(user)
            print(f"Usuario {user['username']} creado")
        else:
            print(f"Usuario {user['username']} ya existe")
    
    client.close()
    print("Inicialización completada")

if __name__ == "__main__":
    asyncio.run(init_users())
