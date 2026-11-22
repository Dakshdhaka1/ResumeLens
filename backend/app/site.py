"""Serve the exported web UI and the API from one origin on Render."""
from starlette.applications import Starlette
from starlette.routing import Mount
from starlette.staticfiles import StaticFiles

from .config import ROOT_DIR
from .main import app as api

app = Starlette(routes=[
    Mount("/api", app=api),
    Mount("/", app=StaticFiles(directory=ROOT_DIR / "frontend" / "out", html=True)),
])
