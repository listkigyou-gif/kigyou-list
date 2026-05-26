"""
Yahoo Company Scraper - Pipeline Runner
========================================
Chạy toàn bộ 3 giai đoạn liên tiếp.

Cách dùng:
    python run_all.py --keyword "IT 企業 東京" --max 200

    # Chỉ chạy giai đoạn cụ thể:
    python run_all.py --stage 1 --keyword "製造業 大阪" --max 100
    python run_all.py --stage 2 --limit 50
    python run_all.py --stage 3
"""
import asyncio
import argparse
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description="Yahoo Company Scraper Pipeline")
    parser.add_argument("--keyword", default="IT 企業 東京", help="Từ khóa tìm kiếm")
    parser.add_argument("--max", type=int, default=100, help="Số GID tối đa (Giai đoạn 1)")
    parser.add_argument("--limit", type=int, default=0, help="Giới hạn số công ty (0 = tất cả)")
    parser.add_argument("--stage", type=int, default=0, help="Chỉ chạy giai đoạn này (1/2/3), 0 = cả 3")
    return parser.parse_args()


async def main():
    args = parse_args()
    run_stages = [args.stage] if args.stage else [1, 2, 3]

    if 1 in run_stages:
        log.info("=" * 50)
        log.info("GIAI ĐOẠN 1: THU THẬP GID (Harvester)")
        log.info("=" * 50)
        from harvester import harvest, save_gids
        gids = await harvest(args.keyword, args.max)
        save_gids(gids, "data/gids.csv")
        log.info(f"→ Đã lưu {len(gids)} GIDs vào data/gids.csv")

    if 2 in run_stages:
        log.info("=" * 50)
        log.info("GIAI ĐOẠN 2: TRÍCH XUẤT DỮ LIỆU CƠ BẢN (Extractor)")
        log.info("=" * 50)
        import extractor
        await extractor.run("data/gids.csv", "data/companies_basic.csv", args.limit)

    if 3 in run_stages:
        log.info("=" * 50)
        log.info("GIAI ĐOẠN 3: LÀM GIÀU DỮ LIỆU - FAX & EMAIL (Enricher)")
        log.info("=" * 50)
        import enricher
        await enricher.run("data/companies_basic.csv", "data/companies_final.csv", args.limit)

    log.info("=" * 50)
    log.info("HOÀN THÀNH! Xem kết quả tại: data/companies_final.csv")
    log.info("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
