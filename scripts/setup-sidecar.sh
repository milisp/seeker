#!/usr/bin/env bash
# Make the script exit immediately if any command fails
set -euo pipefail

# 1. Locate the repo root (parent of the scripts/ directory)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BIN_DIR="$PROJECT_ROOT/src-tauri/bin"

VERSION="v0.8.64"

# Create the absolute path for the binaries
mkdir -p "$BIN_DIR"

# 2. Detect OS and Architecture automatically
OS="$(uname -s)"
ARCH="$(uname -m)"

echo "Detected System: OS=$OS, ARCH=$ARCH"

# 3. Map OS and ARCH to specific sidecar configurations
case "$OS" in
Linux)
  if [ "$ARCH" = "x86_64" ]; then
    FILE="codewhale-linux-x64.tar.gz"
    TARGET_NAME="codewhale-tui-x86_64-unknown-linux-gnu"
    EXTRACT_CMD="tar -xzf $FILE"
    SRC_BIN="codewhale-linux-x64/codewhale-tui"
  else
    echo "ERROR: Unsupported Linux architecture: $ARCH"
    exit 1
  fi
  ;;
Darwin)
  if [ "$ARCH" = "x86_64" ]; then
    FILE="codewhale-macos-x64.tar.gz"
    TARGET_NAME="codewhale-tui-x86_64-apple-darwin"
    EXTRACT_CMD="tar -xzf $FILE"
    SRC_BIN="codewhale-macos-x64/codewhale-tui"
  elif [ "$ARCH" = "arm64" ]; then
    FILE="codewhale-macos-arm64.tar.gz"
    TARGET_NAME="codewhale-tui-aarch64-apple-darwin"
    EXTRACT_CMD="tar -xzf $FILE"
    SRC_BIN="codewhale-macos-arm64/codewhale-tui"
  else
    echo "ERROR: Unsupported macOS architecture: $ARCH"
    exit 1
  fi
  ;;
MINGW* | MSYS* | CYGWIN*)
  if [ "$ARCH" = "x86_64" ]; then
    FILE="codewhale-windows-x64.zip"
    TARGET_NAME="codewhale-tui-x86_64-pc-windows-msvc.exe"
    EXTRACT_CMD="unzip -o $FILE"
    SRC_BIN="codewhale-windows-x64/codewhale-tui.exe"
  else
    echo "ERROR: Unsupported Windows architecture: $ARCH"
    exit 1
  fi
  ;;
*)
  echo "ERROR: Unsupported Operating System: $OS"
  exit 1
  ;;
esac

# 4. Create a temporary folder for downloading and extracting
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Downloading $FILE to temporary directory..."
curl -L "https://github.com/Hmbown/CodeWhale/releases/download/${VERSION}/${FILE}" -o "$TMP_DIR/$FILE"

echo "Extracting $FILE ..."
cd "$TMP_DIR"
$EXTRACT_CMD

# Debug check: List extracted files if SRC_BIN is missing
if [ ! -f "$SRC_BIN" ]; then
  echo "ERROR: Expected binary '$SRC_BIN' not found!"
  echo "Actual directory structure was:"
  find . -maxdepth 3
  exit 1
fi

# 5. Move and rename to the Tauri sidecar path
echo "Setting up sidecar binary to $BIN_DIR/$TARGET_NAME ..."
mv "$SRC_BIN" "$BIN_DIR/$TARGET_NAME"

# 6. Ensure it's executable
chmod +x "$BIN_DIR/$TARGET_NAME"

echo "Successfully installed sidecar to $BIN_DIR/$TARGET_NAME"
