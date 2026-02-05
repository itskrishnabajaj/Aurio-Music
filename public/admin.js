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
    
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
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
    await Promise.all([
        loadSongs(),
        loadUsers(),
        loadPlaylists(),
        loadArtists()
    ]);
    
    renderAnalytics();
    renderSongs();
}

function loadSongs() {
    return new Promise((resolve) => {
        db.ref('songs').on('value', (snapshot) => {
            const data = snapshot.val();
            allSongs = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
            resolve();
        });
    });
}

function loadUsers() {
    return new Promise((resolve) => {
        db.ref('users').on('value', (snapshot) => {
            const data = snapshot.val();
            allUsers = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
            resolve();
        });
    });
}

function loadPlaylists() {
    return new Promise((resolve) => {
        db.ref('playlists').on('value', (snapshot) => {
            const data = snapshot.val();
            allPlaylists = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
            resolve();
        });
    });
}

function loadArtists() {
    return new Promise((resolve) => {
        db.ref('artists').on('value', (snapshot) => {
            const artistData = snapshot.val() || {};
            
            const artistMap = {};
            allSongs.forEach(song => {
                if (song.artist && !artistMap[song.artist]) {
                    artistMap[song.artist] = {
                        name: song.artist,
                        songs: []
                    };
                }
                if (song.artist) {
                    artistMap[song.artist].songs.push(song);
                }
            });
            
            allArtists = Object.keys(artistMap).map(name => {
                const key = encodeArtistKey(name);
                const profile = artistData[key] || {};
                return {
                    name,
                    songCount: artistMap[name].songs.length,
                    totalPlays: artistMap[name].songs.reduce((sum, s) => sum + (s.playCount || 0), 0),
                    cover: profile.cover || '',
                    bio: profile.bio || '',
                    genres: profile.genres || []
                };
            });
            
            resolve();
        });
    });
}

function renderAnalytics() {
    const totalSongs = allSongs.length;
    const activeUsers = allUsers.filter(u => u.approved === true).length;
    const totalPlays = allSongs.reduce((sum, song) => sum + (song.playCount || 0), 0);
    
    const estimatedSize = allSongs.length * 4;
    
    document.getElementById('totalSongs').textContent = totalSongs;
    document.getElementById('activeUsers').textContent = activeUsers;
    document.getElementById('totalPlays').textContent = totalPlays.toLocaleString();
    document.getElementById('storageUsed').textContent = `${estimatedSize} MB`;
    
    renderTopSongs();
}

function renderTopSongs() {
    const sorted = [...allSongs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 10);
    const container = document.getElementById('topSongsList');
    
    if (sorted.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No data available</p>';
        return;
    }
    
    container.innerHTML = sorted.map((song, index) => `
        <div class="top-song-item">
            <div class="song-rank">#${index + 1}</div>
            <img src="${song.cover || 'https://via.placeholder.com/60'}" alt="${song.title}" class="top-song-cover">
            <div class="top-song-info">
                <div class="top-song-title">${song.title}</div>
                <div class="top-song-artist">${song.artist}</div>
            </div>
            <div class="top-song-plays">${(song.playCount || 0).toLocaleString()} plays</div>
        </div>
    `).join('');
}

function renderSongs() {
    const container = document.getElementById('songsList');
    
    if (allSongs.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No songs uploaded</p>';
        return;
    }
    
    renderSongCards(allSongs, container);
}

function renderSongCards(songs, container) {
    container.innerHTML = songs.map(song => `
        <div class="song-card">
            <div class="song-card-header">
                <img src="${song.cover || 'https://via.placeholder.com/300'}" alt="${song.title}" class="song-card-cover">
            </div>
            <div class="song-card-body">
                <div class="song-card-title">${song.title}</div>
                <div class="song-card-artist">${song.artist}</div>
                <div class="song-card-meta">
                    ${song.album ? `<span class="meta-tag">${song.album}</span>` : ''}
                    ${song.year ? `<span class="meta-tag">${song.year}</span>` : ''}
                    ${song.genre ? `<span class="meta-tag">${song.genre}</span>` : ''}
                    ${song.mood ? `<span class="meta-tag">${song.mood}</span>` : ''}
                    <span class="meta-tag">${(song.playCount || 0)} plays</span>
                </div>
                <div class="song-card-actions">
                    <button class="btn-edit" onclick="editSong('${song.id}')">Edit</button>
                    <button class="btn-delete" onclick="deleteSong('${song.id}', '${song.title}')">Delete</button>
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

async function handleUpload(e) {
    e.preventDefault();
    
    const audioFile = document.getElementById('audioFile').files[0];
    const title = document.getElementById('songTitle').value.trim();
    const artist = document.getElementById('songArtist').value.trim();
    const album = document.getElementById('songAlbum').value.trim();
    const year = document.getElementById('songYear').value;
    const genre = document.getElementById('songGenre').value;
    const mood = document.getElementById('songMood').value;
    const coverFile = document.getElementById('coverFile').files[0];
    
    if (!audioFile) {
        alert('Please select an audio file');
        return;
    }
    
    const uploadBtn = document.getElementById('uploadBtn');
    const progressDiv = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const statusDiv = document.getElementById('uploadStatus');
    
    uploadBtn.disabled = true;
    progressDiv.style.display = 'block';
    
    try {
        statusDiv.textContent = 'Uploading audio file...';
        progressFill.style.width = '10%';
        
        const audioFormData = new FormData();
        audioFormData.append('file', audioFile);
        audioFormData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        audioFormData.append('resource_type', 'video');
        
        const audioResponse = await fetch(`${CLOUDINARY_URL}/video/upload`, {
            method: 'POST',
            body: audioFormData
        });
        
        const audioData = await audioResponse.json();
        progressFill.style.width = '50%';
        
        let coverUrl = '';
        
        if (coverFile) {
            statusDiv.textContent = 'Uploading cover image...';
            
            const coverFormData = new FormData();
            coverFormData.append('file', coverFile);
            coverFormData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
            
            const coverResponse = await fetch(`${CLOUDINARY_URL}/image/upload`, {
                method: 'POST',
                body: coverFormData
            });
            
            const coverData = await coverResponse.json();
            coverUrl = coverData.secure_url;
            progressFill.style.width = '80%';
        } else {
            progressFill.style.width = '80%';
        }
        
        statusDiv.textContent = 'Saving to database...';
        
        const songData = {
            title,
            artist,
            album,
            year,
            genre,
            mood,
            url: audioData.secure_url,
            cover: coverUrl,
            duration: audioData.duration || 0,
            uploadedAt: Date.now(),
            playCount: 0
        };
        
        await db.ref('songs').push(songData);
        
        progressFill.style.width = '100%';
        statusDiv.textContent = 'Upload complete!';
        
        setTimeout(() => {
            document.getElementById('uploadForm').reset();
            progressDiv.style.display = 'none';
            progressFill.style.width = '0%';
            uploadBtn.disabled = false;
            statusDiv.textContent = '';
        }, 2000);
        
        switchView('songs');
        
    } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed. Please try again.');
        uploadBtn.disabled = false;
        progressDiv.style.display = 'none';
        progressFill.style.width = '0%';
    }
}

function editSong(songId) {
    const song = allSongs.find(s => s.id === songId);
    if (!song) return;
    
    document.getElementById('editSongId').value = songId;
    document.getElementById('editTitle').value = song.title;
    document.getElementById('editArtist').value = song.artist;
    document.getElementById('editAlbum').value = song.album || '';
    document.getElementById('editYear').value = song.year || '';
    document.getElementById('editGenre').value = song.genre || '';
    document.getElementById('editMood').value = song.mood || '';
    
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
    const genre = document.getElementById('editGenre').value;
    const mood = document.getElementById('editMood').value;
    const coverFile = document.getElementById('editCoverFile').files[0];
    
    try {
        const song = allSongs.find(s => s.id === songId);
        let coverUrl = song.cover;
        
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
            genre,
            mood,
            cover: coverUrl
        };
        
        await db.ref(`songs/${songId}`).update(updates);
        
        closeEditSongModal();
        
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
                
                const recentlyPlayed = users[userId].recentlyPlayed || [];
                const filtered = recentlyPlayed.filter(id => id !== songId);
                if (filtered.length !== recentlyPlayed.length) {
                    await db.ref(`users/${userId}/recentlyPlayed`).set(filtered);
                }
            }
        }
        
        const playlistSnapshot = await db.ref('playlists').once('value');
        const playlists = playlistSnapshot.val();
        
        if (playlists) {
            for (const playlistId in playlists) {
                await db.ref(`playlists/${playlistId}/songs/${songId}`).remove();
            }
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete song');
    }
}

function renderPlaylists() {
    const container = document.getElementById('playlistsList');
    
    if (allPlaylists.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No playlists created</p>';
        return;
    }
    
    container.innerHTML = allPlaylists.map(playlist => {
        const songCount = playlist.songs ? Object.keys(playlist.songs).length : 0;
        return `
            <div class="playlist-card" onclick="editPlaylist('${playlist.id}')">
                <div class="playlist-cover" style="background-image: url('${playlist.cover || ''}')"></div>
                <div class="playlist-info">
                    <div class="playlist-name">${playlist.name}</div>
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
                    <div class="playlist-song-title">${song.title}</div>
                    <div class="playlist-song-artist">${song.artist}</div>
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
        
        await db.ref('playlists').push(playlistData);
        
        closeCreatePlaylistModal();
        renderPlaylists();
        
    } catch (error) {
        console.error('Create playlist error:', error);
        alert('Failed to create playlist');
    }
}

function editPlaylist(playlistId) {
    console.log('Edit playlist:', playlistId);
}

function renderUsers() {
    const container = document.getElementById('usersList');
    
    if (allUsers.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No users registered</p>';
        return;
    }
    
    container.innerHTML = allUsers.map(user => {
        const email = `${user.username}@aurio.app`;
        let statusClass = 'pending';
        let statusText = 'Pending';
        
        if (user.approved === true) {
            statusClass = 'approved';
            statusText = 'Approved';
        } else if (user.approved === false) {
            statusClass = 'pending';
            statusText = 'Pending';
        }
        
        return `
            <div class="user-card">
                <div class="user-info">
                    <div class="user-name">${user.username}</div>
                    <div class="user-email">${email}</div>
                    <span class="user-status ${statusClass}">${statusText}</span>
                </div>
                <div class="user-actions">
                    ${user.approved !== true ? `<button class="btn-approve" onclick="approveUser('${user.id}')">Approve</button>` : ''}
                    ${user.approved === true ? `<button class="btn-disable" onclick="disableUser('${user.id}')">Disable</button>` : ''}
                    ${user.approved === false && statusText === 'Pending' ? `<button class="btn-disable" onclick="rejectUser('${user.id}')">Reject</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function approveUser(userId) {
    try {
        await db.ref(`users/${userId}/approved`).set(true);
    } catch (error) {
        console.error('Approve error:', error);
        alert('Failed to approve user');
    }
}

async function disableUser(userId) {
    if (!confirm('Are you sure you want to disable this user?')) {
        return;
    }
    
    try {
        await db.ref(`users/${userId}/approved`).set(false);
    } catch (error) {
        console.error('Disable error:', error);
        alert('Failed to disable user');
    }
}

async function rejectUser(userId) {
    if (!confirm('Are you sure you want to reject this user?')) {
        return;
    }
    
    try {
        await db.ref(`users/${userId}`).remove();
    } catch (error) {
        console.error('Reject error:', error);
        alert('Failed to reject user');
    }
}

function renderArtists() {
    const container = document.getElementById('artistsAdminList');
    
    if (allArtists.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No artists found</p>';
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
        
        await loadArtists();
        renderArtists();
        
    } catch (error) {
        console.error('Edit artist error:', error);
        alert('Failed to update artist profile');
    }
}

function encodeArtistKey(artist) {
    return artist.replace(/[.#$[\]]/g, '_');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
