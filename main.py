from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import json, uuid

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Store each user's data by unique ID
geojson_store = {}

@app.post("/viewer", response_class=JSONResponse)
async def receive_geojson(request: Request):
    data = await request.json()
    uid = str(uuid.uuid4())
    geojson_store[uid] = data

    # Return only the link — DO NOT open browser
    return {"url": f"http://164.92.170.36:8000/live/{uid}"}

@app.get("/live/{uid}", response_class=HTMLResponse)
async def show_viewer(request: Request, uid: str):
    geojson = geojson_store.get(uid)
    if not geojson:
        return HTMLResponse("Not found or expired.", status_code=404)

    return templates.TemplateResponse("View.html", {
        "request": request,
        "geojson_data": json.dumps(geojson)
    })
