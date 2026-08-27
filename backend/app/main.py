# Import context manager tool for lifespan event handling
from contextlib import asynccontextmanager
import logging
# Import FastAPI framework and response tools
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
# Import CORS middleware to enable cross-origin browser requests
from fastapi.middleware.cors import CORSMiddleware
# Import authentication routes module router
from app.auth.routes import router as auth_router
# Import users routes module router
from app.users.routes import router as users_router
# Import providers routes (both search and dashboard routers)
from app.providers.routes import router as providers_router, provider_router
# Import bookings routes module router
from app.bookings.routes import router as bookings_router
# Import services routes module router
from app.services.routes import router as services_router
# Import notifications routes module router
from app.notifications.routes import router as notifications_router
# Import database initializer helper function
from app.database.init_database import initialize_database
# Import admin routes module router
from app.admin.routes import router as admin_router
# Import reviews routes module router
from app.reviews.routes import router as reviews_router

# Configure root logger format and level
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sevamitra_api")

# Define an async lifespan context manager to run startup tasks
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Call database initializer to build collections and indexes
    initialize_database()
    logger.info("SevaMitra backend initialized successfully.")
    # Hand over control back to the FastAPI framework
    yield

# Instantiate FastAPI application passing the lifespan handler
app = FastAPI(title="SevaMitra Local Service Finder API", lifespan=lifespan)

# Global unhandled exception handler to prevent technical error leakage
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

# Declare list of origins allowed to call this API
origins = [
    # Allow frontend dev server on port 5173
    "http://localhost:5173",
    # Allow secondary loopback IP for frontend dev server
    "http://127.0.0.1:5173",
]

# Configure CORS middleware with custom rules
app.add_middleware(
    # Use standard CORSMiddleware from FastAPI
    CORSMiddleware,
    # Allow requests originating from our declared frontend origins
    allow_origins=origins,
    # Enable sending user authentication cookies across origins
    allow_credentials=True,
    # Allow all HTTP request methods (GET, POST, etc.)
    allow_methods=["*"],
    # Allow all HTTP request headers
    allow_headers=["*"],
)

# Mount users routes router into application
app.include_router(users_router)
# Mount authentication routes router under prefix '/auth'
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
# Mount providers routes router into application
app.include_router(providers_router)
# Mount provider dashboard router into application
app.include_router(provider_router)
# Mount bookings routes router into application
app.include_router(bookings_router)
# Mount services routes router into application
app.include_router(services_router)
# Mount notifications routes router into application
app.include_router(notifications_router)
# Mount admin routes router into application
app.include_router(admin_router)
# Mount reviews routes router into application
app.include_router(reviews_router)

# Mount static files directory for serving uploads (profile images, documents)
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")