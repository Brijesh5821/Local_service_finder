from fastapi import FastAPI

app = FastAPI(
    title="Local Service Finder API",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message": "Local Service Finder API is Running..."
    }

@app.get("/users")
def get_users():
    # Logic to retrieve users from the database
    return {
        "this is users route"
    }       
