#!/usr/bin/env python3
"""Compute the minimal set of top-level node_modules dirs needed by the prisma CLI."""
import json
import os
import re
import sys

ROOT = "/home/z/my-project/node_modules"

def load_pkg(pkg_dir):
    pj = os.path.join(ROOT, pkg_dir, "package.json")
    if not os.path.exists(pj):
        return None
    with open(pj) as f:
        return json.load(f)

def dep_names(pkg):
    out = {}
    for key in ("dependencies", "peerDependencies", "optionalDependencies"):
        for name in (pkg.get(key) or {}):
            out[name] = key
    return out

def resolve(name):
    """Map a dependency name to its top-level dir (handles @scope/pkg)."""
    if name.startswith("@"):
        return f"@{name[1:].split('/')[0]}" if name.count("/") == 1 else name
    return name

def dir_exists(d):
    return os.path.isdir(os.path.join(ROOT, d))

seen = set()
needed = set()
missing = []
queue = ["prisma"]

while queue:
    cur = queue.pop()
    if cur in seen:
        continue
    seen.add(cur)
    pkg = load_pkg(cur)
    if pkg is None:
        missing.append(cur)
        continue
    for dep, kind in dep_names(pkg).items():
        top = resolve(dep)
        if top.startswith("@") and "/" in dep:
            # @scope/pkg with subpath import — still resolves to @scope tree if hoisted flat
            full = dep
        else:
            full = top
        if full not in needed:
            needed.add(full)
            queue.append(full)

print("packages visited:", len(seen))
print("MISSING from node_modules:", sorted(missing))
print("\n--- top-level dirs required by prisma CLI ---")
for d in sorted(needed):
    ok = "OK " if dir_exists(d) else "ABSENT"
    print(f"{ok}  {d}")

# Sizes
total = 0
for d in sorted(needed):
    p = os.path.join(ROOT, d)
    if os.path.isdir(p):
        for dirpath, _, files in os.walk(p):
            for fn in files:
                try:
                    total += os.path.getsize(os.path.join(dirpath, fn))
                except OSError:
                    pass
print(f"\nclosure size: {total/1024/1024:.1f} MB")

nm = 0
for dirpath, _, files in os.walk(ROOT):
    for fn in files:
        try:
            nm += os.path.getsize(os.path.join(dirpath, fn))
        except OSError:
            pass
print(f"full node_modules: {nm/1024/1024:.1f} MB")
