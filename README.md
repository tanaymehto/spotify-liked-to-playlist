# SyncLiked - Spotify Playlist Manager

🎵 Instantly convert your liked songs into custom playlists!

## Features
- ✅ OAuth login with Spotify
- ✅ Transfer all liked songs to a new playlist
- ✅ Batch processing for large song collections
- ✅ Public/private playlist options
- ✅ Song limit controls
- ✅ Beautiful Spotify-themed UI

## Live Demo
🎵 **[Try SyncLiked Live](https://spotify-liked-to-playlist.vercel.app/)** 🎵

*Convert your Spotify liked songs to playlists instantly!*

## Setup for Development
1. Clone this repository
2. Start a local server: `python -m http.server 3000`
3. Visit `http://127.0.0.1:3000`
4. Login with Spotify and start creating playlists!

## Deployment
This app is deployed on Vercel and works with both localhost and production URLs automatically. To deploy your own instance:

1. Fork this repository
2. Connect to Vercel or drag-drop the files
3. Add your production URL to Spotify app settings:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Add `https://your-domain.vercel.app/callback.html` to Redirect URIs

## Technologies Used
- React 18 (CDN)
- Tailwind CSS
- Spotify Web API
- OAuth 2.0 Authorization Code Flow

## Contributing
Feel free to submit issues and pull requests!
