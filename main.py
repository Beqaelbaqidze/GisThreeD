from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import json, threading, webbrowser

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

geojson_data = {}  # global storage

@app.post("/viewer", response_class=HTMLResponse)
async def receive_and_redirect(request: Request):
    global geojson_data
    geojson_data = await request.json()

    # Open browser to /live after 1 second
    threading.Timer(1.0, lambda: webbrowser.open("http://127.0.0.1:8000/live")).start()
    
    return HTMLResponse(content="GeoJSON received. Opening viewer...", status_code=200)

@app.get("/live", response_class=HTMLResponse)
async def render_viewer(request: Request):
    return templates.TemplateResponse("View.html", {
        "request": request,
        "geojson_data": json.dumps(geojson_data)
    })
