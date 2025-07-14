# GitHub Actions Workflows

This directory contains GitHub Actions workflows for building and releasing the Shader Live Coding application.

## Workflows

### publish.yml
Triggered when a new version tag (e.g., `v1.0.0`) is pushed. This workflow:
- Builds the application for macOS (ARM64 & x86_64), Windows, and Linux
- Creates a GitHub release with the built binaries
- Uploads the artifacts to the release

### test-build.yml
Triggered on pushes to main/feature branches and pull requests. This workflow:
- Runs tests
- Builds the application to ensure it compiles correctly
- Does not create any releases

## Creating a Release

To create a new release:

1. Update the version in `package.json` and `src-tauri/Cargo.toml`
2. Commit the changes
3. Create and push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. The publish workflow will automatically build and release the binaries

## Required Secrets

The workflows use the default `GITHUB_TOKEN` which is automatically provided by GitHub Actions. No additional secrets need to be configured.

## Platform-specific Notes

### macOS
- Builds for both Apple Silicon (M1/M2) and Intel architectures
- Creates `.dmg` installer files

### Windows
- Creates `.msi` installer files
- Requires Windows code signing certificate for production releases (optional)

### Linux
- Creates `.AppImage` and `.deb` packages
- Requires system dependencies installed during the build process