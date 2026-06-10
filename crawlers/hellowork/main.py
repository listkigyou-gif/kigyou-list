import asyncio
import argparse
import sys
import logging
from harvester import HelloworkHarvester
from extractor import HelloworkExtractor

# Cấu hình logging chung
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

async def main():
    parser = argparse.ArgumentParser(description="Hellowork Scraper Control Center")
    parser.add_argument("--mode", choices=["full", "update"], default="full", 
                        help="Chế độ chạy: 'full' (Cào toàn bộ) hoặc 'update' (Chỉ cào tin mới)")
    parser.add_argument("--stage", choices=["harvest", "extract", "both"], default="both",
                        help="Giai đoạn: 'harvest' (Lấy ID), 'extract' (Lấy chi tiết), hoặc 'both' (Cả hai)")
    parser.add_argument("--limit", type=int, default=0,
                        help="Giới hạn số lượng tin tuyển dụng cần cào (0 = không giới hạn)")
    parser.add_argument("--prefecture", type=str, default=None,
                        help="Mã tỉnh cần cào (ví dụ: '13' cho Tokyo, '01' cho Hokkaido)")
    parser.add_argument("--concurrency", type=int, default=0,
                        help="Số luồng cào song song (chỉ áp dụng cho Extractor)")
    parser.add_argument("--proxy", type=str, default=None,
                        help="SOCKS5 proxy cố định cho luồng này (ví dụ: socks5://127.0.0.1:40000)")
    parser.add_argument("--container", type=str, default=None,
                        help="Tên container docker của proxy này để restart khi xoay IP")
    
    args = parser.parse_args()

    print("="*50)
    print(f"HELLOWORK SCRAPER STARTING (Mode: {args.mode.upper()}, Limit: {args.limit})")
    if args.prefecture:
        print(f"Prefecture: {args.prefecture}")
    if args.proxy:
        print(f"Fixed Proxy: {args.proxy}")
    if args.container:
        print(f"Docker Container: {args.container}")
    print("="*50)

    # Khởi tạo các module
    is_incremental = (args.mode == "update")
    harvester = HelloworkHarvester(
        incremental_mode=is_incremental, 
        prefecture=args.prefecture,
        proxy=args.proxy,
        container=args.container
    )
    extractor = HelloworkExtractor(
        prefecture=args.prefecture,
        concurrency=args.concurrency,
        proxy=args.proxy,
        container=args.container
    )

    # Giai đoạn 1: Harvest IDs
    if args.stage in ["harvest", "both"]:
        print("\n[Stage 1/2] Harvesting Job IDs...")
        try:
            await harvester.run()
        except KeyboardInterrupt:
            print("\n[!] Harvester stopped by user. Progress saved.")
        except Exception as e:
            print(f"\n[Error] Harvester Error: {str(e)}")

    # Giai đoạn 2: Extract Details
    if args.stage in ["extract", "both"]:
        print("\n[Stage 2/2] Extracting Details...")
        try:
            await extractor.run_forever(limit=args.limit)
        except KeyboardInterrupt:
            print("\n[!] Extractor stopped by user. Progress saved.")
        except Exception as e:
            print(f"\n[Error] Extractor Error: {str(e)}")

    print("\n" + "="*50)
    print("PROCESS FINISHED")
    print("="*50)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(0)
