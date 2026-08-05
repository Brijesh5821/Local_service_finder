from pymongo import MongoClient
from app.config.settings import mongodb://localhost:27017, local_service_finder

client = MongoClient(mongodb://localhost:27017)

db = client[local_service_finder]