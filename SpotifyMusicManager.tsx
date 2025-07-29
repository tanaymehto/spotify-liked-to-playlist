"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronUp, Music, Share2, Zap, FolderOpen, ExternalLink, Loader2, LogIn } from "lucide-react"

export default function SpotifyMusicManager() {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [result, setResult] = useState<{ type: "success" | "error"; message: string; link?: string; tracks?: number } | null>(null)
  const [formData, setFormData] = useState({
    playlistName: "My Liked Songs",
    isPublic: false,
    songLimit: "",
  })

  // Spotify OAuth Configuration
  const SPOTIFY_CONFIG = {
    client_id: '6aa4b46ee49d40a292632af532a593b3',
    redirect_uri: 'http://127.0.0.1:3000/callback.html',
    scope: 'user-library-read playlist-modify-private playlist-modify-public'
  }

  // Check if user is logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsLoggedIn(!!token)

    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    
    if (code && !token) {
      handleOAuthCallback(code)
    }
  }, [])

  // Handle OAuth login
  const handleLogin = () => {
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `response_type=code&` +
      `client_id=${SPOTIFY_CONFIG.client_id}&` +
      `scope=${encodeURIComponent(SPOTIFY_CONFIG.scope)}&` +
      `redirect_uri=${encodeURIComponent(SPOTIFY_CONFIG.redirect_uri)}`
    
    window.location.href = authUrl
  }

  // Handle OAuth callback
  const handleOAuthCallback = async (code: string) => {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${SPOTIFY_CONFIG.client_id}:d59645a4c1ae4313a892f62a3abbabf7`)
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: SPOTIFY_CONFIG.redirect_uri
        })
      })

      const data = await response.json()
      
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token)
        setIsLoggedIn(true)
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
    }
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('access_token')
    setIsLoggedIn(false)
    setResult(null)
  }

  // Main transfer function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoggedIn) {
      setResult({
        type: "error",
        message: "Please login with Spotify first."
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const token = localStorage.getItem('access_token')
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // 1. Get User ID
      const userResponse = await fetch('https://api.spotify.com/v1/me', { headers })
      const user = await userResponse.json()

      if (!userResponse.ok) {
        throw new Error('Failed to get user information')
      }

      // 2. Create Playlist
      const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: formData.playlistName,
          description: `Auto-created from Liked Songs on ${new Date().toLocaleDateString()}`,
          public: formData.isPublic
        })
      })

      const playlist = await playlistResponse.json()

      if (!playlistResponse.ok) {
        throw new Error('Failed to create playlist')
      }

      // 3. Fetch Liked Songs
      let offset = 0
      let uris: string[] = []
      const songLimit = formData.songLimit ? parseInt(formData.songLimit) : null

      while (true) {
        const tracksResponse = await fetch(
          `https://api.spotify.com/v1/me/tracks?limit=50&offset=${offset}`,
          { headers }
        )
        const tracksData = await tracksResponse.json()

        if (!tracksResponse.ok) {
          throw new Error('Failed to fetch liked songs')
        }

        const newUris = tracksData.items.map((item: any) => item.track.uri)
        uris.push(...newUris)

        if (tracksData.items.length < 50) break
        if (songLimit && uris.length >= songLimit) {
          uris = uris.slice(0, songLimit)
          break
        }
        offset += 50
      }

      // 4. Add Songs to Playlist (100 at a time)
      const batchSize = 100
      for (let i = 0; i < uris.length; i += batchSize) {
        const batch = uris.slice(i, i + batchSize)
        
        const addResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ uris: batch })
        })

        if (!addResponse.ok) {
          throw new Error('Failed to add songs to playlist')
        }
      }

      setResult({
        type: "success",
        message: `Successfully created "${formData.playlistName}"!`,
        link: playlist.external_urls.spotify,
        tracks: uris.length
      })

    } catch (error: any) {
      setResult({
        type: "error",
        message: error.message || "An error occurred while creating the playlist."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: <FolderOpen className="w-8 h-8" />,
      title: "Organize",
      description: "Turn your massive liked songs collection into organized playlists",
    },
    {
      icon: <Share2 className="w-8 h-8" />,
      title: "Share",
      description: "Make your favorite music shareable with friends",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Fast",
      description: "Transfer hundreds of songs in seconds",
    },
  ]

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="bg-gradient-to-br from-[#1e1e1e] via-[#121212] to-[#0a0a0a] border-b border-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1db954]/5 to-transparent"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3 bg-gradient-to-r from-white via-gray-100 to-[#1db954] bg-clip-text text-transparent">
              <Music className="w-10 h-10 text-[#1db954]" />
              SyncLiked
            </h1>
            <p className="text-gray-400 text-lg">Instantly convert your liked songs into a custom playlist!</p>
          </div>
          
          {/* Login/Logout Button */}
          <div className="flex justify-center mt-6">
            {isLoggedIn ? (
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800 hover:border-gray-500"
              >
                Logout from Spotify
              </Button>
            ) : (
              <Button
                onClick={handleLogin}
                className="bg-[#1db954] hover:bg-[#1ed760] text-white font-medium py-3 px-8 rounded-[25px] transition-all duration-200 hover:scale-105"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login with Spotify
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Feature Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose SyncLiked?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-[#1e1e1e] border-gray-800 hover:border-[#1db954] transition-colors duration-300"
              >
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4 text-[#1db954]">{feature.icon}</div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400 text-center">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Main Form */}
        {isLoggedIn && (
          <section className="mb-8">
            <Card className="bg-[#1e1e1e] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-xl">Transfer Liked Songs to Playlist</CardTitle>
                <CardDescription className="text-gray-400">
                  Create a new playlist from your liked songs with custom preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="playlistName" className="text-white">
                      Playlist Name *
                    </Label>
                    <Input
                      id="playlistName"
                      type="text"
                      placeholder="Enter playlist name..."
                      value={formData.playlistName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, playlistName: e.target.value }))}
                      className="bg-[#121212] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#1db954] focus:ring-[#1db954]"
                      required
                    />
                  </div>

                  {/* Advanced Options */}
                  <div className="border-t border-gray-700 pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                      className="text-[#1db954] hover:text-[#1ed760] hover:bg-[#1db954]/10 p-0 h-auto font-medium"
                    >
                      Advanced Options
                      {isAdvancedOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                    </Button>

                    {isAdvancedOpen && (
                      <div className="mt-4 space-y-4 p-4 bg-[#121212] rounded-lg border border-gray-700">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isPublic"
                            checked={formData.isPublic}
                            onCheckedChange={(checked) =>
                              setFormData((prev) => ({ ...prev, isPublic: checked as boolean }))
                            }
                            className="border-gray-600 data-[state=checked]:bg-[#1db954] data-[state=checked]:border-[#1db954]"
                          />
                          <Label htmlFor="isPublic" className="text-white text-sm">
                            Make playlist public
                          </Label>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="songLimit" className="text-white text-sm">
                            Limit number of songs (optional)
                          </Label>
                          <Input
                            id="songLimit"
                            type="number"
                            placeholder="Leave empty for all songs"
                            value={formData.songLimit}
                            onChange={(e) => setFormData((prev) => ({ ...prev, songLimit: e.target.value }))}
                            className="bg-[#0a0a0a] border-gray-600 text-white placeholder:text-gray-500 focus:border-[#1db954] focus:ring-[#1db954]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#1db954] hover:bg-[#1ed760] text-white font-medium py-3 px-8 rounded-[25px] transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[44px]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Playlist...
                        </>
                      ) : (
                        "Transfer Liked Songs to Playlist"
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-600 text-white hover:bg-gray-800 hover:border-gray-500 py-3 px-8 rounded-[25px] transition-all duration-200 min-h-[44px] bg-transparent"
                      onClick={() => {
                        setFormData({
                          playlistName: "My Liked Songs",
                          isPublic: false,
                          songLimit: "",
                        })
                        setResult(null)
                      }}
                    >
                      Reset Form
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Results Section */}
        {result && (
          <section className="mb-8">
            <Card
              className={`border-2 ${
                result.type === "success" ? "bg-green-900/20 border-green-600" : "bg-red-900/20 border-red-600"
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className={`font-medium ${result.type === "success" ? "text-green-400" : "text-red-400"}`}>
                      {result.message}
                    </p>
                    {result.tracks && (
                      <p className="text-gray-400 text-sm mt-1">
                        Transferred {result.tracks} tracks successfully
                      </p>
                    )}
                  </div>
                  {result.link && (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-[#1db954] hover:text-[#1ed760] hover:bg-[#1db954]/10"
                    >
                      <a
                        href={result.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        Open in Spotify
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Login Prompt */}
        {!isLoggedIn && (
          <section className="mb-8">
            <Card className="bg-[#1e1e1e] border-gray-800">
              <CardContent className="pt-6 text-center">
                <p className="text-gray-400 mb-4">
                  Please login with your Spotify account to start transferring your liked songs.
                </p>
                <Button
                  onClick={handleLogin}
                  className="bg-[#1db954] hover:bg-[#1ed760] text-white font-medium py-3 px-8 rounded-[25px] transition-all duration-200 hover:scale-105"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login with Spotify
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  )
}
