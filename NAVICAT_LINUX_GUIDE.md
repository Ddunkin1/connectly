# Navicat on Linux with Laravel Sail — Step-by-Step Guide

This guide explains how to use **Navicat** on Linux with the **Connectly** Laravel Sail project so your instructor’s requirement to use Navicat can be met.

---

## Quick Start (Project Scripts)

This project includes helper scripts:

```bash
# 1. Install Navicat (Flatpak preferred, or opens download page for AppImage)
./tools/install-navicat.sh

# 2. Start Sail + MySQL (if not already running)
./vendor/bin/sail up -d

# 3. Launch Navicat (shows connection details)
./tools/run-navicat.sh
```

**Connection details** are in `tools/navicat-connection.txt` — copy them when creating the MySQL connection in Navicat.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Install Navicat on Linux](#install-navicat-on-linux)
4. [Start Laravel Sail](#start-laravel-sail)
5. [Connect Navicat to MySQL](#connect-navicat-to-mysql)
6. [Verify the Connection](#verify-the-connection)
7. [Common Tasks in Navicat](#common-tasks-in-navicat)
8. [Troubleshooting](#troubleshooting)
9. [Alternatives (if Needed)](#alternatives-if-needed)

---

## Overview

| Item | Details |
|------|---------|
| **Database** | MySQL 8.4 (in Sail container) |
| **Host (from your Linux PC)** | `127.0.0.1` or `localhost` |
| **Port** | `3306` |
| **Database Name** | `connectly_app` |
| **Username** | `sail` |
| **Password** | `password` |

Navicat runs on your Linux machine and connects to MySQL inside the Sail Docker container via the exposed port.

---

## Prerequisites

- Linux (x86_64 or ARM64)
- [Docker](https://docs.docker.com/engine/install/) installed
- [Laravel Sail](https://laravel.com/docs/sail) (already set up in this project)
- Stable internet (for downloading Navicat)

---

## Install Navicat on Linux

Navicat provides an official Linux version. Two options:

### Option A: Navicat Premium Lite (Free — Recommended for Students)

- Free
- Supports MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, MongoDB, Redis, etc.
- Sufficient for typical coursework and projects

**1. Download the AppImage**

- Go to: <https://www.navicat.com/en/download/navicat-premium-lite>
- Under **Linux** → **AppImage (x86_64)** or **AppImage (aarch64)** (for ARM), use one of the direct download links.
- Or use a direct link (x86_64):
  - <https://www.navicat.com/download/direct-download?product=navicat17-premium-lite-en-x86_64.AppImage&location=1>

**2. Make it executable and run**

```bash
cd ~/Downloads  # or wherever you saved it
chmod +x navicat17-premium-lite-en-x86_64.AppImage
./navicat17-premium-lite-en-x86_64.AppImage
```

**3. (Optional) Move to a permanent location**

```bash
sudo mv navicat17-premium-lite-en-x86_64.AppImage /opt/navicat/
# Or keep it in ~/Applications or ~/bin
```

---

### Option B: Navicat Premium (14-Day Trial)

If your instructor wants the full version:

- Go to: <https://www.navicat.com/en/download/navicat-premium>
- Download the Linux AppImage for your architecture (x86_64 or aarch64)
- Same steps as above: `chmod +x` then `./<filename>.AppImage`

---

### Option C: Flatpak (Recommended on Fedora)

Run in your system terminal (not in sandboxed environments):

```bash
# One-time setup (if Flatpak is not installed)
sudo dnf install flatpak   # Fedora
# or: sudo apt install flatpak   # Debian/Ubuntu

# Install Navicat Premium Lite
flatpak install -y https://dn.navicat.com/flatpak/flatpakref/navicat17/com.navicat.premiumlite.en.flatpakref

# Run Navicat
flatpak run com.navicat.premiumlite.en
```

Or use `./tools/install-navicat.sh` (tries Flatpak first).

---

## Start Laravel Sail

Before using Navicat, the database must be running.

**1. Navigate to the project**

```bash
cd /path/to/connectly   # or your project directory
```

**2. Start Sail (including MySQL)**

```bash
./vendor/bin/sail up -d
```

**3. Verify MySQL is listening on the host**

```bash
docker ps
```

You should see the MySQL container and a port mapping like `0.0.0.0:3306->3306/tcp`. If you set `FORWARD_DB_PORT` to something else in `.env`, use that port instead.

**4. (First-time only) Run migrations**

```bash
./vendor/bin/sail artisan migrate
```

---

## Connect Navicat to MySQL

**1. Open Navicat**

**2. Create a new connection**

- Click **Connection** → **MySQL**
- Or click the **Connection** icon in the toolbar

**3. Enter connection details**

| Field | Value | Notes |
|-------|-------|-------|
| **Connection Name** | `Connectly (Sail)` | Any name you prefer |
| **Host** | `127.0.0.1` | Use `127.0.0.1`, not `mysql` |
| **Port** | `3306` | Default; change if you use `FORWARD_DB_PORT` |
| **User Name** | `sail` | From your `.env` |
| **Password** | `password` | From your `.env` |
| **Save Password** | ✓ | Optional, for convenience |

**4. Test the connection**

- Click **Test Connection**
- You should see: “Connection successful”

**5. Connect**

- Click **OK** to save
- Double-click the connection in the left panel to open it

**6. Open the database**

- Expand the connection
- Double-click `connectly_app` to work with its tables

---

## Verify the Connection

- The connection appears in the left sidebar.
- You can expand **connectly_app** and see tables such as `users`, `posts`, `comments`, `migrations`, etc.
- Right-click a table → **Open Table** to view and edit data.

---

## Common Tasks in Navicat

| Task | How |
|------|-----|
| **View tables** | Expand `connectly_app` → double-click a table |
| **Run SQL** | Right-click connection or database → **New Query** |
| **Export data** | Right-click table → **Export Wizard** |
| **Import data** | Right-click table → **Import Wizard** |
| **View structure** | Right-click table → **Design Table** |
| **Refresh** | Right-click → **Refresh** or press `F5` |

---

## Troubleshooting

### "Can't connect to MySQL server"

1. **Sail is not running**

   ```bash
   ./vendor/bin/sail up -d
   ```

2. **Port conflict**

   - If you have another MySQL on port 3306, set `FORWARD_DB_PORT=3307` in `.env` and restart Sail. Then use port `3307` in Navicat.

3. **Host is wrong**

   - Use `127.0.0.1` or `localhost`, **not** `mysql`. `mysql` only works inside the Docker network.

### "Access denied for user 'sail'"

- Confirm `.env` has:
  - `DB_USERNAME=sail`
  - `DB_PASSWORD=password`
- If you changed them, recreate the database:

  ```bash
  ./vendor/bin/sail down -v
  ./vendor/bin/sail up -d
  ./vendor/bin/sail artisan migrate
  ```

### AppImage won't run

```bash
chmod +x navicat17-premium-lite-en-x86_64.AppImage
./navicat17-premium-lite-en-x86_64.AppImage
```

If it still fails:

- Install FUSE if needed: `sudo dnf install fuse` (Fedora) or `sudo apt install fuse` (Debian/Ubuntu)
- Try the Flatpak option instead

### Database empty or no tables

```bash
./vendor/bin/sail artisan migrate
```

---

## Alternatives (if Needed)

### If your instructor insists on a specific Navicat version

- **Windows build on Linux:** Navicat also offers a Windows build bundled with Wine. Follow: <https://help.navicat.com/hc/en-us/articles/217789018-How-can-I-install-Navicat-on-Linux>.
- **Windows VM:** Run Windows in VirtualBox/VMware, install Navicat there, and connect to `10.0.2.2:3306` (VirtualBox) or your host’s IP from the VM.

### If you cannot use Navicat at all

- **Beekeeper Studio:** Open-source, cross-platform DB client
- **DBeaver:** Free, supports many databases
- **phpMyAdmin:** Web-based; can be added to Sail if needed

---

## Summary Checklist

- [ ] Navicat Premium Lite (or Premium trial) installed on Linux
- [ ] Laravel Sail started (`./vendor/bin/sail up -d`)
- [ ] Migrations run (`./vendor/bin/sail artisan migrate`)
- [ ] New MySQL connection in Navicat with `127.0.0.1`, port `3306`, user `sail`, password `password`
- [ ] Connection tested successfully
- [ ] `connectly_app` database visible with tables

---

## Reference: Project Database Configuration

From this project’s `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=mysql          # For Laravel inside Sail
DB_PORT=3306
DB_DATABASE=connectly_app
DB_USERNAME=sail
DB_PASSWORD=password
```

For Navicat on your Linux host, use:

- **Host:** `127.0.0.1` (not `mysql`)
- **Port:** `3306` (or your `FORWARD_DB_PORT` value)
- **Database:** `connectly_app`
- **Username:** `sail`
- **Password:** `password`

---

*This guide was created for the Connectly project. Last updated: February 2025.*
