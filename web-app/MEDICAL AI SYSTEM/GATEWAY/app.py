from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException
)
from fastapi.middleware.cors import CORSMiddleware

from services import (
    check_services,
    submit_to_ingestion
)

from logger import logger


app = FastAPI(
    title="Medical AI Gateway",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():

    return {
        "service": "Medical AI Gateway",
        "status": "running"
    }


@app.get("/health")
def health():

    return {
        "gateway": "healthy"
    }


@app.get("/services")
def services():

    return check_services()


@app.post("/submit")
async def submit(
    file: UploadFile = File(...)
):

    try:

        result = await submit_to_ingestion(
            file
        )

        return result

    except Exception as e:

        logger.exception(
            f"Submission failed: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )