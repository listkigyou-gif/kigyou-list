#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
HelloWork Harvester Facade (Upgraded to v2 HTTP Session)
========================================================
This module exposes HelloworkHarvester using the high-performance
HTTP Session Emulation engine (http_harvester_v2.py).

The legacy Playwright browser-based implementation is safely archived at:
crawlers/hellowork/harvester_v1_backup.py
"""

import sys
import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from http_harvester_v2 import HelloworkHttpHarvester, HelloworkHarvester, main_cli

if __name__ == "__main__":
    import asyncio
    asyncio.run(main_cli())
