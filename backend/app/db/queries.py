import structlog

from app.db.client import get_db
from app.models.listing import ListingUpsert

log = structlog.get_logger()


async def upsert_listing(listing: ListingUpsert) -> dict | None:
    """Upsert a listing on (external_id, source). Returns the upserted row."""
    db = await get_db()
    data = listing.model_dump()
    result = (
        await db.table("listings")
        .upsert(data, on_conflict="external_id,source")
        .execute()
    )
    return result.data[0] if result.data else None


async def upsert_listings_batch(listings: list[ListingUpsert]) -> int:
    """Upsert a batch of listings. Returns count of upserted rows."""
    db = await get_db()
    data = [l.model_dump() for l in listings]
    result = (
        await db.table("listings")
        .upsert(data, on_conflict="external_id,source")
        .execute()
    )
    count = len(result.data) if result.data else 0
    log.info("listings_upserted", count=count)
    return count


async def get_all_listings(limit: int = 1000) -> list[dict]:
    """Fetch all listings from the DB."""
    db = await get_db()
    result = await db.table("listings").select("*").limit(limit).execute()
    return result.data or []


async def get_listings_count() -> int:
    """Get total count of listings."""
    db = await get_db()
    result = await db.table("listings").select("id", count="exact").execute()
    return result.count or 0


async def get_listings_with_coords(limit: int = 1000) -> list[dict]:
    """Fetch listings that have lat/lng coordinates."""
    db = await get_db()
    result = (
        await db.table("listings")
        .select("*")
        .not_.is_("lat", "null")
        .not_.is_("lng", "null")
        .limit(limit)
        .execute()
    )
    return result.data or []


async def get_unenriched_listings(limit: int = 500) -> list[dict]:
    """Fetch listings with coords that don't yet have enrichment data."""
    db = await get_db()
    # Get listing IDs that already have enrichment
    enriched = await db.table("enriched_listings").select("listing_id").execute()
    enriched_ids = {r["listing_id"] for r in (enriched.data or [])}

    # Get all listings with coords
    all_listings = await get_listings_with_coords(limit)

    return [l for l in all_listings if l["id"] not in enriched_ids]


async def upsert_enriched_listing(data: dict) -> dict | None:
    """Upsert enrichment data for a listing."""
    db = await get_db()
    result = (
        await db.table("enriched_listings")
        .upsert(data, on_conflict="listing_id")
        .execute()
    )
    return result.data[0] if result.data else None


async def get_enriched_listings_count() -> int:
    """Get total count of enriched listings."""
    db = await get_db()
    result = await db.table("enriched_listings").select("id", count="exact").execute()
    return result.count or 0
