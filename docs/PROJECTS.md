# Projects Overview

*Last updated: 2026-06-25*
*Session: Footer cleanup + GitHub Actions storage cleanup*

---

## Projects Table

| # | Repository | Private | Server (Deploy) | PM2 | Port | Purpose |
|---|-----------|---------|-----------------|-----|------|---------|
| 1 | [et3am](https://github.com/Amr1977/et3am) | Public | AWS (api.et3am.com) | `et3am-backend` | 3002 | Food donation platform |
| 2 | [commerce-platform](https://github.com/Amr1977/commerce-platform) | Private | AWS | `commerce-backend` | 3000 | E-commerce platform |
| 3 | [hafsa](https://github.com/Amr1977/hafsa) | - | AWS | `hafsa-backend` | 3001 | Hafsa project |
| 4 | [matrix-delivery](https://github.com/Amr1977/matrix-delivery) | Public | AWS | `matrix-delivery-backend` | 5000 | Delivery platform |
| 5 | [smartmart](https://github.com/Amr1977/smartmart) | Private | AWS | `smartmart-backend` | - | Smart shopping |
| 6 | [quran_lights_web](https://github.com/Amr1977/quran_lights_web) | Public | Firebase | - | - | Quran lights web app |
| 7 | [OMAR](https://github.com/Amr1977/OMAR) | Public | - | - | - | Marketing agent |
| 8 | [shared-knowledge-base](https://github.com/Amr1977/shared-knowledge-base) | Private | - | - | - | KB docs (git submodule) |
| 9 | [quran-lights-v2](https://github.com/Amr1977/quran-lights-v2) | Private | - | - | - | Quran lights v2 |
| 10 | [MasjidConnect](https://github.com/Amr1977/MasjidConnect) | Public | - | - | - | Mosque directory |
| 11 | [food-delivery-multivendor](https://github.com/Amr1977/food-delivery-multivendor) | Public | - | - | - | Multi-vendor food delivery |
| 12 | [islamic-lighthouse](https://github.com/Amr1977/islamic-lighthouse) | Private | - | - | - | Islamic content |
| 13 | [farmlife](https://github.com/Amr1977/farmlife) | Private | - | - | - | Agriculture platform |
| 14 | [agrorush](https://github.com/Amr1977/agrorush) | Private | - | - | - | Agriculture platform |
| 15 | [grocery-pos](https://github.com/Amr1977/grocery-pos) | Public | - | - | - | POS system |
| 16 | [youtubeqa](https://github.com/Amr1977/youtubeqa) | Private | - | - | - | YouTube QA |
| 17 | [hr](https://github.com/Amr1977/hr) | Private | - | - | - | HR system |
| 18 | [other repos](https://github.com/Amr1977?tab=repositories) | Mixed | - | - | - | Misc (autoq, queuemaster, flashcards, etc.) |

## Active Deployment Projects (on AWS server 13.60.80.165)

| Repo | Local Path | PM2 Name | Port | Deploy Command |
|------|-----------|----------|------|---------------|
| et3am | `/home/ec2-user/et3am` | `et3am-backend` | 3002 | `git pull && cd backend && npm install && npm run build && pm2 restart et3am-backend` |
| commerce-platform | `/home/ec2-user/commerce-platform` | `commerce-backend` | 3000 | (separate project) |
| hafsa | `/home/ec2-user/hafsa` | `hafsa-backend` | 3001 | (separate project) |
| matrix-delivery | `/home/ec2-user/matrix-delivery` | `matrix-delivery-backend` | 5000 | (separate project) |
| smartmart | `/home/ec2-user/smartmart` | `smartmart-backend` | - | (separate project) |

## GitHub Actions Artifact Storage

**Current storage (June 2026): ~53 GB across 6 repos (way over 500MB free limit)**

### Artifact Breakdown

| Repo | Artifacts | Est. Storage | Artifact Pattern |
|------|-----------|-------------|-----------------|
| et3am | 63 | ~19.9 GB | `et3am-electron-{platform}` |
| quran_lights_web | 99 | ~24.8 GB | `quran-lights-electron-{platform}`, `quran-lights-android` |
| commerce-platform | 65 | ~3.1 GB | `matrixshops-electron-{platform}`, `matrixshops-apk`, `matrixshops-release` |
| smartmart | 6 | ~2.1 GB | `smartmart-{platform}` |
| OMAR | 9 | ~3.0 GB | `omar-{platform}` |
| grocery-pos | 2 | ~0 GB | - |

### Cleanup Executed (2026-06-25)
- **Deleted 209 artifacts** across 6 repos
- **Freed ~47.7 GB** (53 GB → ~5 GB)
- Kept only the **latest artifact per unique name** per repo
- Remaining: ~5 GB (latest builds per platform, kept as "release executables")

### Remaining Artifact Storage (~5 GB)

| Repo | Artifacts | Est. Size | Platforms Kept |
|------|-----------|-----------|----------------|
| et3am | 3 | ~945 MB | win/mac/linux |
| quran_lights_web | 5 | ~1 GB | win/mac/linux/android/release |
| commerce-platform | 5 | ~978 MB | win/mac/linux/apk/release |
| smartmart | 3 | ~1 GB | win/mac/linux |
| OMAR | 3 | ~1 GB | win/mac/linux |

### Future Recommendation
- Add `retention-days: 14` or `retention-days: 30` to GitHub Actions workflow upload-artifact steps to auto-expire old builds
- Use GitHub Releases (with attached binaries) for permanent storage of versioned releases
