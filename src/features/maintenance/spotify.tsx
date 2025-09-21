import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Plus } from "lucide-react";

interface Playlist {
  id: number;
  name: string;
  description: string;
  image: string;
  tracks: number;
  duration: string;
}

interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  image: string;
}

export default function Spotify() {
  const [currentPlaylist, setCurrentPlaylist] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([50]);

  const playlists: Playlist[] = [
    {
      id: 1,
      name: "Coding Focus",
      description: "Deep focus music for programming sessions",
      image: "/placeholder.jpg",
      tracks: 15,
      duration: "1h 24m"
    },
    {
      id: 2,
      name: "Energy Boost",
      description: "Upbeat tracks to keep you motivated",
      image: "/placeholder.jpg",
      tracks: 12,
      duration: "58m"
    },
    {
      id: 3,
      name: "Chill Vibes",
      description: "Relaxing music for late night coding",
      image: "/placeholder.jpg",
      tracks: 10,
      duration: "45m"
    }
  ];

  const tracks: Record<number, Track[]> = {
    1: [
      { id: 1, title: "Lofi Beats", artist: "Chillhop Music", album: "Lofi Coding", duration: "3:45", image: "/placeholder.jpg" },
      { id: 2, title: "Focus Flow", artist: "Deep Concentration", album: "Productive Sounds", duration: "4:20", image: "/placeholder.jpg" },
      { id: 3, title: "Code Waves", artist: "Dev Sounds", album: "Programming Rhythm", duration: "3:15", image: "/placeholder.jpg" },
    ],
    2: [
      { id: 4, title: "Energy Pulse", artist: "Workout Beats", album: "Motivation Mix", duration: "3:30", image: "/placeholder.jpg" },
      { id: 5, title: "Power Up", artist: "Boosted Sounds", album: "Energy Pack", duration: "4:10", image: "/placeholder.jpg" },
    ],
    3: [
      { id: 6, title: "Calm Breeze", artist: "Relaxing Tunes", album: "Chill Collection", duration: "5:25", image: "/placeholder.jpg" },
      { id: 7, title: "Smooth Coding", artist: "Late Night Dev", album: "Night Owl", duration: "4:45", image: "/placeholder.jpg" },
    ]
  };

  const currentTracks = tracks[currentPlaylist] || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Spotify Integration</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Playlist
        </Button>
      </div>

      <Tabs defaultValue="playlists" className="w-full">
        <TabsList>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="player">Player</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="playlists" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <Card 
                key={playlist.id} 
                className={`cursor-pointer transition-all hover:scale-105 ${
                  currentPlaylist === playlist.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setCurrentPlaylist(playlist.id)}
              >
                <CardContent className="p-0">
                  <div className="aspect-square w-full bg-muted flex items-center justify-center">
                    <div className="text-4xl">🎵</div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">{playlist.description}</p>
                    <div className="flex justify-between items-center mt-3 text-sm text-muted-foreground">
                      <span>{playlist.tracks} tracks</span>
                      <span>{playlist.duration}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="player">
          <Card>
            <CardHeader>
              <CardTitle>Now Playing</CardTitle>
              <CardDescription>
                {playlists.find(p => p.id === currentPlaylist)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-2xl">🎵</div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-xl">Lofi Beats</h3>
                  <p className="text-muted-foreground">Chillhop Music</p>
                  <p className="text-sm text-muted-foreground">Lofi Coding • 3:45</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-1 bg-muted rounded-full">
                  <div className="h-1 bg-primary rounded-full w-1/3"></div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1:15</span>
                  <span>3:45</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button variant="ghost" size="icon">
                  <Shuffle className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  className="w-12 h-12"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </Button>
                <Button variant="ghost" size="icon">
                  <SkipForward className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Repeat className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-8">{volume}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Playlist Tracks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currentTracks.map((track) => (
                  <div key={track.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <div className="text-lg">🎵</div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{track.title}</h4>
                      <p className="text-sm text-muted-foreground">{track.artist}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">{track.duration}</div>
                    <Button variant="ghost" size="icon">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Spotify Settings</CardTitle>
              <CardDescription>
                Configure your Spotify integration preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Default Playlist</h4>
                <Select value={currentPlaylist.toString()} onValueChange={(v) => setCurrentPlaylist(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default playlist" />
                  </SelectTrigger>
                  <SelectContent>
                    {playlists.map((playlist) => (
                      <SelectItem key={playlist.id} value={playlist.id.toString()}>
                        {playlist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Auto-play</h4>
                <div className="flex items-center gap-2">
                  <Input type="checkbox" id="autoplay" className="w-4 h-4" />
                  <label htmlFor="autoplay" className="text-sm">
                    Automatically play music when opening the app
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Volume Preset</h4>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  step={1}
                />
                <div className="text-sm text-muted-foreground">
                  Default volume: {volume}%
                </div>
              </div>

              <Button className="w-full">Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}