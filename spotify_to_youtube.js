const SPOTIFY_CLIENT_ID = "";

const SPOTIFY_CLIENT_SECRET = "";

const YOUTUBE_API_KEY = "";

async function main() {
    const playlistUrl = await promptInput("Enter Spotify Playlist URL");
    if (!playlistUrl) return;

    try {
        // Fetch Spotify Access Token
        const accessToken = await getSpotifyAccessToken();
        console.log("Access Token:", accessToken);

        // Extract Playlist ID
        const playlistId = getSpotifyPlaylistId(playlistUrl);

        // Fetch Playlist Tracks
        const tracks = await getSpotifyPlaylistTracks(playlistId, accessToken);
        console.log(`Found ${tracks.length} tracks in the playlist.`);

        const youtubeLinks = [];

        for (const track of tracks) {
            console.log(`Searching YouTube for: ${track}`);
            const youtubeLink = await searchYouTube(track);

            if (youtubeLink) {
                youtubeLinks.push({ track, youtubeLink });
                console.log(`Found: ${youtubeLink}`);
            }
        }

        // Display the tracks and links in a popup
        await showLinksPopup(playlistUrl, youtubeLinks);
    } catch (err) {
        console.error("Error:", err.message);
    }
}

// Fetch Spotify API Access Token
async function getSpotifyAccessToken() {
    const url = "https://accounts.spotify.com/api/token";
    const headers = {
        Authorization: "Basic " + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
        "Content-Type": "application/x-www-form-urlencoded",
    };

    const body = "grant_type=client_credentials";

    const req = new Request(url);
    req.method = "POST";
    req.headers = headers;
    req.body = body;

    const response = await req.loadJSON();
    console.log("Spotify Token Response:", response);
    return response.access_token;
}

// Extract Playlist ID from Spotify URL
function getSpotifyPlaylistId(playlistUrl) {
    const parts = playlistUrl.split("/");
    return parts[4].split("?")[0];
}

// Fetch Tracks from Spotify Playlist
async function getSpotifyPlaylistTracks(playlistId, accessToken) {
    const tracks = [];
    let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

    while (url) {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
        };

        const req = new Request(url);
        req.method = "GET";
        req.headers = headers;

        const response = await req.loadJSON();
        console.log("Spotify Tracks Response:", response);

        // Extract track names, artists, and Spotify URLs
        response.items.forEach((item) => {
            const track = item.track;
            const trackName = track.name;
            const artists = track.artists.map((artist) => artist.name).join(", ");
            const spotifyUrl = track.external_urls.spotify;
            tracks.push(`${trackName} by ${artists}`);
        });

        // Handle pagination
        url = response.next;
    }

    return tracks;
}

// Search for a Track on YouTube
async function searchYouTube(query) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
    )}&key=${YOUTUBE_API_KEY}&type=video&maxResults=1`;

    const req = new Request(url);
    const response = await req.loadJSON();
    console.log(response);

    if (response.items && response.items.length > 0) {
        const videoId = response.items[0].id.videoId;
        return `https://www.youtube.com/watch?v=${videoId}`;
    }

    return null;
}

// Prompt Input Dialog
async function promptInput(promptText) {
    const alert = new Alert();
    alert.title = promptText;
    alert.addTextField();
    alert.addAction("OK");
    alert.addCancelAction("Cancel");

    const idx = await alert.presentAlert();
    return idx === -1 ? null : alert.textFieldValue(0); // Cancel pressed
}

// Show Links in a Popup
async function showLinksPopup(playlistUrl, links) {
    if (links.length === 0) {
        const noLinksAlert = new Alert();
        noLinksAlert.title = "YouTube Links";
        noLinksAlert.message = "No YouTube links found.";
        noLinksAlert.addAction("Close");
        await noLinksAlert.presentAlert();
        return;
    }

    let keepRunning = true

    while (keepRunning) {
        const alert = new Alert();
        alert.title = "YouTube Links";

        links.forEach((link) => alert.addAction(link.track));

        alert.addAction("Copy All Links");
        alert.addCancelAction("Close");

        const idx = await alert.presentAlert();
        console.log(idx)

        if (idx === -1) {
            // "Close" was selected
            keepRunning = false;
        }
        else if (idx === links.length) {
            // Generate a shareable message
            const youtubeLinksMessage = links
                .map((link) => `${link.track}: ${link.youtubeLink}`)
                .join("\n\n");
            const message = `Spotify:\n${playlistUrl}\n\nYouTube links:\n\n${youtubeLinksMessage}`
            console.log(message)

            Pasteboard.copy(message);

            const copyAlert = new Alert();
            copyAlert.title = "Links Copied";
            copyAlert.message = "The YouTube and Spotify links have been copied to your clipboard.";
            copyAlert.addAction("OK");
            await copyAlert.present();
        } else if (idx >= 0 && links[idx]) {
            // A specific link was selected, open it in Safari
            console.log(links[idx].youtubeLink)
            Safari.open(links[idx].youtubeLink);
        }
    }
}

// Start the app
main();