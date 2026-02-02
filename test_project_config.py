#!/usr/bin/env python3

import json
import uuid
from datetime import datetime

# Create a test project config for the existing project
project_id = "4cb29a9e-cb48-40fd-ba1a-ac225b1ab56a"

project_config = {
    "project_id": project_id,
    "name": "backside para b copy",
    "description": "Scanner project created from backside para b copy.py via Renata AI",
    "scanners": [
        {
            "scanner_id": "backside_para_b_copy_scanner_1",
            "scanner_file": "/Users/michaeldurante/ai dev/ce-hub/edge-dev/projects/4cb29a9e-cb48-40fd-ba1a-ac225b1ab56a/scanners/backside para b copy_scanner_1.py",
            "parameter_file": "/Users/michaeldurante/ai dev/ce-hub/edge-dev/projects/4cb29a9e-cb48-40fd-ba1a-ac225b1ab56a/parameters/backside_para_b_copy_scanner_1_params.json",
            "enabled": True,
            "weight": 1.0,
            "order_index": 0
        }
    ],
    "aggregation_method": "union",
    "tags": ["uploaded", "renata-ai", "scanner"],
    "created_at": datetime.now().isoformat(),
    "updated_at": datetime.now().isoformat(),
    "version": 1,
    "created_by": "renata-ai",
    "last_executed": None,
    "execution_count": 0
}

# Write the project config file
config_path = f"/Users/michaeldurante/ai dev/ce-hub/edge-dev/projects/{project_id}/project.config.json"
with open(config_path, 'w') as f:
    json.dump(project_config, f, indent=2)

print(f"✅ Created project config: {config_path}")