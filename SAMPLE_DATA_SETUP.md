# Sample Data Setup for Aurio Music

This document explains how to populate your Firebase Realtime Database with sample music data to test the Home Tab features.

## Sample Data Location

The sample data is in `sample-songs-data.json` at the root of the repository.

## How to Import Data to Firebase

### Method 1: Using Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **aurio-music-app**
3. Navigate to **Realtime Database** in the left sidebar
4. Click on the three dots menu (⋮) at the top right
5. Select **Import JSON**
6. Choose the `sample-songs-data.json` file
7. Confirm the import

### Method 2: Using Firebase Admin SDK (Advanced)

If you have Node.js and Firebase Admin SDK set up:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');
const sampleData = require('./sample-songs-data.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://aurio-music-app-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = admin.database();

// Import songs
db.ref('songs').set(sampleData.songs);

// Import artists metadata
Object.entries(sampleData.artists).forEach(([name, data]) => {
  const artist = Object.values(sampleData.songs).find(s => s.artist === name);
  if (artist) {
    // Store artist metadata separately if needed
    db.ref(`artists/${name.replace(/\s+/g, '_')}`).set(data);
  }
});
```

## Sample Data Contents

The sample data includes **20 songs** spanning different eras and genres:

### Classic Hits (Pre-2005)
- Bohemian Rhapsody (Queen, 1975)
- Hotel California (Eagles, 1977)
- Imagine (John Lennon, 1971)
- Stairway to Heaven (Led Zeppelin, 1971)
- Hey Jude (The Beatles, 1968)
- Purple Haze (Jimi Hendrix, 1967)
- Clair de Lune (Debussy, 1905)
- And more...

### Modern Hits (2005+)
- Blinding Lights (The Weeknd, 2020)
- Shape of You (Ed Sheeran, 2017)
- Levitating (Dua Lipa, 2020)

### Song Metadata Included
Each song has:
- **title**: Song name
- **artist**: Artist name
- **album**: Album name
- **year**: Release year
- **genre**: Array of genres (e.g., ["rock", "progressive"])
- **mood**: Array of moods (e.g., ["energetic", "upbeat"])
- **tempo**: BPM (beats per minute)
- **cover**: Album artwork URL
- **url**: Audio file URL (placeholder - replace with real URLs)
- **duration**: Song length in seconds
- **globalPlayCount**: Initial play count for "Most Played" section

### Artist Metadata Included
Each artist has:
- **profilePictureUrl**: Circular profile picture
- **bio**: Artist biography
- **genres**: Array of genres

## Home Tab Features Tested

After importing, you can test:

1. **Recently Played** (2x4 grid) - Will populate as you play songs
2. **For You / AI Recommendations** - Will use song metadata to recommend based on:
   - Time of day
   - Your listening history
   - Genre/mood preferences
   - Tempo matching
3. **Old Is Gold** - Will show songs from before 2005
4. **Most Played** - Will show top 10 songs with rank badges
5. **Artists** - Will show top 6 artists with circular avatars

## Testing the AI Recommendations

The AI engine considers:
- **Morning (6am-12pm)**: Recommends energetic, upbeat songs
- **Afternoon (12pm-6pm)**: Recommends focused, productive music
- **Evening (6pm-10pm)**: Recommends calm, relaxed tracks
- **Night (10pm-6am)**: Recommends peaceful, ambient music

Listen to various songs to build your preference profile, then navigate away and back to Home to see updated recommendations!

## Troubleshooting

### No songs showing up?
- Check Firebase Console to ensure data was imported
- Check browser console for JavaScript errors
- Verify Firebase connection in `public/firebase.js`

### Recommendations not changing?
- Play at least 3-5 songs to build a preference profile
- Try at different times of day to see time-based recommendations
- Clear browser cache and reload

### Images not loading?
- The sample data uses placeholder URLs
- Replace with your own Cloudinary URLs or other image hosting
- Some Wikipedia images may have CORS restrictions

## Next Steps

1. Import the sample data
2. Create a test user account
3. Log in and explore the Home Tab
4. Play some songs to populate Recently Played
5. Check back at different times of day to see AI recommendations change
6. Upload your own songs with proper metadata

Enjoy testing Aurio Music! 🎵
