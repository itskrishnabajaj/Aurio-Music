// Aurio Admin Panel - Fixed Version
// All bugs resolved

const ADMIN_PASSWORD = 'admin123';

const firebaseConfig = {
    apiKey: "AIzaSyCMY1H6-QLhtUfo6J42Al3DkfAkd1b6qcE",
    authDomain: "aurio-music-app.firebaseapp.com",
    databaseURL: "https://aurio-music-app-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "aurio-music-app",
    storageBucket: "aurio-music-app.firebasestorage.app",
    messagingSenderId: "849403275884",
    appId: "1:849403275884:web:79a001b4cc1837c2260649"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let allSongs = [];
let allUsers = [];
let allPlaylists = [];
let allArtists = [];
let selectedPlaylistSongs = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    initAdminPanel();
});

function checkAdminAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    
    if (isLoggedIn === 'true') {
        showAdminPanel();
    } else {
        showAdminLogin();
    }
}

function showAdminLogin() {
    document.getElementById('adminLogin').classList.add('active');
    document.getElementById('adminPanel').classList.remove('active');
}

function showAdminPanel() {
    document.getElementById('adminLogin').classList.remove('active');
    document.getElementById('adminPanel').classList.add('active');
    loadAllData();
}

function initAdminPanel() {
    document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
    document.getElementById('adminLogout').addEventListener('click', handleAdminLogout);
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.getAttribute('data-view');
            switchView(viewName);
        });
    });
    
    initUploadZone();
    
    document.getElementById('songSearchInput').addEventListener('input', handleSongSearch);
    document.getElementById('artistSearchInput').addEventListener('input', handleArtistSearch);
    document.getElementById('createPlaylistBtn').addEventListener('click', showCreatePlaylistModal);
    document.getElementById('createPlaylistForm').addEventListener('submit', handleCreatePlaylist);
    document.getElementById('playlistSongSearch').addEventListener('input', handlePlaylistSongSearch);
    document.getElementById('editSongForm').addEventListener('submit', handleEditSong);
    document.getElementById('editArtistForm').addEventListener('submit', handleEditArtist);
}

function handleAdminLogin(e) {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showAdminPanel();
        errorDiv.textContent = '';
    } else {
        errorDiv.textContent = 'Invalid password';
    }
}

function handleAdminLogout() {
    sessionStorage.removeItem('adminLoggedIn');
    showAdminLogin();
}

function switchView(viewName) {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    
    navItems.forEach(item => item.classList.remove('active'));
    views.forEach(view => view.classList.remove('active'));
    
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
    document.getElementById(`${viewName}View`).classList.add('active');
    
    if (viewName === 'analytics') renderAnalytics();
    if (viewName === 'songs') renderSongs();
    if (viewName === 'artists') renderArtists();
    if (viewName === 'playlists') renderPlaylists();
    if (viewName === 'users') renderUsers();
}

async function loadAllData() {
    console.log('Loading all data...');
    
    await Promise.all([
        loadSongs(),
        loadUsers(),
        loadPlaylists()
    ]);
    
    // Process artists after songs are loaded
    processArtists();
    
    console.log(`Loaded: ${allSongs.length} songs, ${allUsers.length} users, ${allArtists.length} artists`);
    
    renderAnalytics();
}

function loadSongs() {
    return new Promise((resolve) => {
        db.ref('songs').once('value', (snapshot) => {
            const data = snapshot.val();
            allSongs = [];
            
            if (data) {
                allSongs = Object.keys(data).map(id => ({ id, ...data[id] }));
                console.log('Songs loaded:', allSongs.length);
            } else {
                console.log('No songs found in database');
            }
            
            resolve();
        }, (error) => {
            console.error('Error loading songs:', error);
            resolve();
        });
    });
}

function loadUsers() {
    return new Promise((resolve) => {
        db.ref('users').once('value', (snapshot) => {
            const data = snapshot.val();
            allUsers = [];
            
            if (data) {
                allUsers = Object.keys(data).map(id => ({ id, ...data[id] }));
                console.log('Users loaded:', allUsers.length);
            } else {
                console.log('No users found in database');
            }
            
            resolve();
        }, (error) => {
            console.error('Error loading users:', error);
            resolve();
        });
    });
}

function loadPlaylists() {
    return new Promise((resolve) => {
        db.ref('playlists').once('value', (snapshot) => {
            const data = snapshot.val();
            allPlaylists = [];
            
            if (data) {
                // Playlists are organized by userId
                Object.keys(data).forEach(userId => {
                    const userPlaylists = data[userId];
                    Object.keys(userPlaylists).forEach(playlistId => {
                        allPlaylists.push({
                            id: playlistId,
                            userId: userId,
                            ...userPlaylists[playlistId]
                        });
                    });
                });
                console.log('Playlists loaded:', allPlaylists.length);
            } else {
                console.log('No playlists found in database');
            }
            
            resolve();
        }, (error) => {
            console.error('Error loading playlists:', error);
            resolve();
        });
    });
}

function processArtists() {
    const artistData = {};
    
    allSongs.forEach(song => {
        if (song.artist) {
            if (!artistData[song.artist]) {
                artistData[song.artist] = {
                    name: song.artist,
                    songs: [],
                    totalPlays: 0
                };
            }
            artistData[song.artist].songs.push(song);
            artistData[song.artist].totalPlays += (song.playCount || 0);
        }
    });
    
    // Load artist profiles from database
    db.ref('artists').once('value', (snapshot) => {
        const profiles = snapshot.val() || {};
        
        allArtists = Object.keys(artistData).map(name => {
            const key = encodeArtistKey(name);
            const profile = profiles[key] || {};
            return {
                name,
                songCount: artistData[name].songs.length,
                totalPlays: artistData[name].totalPlays,
                cover: profile.cover || '',
                bio: profile.bio || '',
                genres: profile.genres || []
            };
        });
        
        console.log('Artists processed:', allArtists.length);
    });
}

function renderAnalytics() {
    const totalSongs = allSongs.length;
    const activeUsers = allUsers.filter(u => {
        const status = u.status || (u.approved === true ? 'approved' : 'pending');
        return status === 'approved';
    }).length;
    const totalPlays = allSongs.reduce((sum, song) => sum + (song.playCount || 0), 0);
    const estimatedSize = (allSongs.length * 4).toFixed(1);
    
    document.getElementById('totalSongs').textContent = totalSongs;
    document.getElementById('activeUsers').textContent = activeUsers;
    document.getElementById('totalPlays').textContent = totalPlays.toLocaleString();
    document.getElementById('storageUsed').textContent = `${estimatedSize} MB`;
    
    renderTopSongs();
    renderPendingApprovals();
    
    // Render enhanced analytics
    if (typeof renderGenreChart === 'function') {
        renderGenreChart();
    }
    if (typeof renderUserEngagement === 'function') {
        renderUserEngagement();
    }
}

function renderTopSongs() {
    const sorted = [...allSongs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 10);
    const container = document.getElementById('topSongsList');
    
    if (sorted.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No data available</p>';
        return;
    }
    
    container.innerHTML = sorted.map((song, index) => `
        <div class="top-song-item">
            <div class="song-rank">#${index + 1}</div>
            <img src="${song.cover || song.coverUrl || 'https://via.placeholder.com/60'}" 
                 alt="${escapeHtml(song.title)}" 
                 class="top-song-cover"
                 onerror="this.src='https://via.placeholder.com/60?text=♪'">
            <div class="top-song-info">
                <div class="top-song-title">${escapeHtml(song.title)}</div>
                <div class="top-song-artist">${escapeHtml(song.artist)}</div>
            </div>
            <div class="top-song-plays">${(song.playCount || 0).toLocaleString()} plays</div>
        </div>
    `).join('');
}

function renderPendingApprovals() {
    const pending = allUsers.filter(u => {
        const status = u.status || (u.approved === true ? 'approved' : 'pending');
        return status === 'pending';
    });
    
    // If there's a pending approvals section, update it
    const pendingContainer = document.getElementById('pendingApprovals');
    if (pendingContainer) {
        if (pending.length === 0) {
            pendingContainer.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No pending approvals</p>';
        } else {
            pendingContainer.innerHTML = `
                <div class="pending-badge">${pending.length} pending approval${pending.length > 1 ? 's' : ''}</div>
                ${pending.slice(0, 5).map(user => `
                    <div class="pending-user-item">
                        <div>
                            <div class="pending-user-name">${escapeHtml(user.username)}</div>
                            <div class="pending-user-email">${user.email || user.username + '@aurio.app'}</div>
                        </div>
                        <button class="btn-approve-small" onclick="approveUser('${user.id}')">Approve</button>
                    </div>
                `).join('')}
                ${pending.length > 5 ? `<p style="text-align: center; color: var(--text-secondary); margin-top: 12px;">+${pending.length - 5} more</p>` : ''}
            `;
        }
    }
}

// UPLOAD WITH AUTO-METADATA EXTRACTION
function initUploadZone() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type === 'audio/mpeg' || file.type === 'audio/mp3' || file.type === 'audio/m4a'
        );
        
        if (files.length > 0) {
            handleFilesUpload(files);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            handleFilesUpload(files);
        }
        fileInput.value = '';
    });
}

async function handleFilesUpload(files) {
    const queueContainer = document.getElementById('uploadQueue');
    
    console.log(`Starting upload of ${files.length} file(s)`);
    
    for (const file of files) {
        const uploadId = Date.now() + Math.random();
        const uploadItem = createUploadItem(uploadId, file);
        queueContainer.appendChild(uploadItem);
        
        console.log(`Processing file: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        await processAndUploadFile(file, uploadId);
    }
}

function createUploadItem(uploadId, file) {
    const div = document.createElement('div');
    div.className = 'upload-item';
    div.id = `upload-${uploadId}`;
    
    div.innerHTML = `
        <div class="upload-item-header">
            <div class="upload-item-icon">🎵</div>
            <div class="upload-item-info">
                <div class="upload-item-name">${escapeHtml(file.name)}</div>
                <div class="upload-item-meta">Extracting metadata...</div>
            </div>
        </div>
        <div class="upload-progress">
            <div class="upload-progress-bar" style="width: 0%"></div>
        </div>
        <div class="upload-status">Preparing...</div>
    `;
    
    return div;
}

async function processAndUploadFile(file, uploadId) {
    const itemEl = document.getElementById(`upload-${uploadId}`);
    const progressBar = itemEl.querySelector('.upload-progress-bar');
    const statusEl = itemEl.querySelector('.upload-status');
    const metaEl = itemEl.querySelector('.upload-item-meta');
    
    try {
        // Extract metadata using jsmediatags
        statusEl.textContent = 'Reading ID3 tags...';
        
        const metadata = await extractMetadata(file);
        
        metaEl.textContent = `${metadata.title} - ${metadata.artist}`;
        statusEl.textContent = 'Uploading audio...';
        progressBar.style.width = '10%';
        
        // Upload audio file
        const audioFormData = new FormData();
        audioFormData.append('file', file);
        audioFormData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        audioFormData.append('resource_type', 'video');
        
        const audioResponse = await fetch(`${CLOUDINARY_URL}/video/upload`, {
            method: 'POST',
            body: audioFormData
        });
        
        if (!audioResponse.ok) {
            throw new Error('Audio upload failed');
        }
        
        const audioData = await audioResponse.json();
        progressBar.style.width = '50%';
        
        // Upload cover if available
        let coverUrl = '';
        
        if (metadata.coverBlob) {
            try {
                statusEl.textContent = 'Uploading cover art...';
                
                const coverFormData = new FormData();
                coverFormData.append('file', metadata.coverBlob);
                coverFormData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
                
                const coverResponse = await fetch(`${CLOUDINARY_URL}/image/upload`, {
                    method: 'POST',
                    body: coverFormData
                });
                
                if (coverResponse.ok) {
                    const coverData = await coverResponse.json();
                    coverUrl = coverData.secure_url;
                }
                progressBar.style.width = '80%';
            } catch (coverError) {
                console.warn('Cover upload failed, continuing without cover:', coverError);
                progressBar.style.width = '80%';
            }
        } else {
            progressBar.style.width = '80%';
        }
        
        // Save to database
        statusEl.textContent = 'Saving to database...';
        
        const songData = {
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album || '',
            year: metadata.year || '',
            genre: metadata.genre || '',
            mood: '',
            url: audioData.secure_url,
            audioUrl: audioData.secure_url,
            cover: coverUrl,
            coverUrl: coverUrl,
            duration: audioData.duration || 0,
            uploadedAt: Date.now(),
            playCount: 0
        };
        
        await db.ref('songs').push(songData);
        
        progressBar.style.width = '100%';
        statusEl.textContent = 'Upload complete!';
        statusEl.classList.add('success');
        
        // Reload songs
        await loadSongs();
        processArtists();
        
        setTimeout(() => {
            itemEl.remove();
        }, 3000);
        
    } catch (error) {
        console.error('Upload error:', error);
        statusEl.textContent = `Upload failed: ${error.message}`;
        statusEl.classList.add('error');
    }
}

function extractMetadata(file) {
    return new Promise((resolve) => {
        const defaultMetadata = {
            title: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Unknown Artist',
            album: '',
            year: '',
            genre: '',
            coverBlob: null
        };
        
        jsmediatags.read(file, {
            onSuccess: (tag) => {
                const tags = tag.tags;
                const metadata = {
                    title: tags.title || defaultMetadata.title,
                    artist: tags.artist || defaultMetadata.artist,
                    album: tags.album || '',
                    year: tags.year || '',
                    genre: tags.genre || '',
                    coverBlob: null
                };
                
                // Extract embedded cover art
                if (tags.picture) {
                    try {
                        const picture = tags.picture;
                        const byteArray = new Uint8Array(picture.data);
                        const blob = new Blob([byteArray], { type: picture.format });
                        metadata.coverBlob = blob;
                    } catch (err) {
                        console.warn('Failed to extract cover art:', err);
                    }
                }
                
                resolve(metadata);
            },
            onError: (error) => {
                console.warn('Metadata extraction failed:', error);
                resolve(defaultMetadata);
            }
        });
    });
}

// SONGS MANAGEMENT
function renderSongs() {
    const container = document.getElementById('songsList');
    
    if (allSongs.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">No songs uploaded</p>';
        return;
    }
    
    renderSongCards(allSongs, container);
}

function renderSongCards(songs, container) {
    container.innerHTML = songs.map(song => `
        <div class="song-card-admin">
            <img src="${song.cover || song.coverUrl || 'https://via.placeholder.com/280'}" 
                 alt="${escapeHtml(song.title)}"
                 onerror="this.src='https://via.placeholder.com/280?text=♪'">
            <div class="song-card-body">
                <div class="song-card-title">${escapeHtml(song.title)}</div>
                <div class="song-card-artist">${escapeHtml(song.artist)}</div>
                <div class="song-card-meta">
                    ${song.album ? `<span class="meta-tag">${escapeHtml(song.album)}</span>` : ''}
                    ${song.year ? `<span class="meta-tag">${song.year}</span>` : ''}
                    ${song.genre ? `<span class="meta-tag">${escapeHtml(song.genre)}</span>` : ''}
                    ${song.mood ? `<span class="meta-tag">${escapeHtml(song.mood)}</span>` : ''}
                    <span class="meta-tag">${(song.playCount || 0)} plays</span>
                </div>
                <div class="song-card-actions">
                    <button class="btn-edit" onclick="editSong('${song.id}')">Edit</button>
                    <button class="btn-delete" onclick="deleteSong('${song.id}', '${escapeHtml(song.title)}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function handleSongSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    const container = document.getElementById('songsList');
    
    if (!query) {
        renderSongCards(allSongs, container);
        return;
    }
    
    const filtered = allSongs.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        (song.album && song.album.toLowerCase().includes(query))
    );
    
    renderSongCards(filtered, container);
}

function editSong(songId) {
    const song = allSongs.find(s => s.id === songId);
    if (!song) return;
    
    document.getElementById('editSongId').value = songId;
    document.getElementById('editTitle').value = song.title;
    document.getElementById('editArtist').value = song.artist;
    document.getElementById('editAlbum').value = song.album || '';
    document.getElementById('editYear').value = song.year || '';
    
    // Set genre checkboxes
    const genreContainer = document.getElementById('editGenre');
    const genreCheckboxes = genreContainer.querySelectorAll('input[type="checkbox"]');
    genreCheckboxes.forEach(cb => {
        const songGenres = Array.isArray(song.genres) ? song.genres : 
                          (typeof song.genre === 'string' ? [song.genre] : []);
        cb.checked = songGenres.includes(cb.value);
    });
    
    // Set mood checkboxes
    const moodContainer = document.getElementById('editMood');
    const moodCheckboxes = moodContainer.querySelectorAll('input[type="checkbox"]');
    moodCheckboxes.forEach(cb => {
        const songMood = Array.isArray(song.mood) ? song.mood : (song.mood ? [song.mood] : []);
        cb.checked = songMood.includes(cb.value);
    });
    
    document.getElementById('editDuration').value = song.duration || '';
    
    document.getElementById('editSongModal').classList.add('active');
}

function closeEditSongModal() {
    document.getElementById('editSongModal').classList.remove('active');
}

async function handleEditSong(e) {
    e.preventDefault();
    
    const songId = document.getElementById('editSongId').value;
    const title = document.getElementById('editTitle').value.trim();
    const artist = document.getElementById('editArtist').value.trim();
    const album = document.getElementById('editAlbum').value.trim();
    const year = document.getElementById('editYear').value;
    
    // Get selected genres
    const genreCheckboxes = document.querySelectorAll('#editGenre input[type="checkbox"]:checked');
    const genres = Array.from(genreCheckboxes).map(cb => cb.value);
    
    // Get selected moods
    const moodCheckboxes = document.querySelectorAll('#editMood input[type="checkbox"]:checked');
    const moods = Array.from(moodCheckboxes).map(cb => cb.value);
    
    const coverFile = document.getElementById('editCoverFile').files[0];
    
    try {
        const song = allSongs.find(s => s.id === songId);
        let coverUrl = song.cover || song.coverUrl;
        
        if (coverFile) {
            const coverFormData = new FormData();
            coverFormData.append('file', coverFile);
            coverFormData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
            
            const coverResponse = await fetch(`${CLOUDINARY_URL}/image/upload`, {
                method: 'POST',
                body: coverFormData
            });
            
            const coverData = await coverResponse.json();
            coverUrl = coverData.secure_url;
        }
        
        const updates = {
            title,
            artist,
            album,
            year,
            genre: genres.length > 0 ? genres[0] : '', // Keep backward compatibility
            genres: genres, // New multi-select field
            mood: moods, // Array of moods
            cover: coverUrl,
            coverUrl: coverUrl
        };
        
        await db.ref(`songs/${songId}`).update(updates);
        
        closeEditSongModal();
        
        await loadSongs();
        processArtists();
        renderSongs();
        
    } catch (error) {
        console.error('Edit error:', error);
        alert('Failed to update song');
    }
}

async function deleteSong(songId, title) {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await db.ref(`songs/${songId}`).remove();
        
        const userSnapshot = await db.ref('users').once('value');
        const users = userSnapshot.val();
        
        if (users) {
            for (const userId in users) {
                await db.ref(`users/${userId}/likedSongs/${songId}`).remove();
                
                const recentlyPlayed = users[userId].recentlyPlayed || {};
                const updates = {};
                Object.keys(recentlyPlayed).forEach(key => {
                    if (recentlyPlayed[key].songId !== songId) {
                        updates[key] = recentlyPlayed[key];
                    }
                });
                await db.ref(`users/${userId}/recentlyPlayed`).set(updates);
            }
        }
        
        const playlistSnapshot = await db.ref('playlists').once('value');
        const playlists = playlistSnapshot.val();
        
        if (playlists) {
            for (const userId in playlists) {
                for (const playlistId in playlists[userId]) {
                    await db.ref(`playlists/${userId}/${playlistId}/songs/${songId}`).remove();
                }
            }
        }
        
        await loadSongs();
        processArtists();
        renderSongs();
        renderAnalytics();
        
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete song');
    }
}

// ARTISTS MANAGEMENT
function renderArtists() {
    const container = document.getElementById('artistsAdminList');
    
    if (allArtists.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">No artists found</p>';
        return;
    }
    
    renderArtistCards(allArtists, container);
}

function renderArtistCards(artists, container) {
    container.innerHTML = artists.map(artist => {
        const initial = artist.name.charAt(0).toUpperCase();
        const hasCover = artist.cover && artist.cover.length > 0;
        
        return `
            <div class="artist-admin-card">
                <div class="artist-admin-cover">
                    ${hasCover ? `<img src="${artist.cover}" style="width:100%;height:100%;object-fit:cover;">` : initial}
                </div>
                <div class="artist-admin-body">
                    <div class="artist-admin-name">${escapeHtml(artist.name)}</div>
                    <div class="artist-admin-stats">${artist.songCount} songs • ${artist.totalPlays.toLocaleString()} plays</div>
                    ${artist.bio ? `<div class="artist-admin-bio">${escapeHtml(artist.bio)}</div>` : ''}
                    ${artist.genres.length > 0 ? `
                        <div class="artist-admin-genres">
                            ${artist.genres.map(g => `<span class="artist-genre-badge">${escapeHtml(g)}</span>`).join('')}
                        </div>
                    ` : ''}
                    <button class="btn-edit-artist" onclick="editArtist('${escapeHtml(artist.name)}')">Edit Profile</button>
                </div>
            </div>
        `;
    }).join('');
}

function handleArtistSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    const container = document.getElementById('artistsAdminList');
    
    if (!query) {
        renderArtistCards(allArtists, container);
        return;
    }
    
    const filtered = allArtists.filter(artist =>
        artist.name.toLowerCase().includes(query)
    );
    
    renderArtistCards(filtered, container);
}

function editArtist(artistName) {
    const artist = allArtists.find(a => a.name === artistName);
    if (!artist) return;
    
    document.getElementById('editArtistName').value = artistName;
    document.getElementById('editArtistDisplayName').value = artistName;
    document.getElementById('editArtistBio').value = artist.bio || '';
    document.getElementById('editArtistGenres').value = artist.genres.join(', ');
    
    const coverDiv = document.getElementById('currentArtistCover');
    if (artist.cover) {
        coverDiv.innerHTML = `<img src="${artist.cover}" style="width:100%;max-width:200px;border-radius:10px;">`;
    } else {
        coverDiv.innerHTML = '';
    }
    
    document.getElementById('editArtistModal').classList.add('active');
}

function closeEditArtistModal() {
    document.getElementById('editArtistModal').classList.remove('active');
}

async function handleEditArtist(e) {
    e.preventDefault();
    
    const artistName = document.getElementById('editArtistName').value;
    const bio = document.getElementById('editArtistBio').value.trim();
    const genresInput = document.getElementById('editArtistGenres').value.trim();
    const coverFile = document.getElementById('editArtistCover').files[0];
    
    const genres = genresInput ? genresInput.split(',').map(g => g.trim()).filter(g => g.length > 0) : [];
    
    try {
        const artist = allArtists.find(a => a.name === artistName);
        let coverUrl = artist ? artist.cover : '';
        
        if (coverFile) {
            const coverFormData = new FormData();
            coverFormData.append('file', coverFile);
            coverFormData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
            
            const coverResponse = await fetch(`${CLOUDINARY_URL}/image/upload`, {
                method: 'POST',
                body: coverFormData
            });
            
            const coverData = await coverResponse.json();
            coverUrl = coverData.secure_url;
        }
        
        const artistKey = encodeArtistKey(artistName);
        const artistData = {
            name: artistName,
            bio,
            genres,
            cover: coverUrl,
            updatedAt: Date.now()
        };
        
        await db.ref(`artists/${artistKey}`).set(artistData);
        
        closeEditArtistModal();
        
        processArtists();
        renderArtists();
        
    } catch (error) {
        console.error('Edit artist error:', error);
        alert('Failed to update artist profile');
    }
}

// PLAYLISTS
function renderPlaylists() {
    const container = document.getElementById('playlistsList');
    
    if (allPlaylists.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">No playlists created</p>';
        return;
    }
    
    container.innerHTML = allPlaylists.map(playlist => {
        const songs = playlist.songs || {};
        const songCount = typeof songs === 'object' ? Object.keys(songs).length : 0;
        return `
            <div class="playlist-card">
                <div class="playlist-cover" style="${playlist.cover ? `background-image: url('${playlist.cover}')` : ''}"></div>
                <div class="playlist-info">
                    <div class="playlist-name">${escapeHtml(playlist.name)}</div>
                    <div class="playlist-count">${songCount} songs</div>
                </div>
            </div>
        `;
    }).join('');
}

function showCreatePlaylistModal() {
    document.getElementById('createPlaylistModal').classList.add('active');
    selectedPlaylistSongs = [];
    renderPlaylistSongSelector(allSongs);
}

function closeCreatePlaylistModal() {
    document.getElementById('createPlaylistModal').classList.remove('active');
    document.getElementById('createPlaylistForm').reset();
    selectedPlaylistSongs = [];
}

function renderPlaylistSongSelector(songs) {
    const container = document.getElementById('playlistSongsList');
    
    container.innerHTML = songs.map(song => {
        const isSelected = selectedPlaylistSongs.includes(song.id);
        return `
            <div class="playlist-song-item ${isSelected ? 'selected' : ''}" onclick="togglePlaylistSong('${song.id}')">
                <input type="checkbox" class="playlist-song-checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation()">
                <div class="playlist-song-info">
                    <div class="playlist-song-title">${escapeHtml(song.title)}</div>
                    <div class="playlist-song-artist">${escapeHtml(song.artist)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function togglePlaylistSong(songId) {
    if (selectedPlaylistSongs.includes(songId)) {
        selectedPlaylistSongs = selectedPlaylistSongs.filter(id => id !== songId);
    } else {
        selectedPlaylistSongs.push(songId);
    }
    renderPlaylistSongSelector(allSongs);
}

function handlePlaylistSongSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (!query) {
        renderPlaylistSongSelector(allSongs);
        return;
    }
    
    const filtered = allSongs.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
    );
    
    renderPlaylistSongSelector(filtered);
}

async function handleCreatePlaylist(e) {
    e.preventDefault();
    
    const name = document.getElementById('playlistName').value.trim();
    const description = document.getElementById('playlistDescription').value.trim();
    const coverFile = document.getElementById('playlistCoverFile').files[0];
    
    if (selectedPlaylistSongs.length === 0) {
        alert('Please select at least one song');
        return;
    }
    
    try {
        let coverUrl = '';
        
        if (coverFile) {
            const coverFormData = new FormData();
            coverFormData.append('file', coverFile);
            coverFormData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
            
            const coverResponse = await fetch(`${CLOUDINARY_URL}/image/upload`, {
                method: 'POST',
                body: coverFormData
            });
            
            const coverData = await coverResponse.json();
            coverUrl = coverData.secure_url;
        }
        
        const songs = {};
        selectedPlaylistSongs.forEach(id => {
            songs[id] = true;
        });
        
        const playlistData = {
            name,
            description,
            cover: coverUrl,
            songs,
            createdAt: Date.now()
        };
        
        // Create as admin playlist (you can modify this to assign to specific user)
        await db.ref('playlists/admin').push(playlistData);
        
        closeCreatePlaylistModal();
        await loadPlaylists();
        renderPlaylists();
        
    } catch (error) {
        console.error('Create playlist error:', error);
        alert('Failed to create playlist');
    }
}

// USERS
function renderUsers() {
    const container = document.getElementById('usersList');
    
    if (allUsers.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">No users registered</p>';
        return;
    }
    
    container.innerHTML = allUsers.map(user => {
        const email = user.email || `${user.username}@aurio.app`;
        // Check both status field and legacy approved field
        const status = user.status || (user.approved === true ? 'approved' : 'pending');
        const statusClass = status === 'approved' ? 'approved' : (status === 'rejected' ? 'rejected' : 'pending');
        const statusLabel = status === 'approved' ? 'Approved' : (status === 'rejected' ? 'Rejected' : 'Pending');
        
        return `
            <div class="user-card">
                <div class="user-info">
                    <div class="user-name">${escapeHtml(user.username)}</div>
                    <div class="user-email">${email}</div>
                    <span class="user-status ${statusClass}">
                        ${statusLabel}
                    </span>
                </div>
                <div class="user-actions">
                    ${status !== 'approved' ? `<button class="btn-approve" onclick="approveUser('${user.id}')">Approve</button>` : ''}
                    ${status === 'approved' ? `<button class="btn-disable" onclick="disableUser('${user.id}')">Reject</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function approveUser(userId) {
    try {
        // Update both status and approved fields for backwards compatibility
        await db.ref(`users/${userId}`).update({
            status: 'approved',
            approved: true
        });
        await loadUsers();
        renderUsers();
        renderAnalytics();
    } catch (error) {
        console.error('Approve error:', error);
        alert('Failed to approve user');
    }
}

async function disableUser(userId) {
    if (!confirm('Are you sure you want to reject this user?')) {
        return;
    }
    
    try {
        // Update to rejected status
        await db.ref(`users/${userId}`).update({
            status: 'rejected',
            approved: false
        });
        await loadUsers();
        renderUsers();
        renderAnalytics();
    } catch (error) {
        console.error('Reject error:', error);
        alert('Failed to reject user');
    }
}

function encodeArtistKey(artist) {
    return artist.replace(/[.#$[\]]/g, '_');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== GENRE DISTRIBUTION CHART ====================
function renderGenreChart() {
    const genreCounts = {};
    let totalSongs = 0;
    
    allSongs.forEach(song => {
        if (song.genre) {
            genreCounts[song.genre] = (genreCounts[song.genre] || 0) + 1;
            totalSongs++;
        }
    });
    
    const sorted = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const chartHtml = sorted.map(([genre, count]) => {
        const percentage = (count / totalSongs * 100).toFixed(1);
        return `
            <div class="genre-bar">
                <div class="genre-label">${escapeHtml(genre)}</div>
                <div class="genre-progress">
                    <div class="genre-fill" style="width: ${percentage}%">
                        <span class="genre-count">${count}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('genreChart').innerHTML = chartHtml || '<div class="empty-state">No genre data available</div>';
}

// ==================== USER ENGAGEMENT DASHBOARD ====================
async function renderUserEngagement() {
    try {
        const usersSnapshot = await db.ref('users').once('value');
        const users = [];
        
        usersSnapshot.forEach(userSnapshot => {
            const userData = userSnapshot.val();
            if (userData.approved) {
                users.push({
                    uid: userSnapshot.key,
                    ...userData
                });
            }
        });
        
        // Get engagement data for each user
        const engagementData = await Promise.all(users.map(async user => {
            const playHistorySnapshot = await db.ref(`users/${user.uid}/playHistory`).once('value');
            const plays = [];
            
            playHistorySnapshot.forEach(playSnapshot => {
                plays.push(playSnapshot.val());
            });
            
            // Calculate total listening time
            let totalSeconds = 0;
            const songPlays = {};
            
            plays.forEach(play => {
                const song = allSongs.find(s => s.id === play.songId);
                if (song && song.duration) {
                    totalSeconds += song.duration;
                }
                songPlays[play.songId] = (songPlays[play.songId] || 0) + 1;
            });
            
            // Find top song
            const topSongEntry = Object.entries(songPlays).sort((a, b) => b[1] - a[1])[0];
            const topSong = topSongEntry ? allSongs.find(s => s.id === topSongEntry[0]) : null;
            
            // Get last active time
            const lastActive = plays.length > 0 ? 
                Math.max(...plays.map(p => p.timestamp || 0)) : 
                user.createdAt || 0;
            
            return {
                username: user.username,
                displayName: user.displayName || user.username,
                avatar: user.avatar,
                totalPlays: plays.length,
                listeningTime: totalSeconds,
                topSong: topSong ? topSong.title : 'N/A',
                lastActive: lastActive
            };
        }));
        
        // Sort by total plays
        engagementData.sort((a, b) => b.totalPlays - a.totalPlays);
        
        const tableHtml = engagementData.map(data => {
            const hours = Math.floor(data.listeningTime / 3600);
            const mins = Math.floor((data.listeningTime % 3600) / 60);
            const timeStr = `${hours}h ${mins}m`;
            
            const lastActiveDate = data.lastActive ? new Date(data.lastActive) : new Date();
            const timeDiff = Date.now() - lastActiveDate.getTime();
            const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const lastActiveStr = daysAgo === 0 ? 'Today' : 
                                  daysAgo === 1 ? 'Yesterday' : 
                                  `${daysAgo} days ago`;
            
            const initial = data.displayName.charAt(0).toUpperCase();
            
            return `
                <tr>
                    <td>
                        <div class="engagement-user">
                            <div class="engagement-avatar" style="background-image: url(${data.avatar})">
                                ${data.avatar ? '' : initial}
                            </div>
                            <span class="engagement-name">${escapeHtml(data.displayName)}</span>
                        </div>
                    </td>
                    <td><span class="engagement-metric">${data.totalPlays}</span></td>
                    <td>${timeStr}</td>
                    <td>${escapeHtml(data.topSong)}</td>
                    <td><span class="engagement-time">${lastActiveStr}</span></td>
                </tr>
            `;
        }).join('');
        
        document.getElementById('userEngagementBody').innerHTML = tableHtml || 
            '<tr><td colspan="5" class="empty-state">No engagement data available</td></tr>';
        
    } catch (error) {
        console.error('Error rendering user engagement:', error);
        document.getElementById('userEngagementBody').innerHTML = 
            '<tr><td colspan="5" class="empty-state">Error loading engagement data</td></tr>';
    }
}
