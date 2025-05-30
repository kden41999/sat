from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Create the main app without a prefix
app = FastAPI(title="Sät API", description="Kazakh food-saving platform API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

class UserRole(str, Enum):
    CUSTOMER = "customer"
    RESTAURANT = "restaurant"

class CategoryEnum(str, Enum):
    BAKERY = "Выпечка"
    DESSERTS = "Десерты"
    SALADS = "Салаты"
    HOT_DISHES = "Горячие блюда"

# Pydantic Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    role: UserRole
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Restaurant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    description: str
    address: str
    logo: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RestaurantCreate(BaseModel):
    name: str
    description: str
    address: str
    phone: Optional[str] = None

class Box(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str
    title: str
    description: str
    category: CategoryEnum
    quantity: int
    price_before: float
    price_after: float
    pickup_time: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_available: bool = True

class BoxCreate(BaseModel):
    title: str
    description: str
    category: CategoryEnum
    quantity: int
    price_before: float
    price_after: float
    pickup_time: str

class Favorite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    box_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    box_id: str
    quantity: int
    total_price: float
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    hashed_password = hash_password(user_data.password)
    user = User(
        name=user_data.name,
        email=user_data.email,
        role=user_data.role
    )
    
    # Save to database
    user_doc = user.dict()
    user_doc["password"] = hashed_password
    await db.users.insert_one(user_doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc or not verify_password(login_data.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Restaurant Routes
@api_router.post("/restaurants", response_model=Restaurant)
async def create_restaurant(
    restaurant_data: RestaurantCreate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.RESTAURANT:
        raise HTTPException(status_code=403, detail="Only restaurants can create restaurant profiles")
    
    restaurant = Restaurant(
        user_id=current_user.id,
        **restaurant_data.dict()
    )
    
    await db.restaurants.insert_one(restaurant.dict())
    return restaurant

@api_router.get("/restaurants/me", response_model=Restaurant)
async def get_my_restaurant(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.RESTAURANT:
        raise HTTPException(status_code=403, detail="Only restaurants can access this endpoint")
    
    restaurant = await db.restaurants.find_one({"user_id": current_user.id})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant profile not found")
    
    return Restaurant(**restaurant)

# Box Routes
@api_router.post("/boxes", response_model=Box)
async def create_box(
    box_data: BoxCreate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.RESTAURANT:
        raise HTTPException(status_code=403, detail="Only restaurants can create boxes")
    
    # Get restaurant
    restaurant = await db.restaurants.find_one({"user_id": current_user.id})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant profile not found")
    
    box = Box(
        restaurant_id=restaurant["id"],
        **box_data.dict()
    )
    
    await db.boxes.insert_one(box.dict())
    return box

@api_router.get("/boxes", response_model=List[dict])
async def get_boxes(current_user: User = Depends(get_current_user)):
    boxes = await db.boxes.find({"is_available": True}, {"_id": 0}).to_list(100)
    
    # Populate with restaurant info
    result = []
    for box in boxes:
        restaurant = await db.restaurants.find_one({"id": box["restaurant_id"]}, {"_id": 0})
        box_with_restaurant = {
            **box,
            "restaurant_name": restaurant["name"] if restaurant else "Unknown",
            "restaurant_address": restaurant["address"] if restaurant else ""
        }
        result.append(box_with_restaurant)
    
    return result

@api_router.get("/boxes/my", response_model=List[Box])
async def get_my_boxes(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.RESTAURANT:
        raise HTTPException(status_code=403, detail="Only restaurants can access this endpoint")
    
    restaurant = await db.restaurants.find_one({"user_id": current_user.id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant profile not found")
    
    boxes = await db.boxes.find({"restaurant_id": restaurant["id"]}, {"_id": 0}).to_list(100)
    return [Box(**box) for box in boxes]

# Favorites Routes
@api_router.post("/favorites/{box_id}")
async def add_favorite(box_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Only customers can add favorites")
    
    # Check if already favorited
    existing = await db.favorites.find_one({"user_id": current_user.id, "box_id": box_id})
    if existing:
        raise HTTPException(status_code=400, detail="Box already in favorites")
    
    favorite = Favorite(user_id=current_user.id, box_id=box_id)
    await db.favorites.insert_one(favorite.dict())
    return {"message": "Added to favorites"}

@api_router.delete("/favorites/{box_id}")
async def remove_favorite(box_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Only customers can remove favorites")
    
    result = await db.favorites.delete_one({"user_id": current_user.id, "box_id": box_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    return {"message": "Removed from favorites"}

@api_router.get("/favorites", response_model=List[dict])
async def get_favorites(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Only customers can access favorites")
    
    favorites = await db.favorites.find({"user_id": current_user.id}).to_list(100)
    
    # Get box details for each favorite
    result = []
    for favorite in favorites:
        box = await db.boxes.find_one({"id": favorite["box_id"]})
        if box:
            restaurant = await db.restaurants.find_one({"id": box["restaurant_id"]})
            favorite_with_details = {
                **box,
                "restaurant_name": restaurant["name"] if restaurant else "Unknown",
                "restaurant_address": restaurant["address"] if restaurant else "",
                "favorite_id": favorite["id"]
            }
            result.append(favorite_with_details)
    
    return result

# Health check
@api_router.get("/")
async def root():
    return {"message": "Sät API is running", "status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
