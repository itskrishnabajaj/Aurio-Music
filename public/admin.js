// Aurio Admin Panel - Complete Upload & Management System
// Handles M4A metadata extraction and Cloudinary uploads

// ==================== STATE ====================
const AdminState = {
    currentAdmin: null,
    allSongs: [],
    uploadQueue: [],
    editingSong: null
};

// ==================== DOM ELEMENTS ====================
const DOM = {
    authScreen: document.getElementById('adminAuthScreen'),
    dashboard: document.getElementById('adminDashboard'),
    signInBtn: document.getElementById('adminGoogleSignIn'),
    signOutBtn: document.getElementById('adminSignOut'),
    
    // Stats
    statTotalSongs: document.getElementById('statTotalSongs'),
    statTotalPlays: document.getElementById('statTotalPlays'),
    statStorage: document.getElementById('statStorage'),
    
    // Upload
    uploadArea: document.getElementById('uploadArea'),
    uploadPlaceholder: document.getElementById('uploadPlaceholder'),
    fileInput: document.getElementById('fileInput'),
    uploadQueue: document.getElementById('uploadQueue'),
    uploadModal: document.getElementById('uploadModal'),
    uploadProgressList: document.getElementById('uploadProgressList'),
    closeUploadModal: document.getElementById('closeUploadModal'),
    
    // Library
    adminSearch: document.getElementById('adminSearch'),
    adminSort: document.getElementById('adminSort'),
    adminSongList: document.getElementById('adminSongList'),
    
    // Edit Modal
    editModal: document.getElementById('editModal'),
    closeEditModal: document.getElementById('closeEditModal'),
    editForm: document.getElementById('editForm'),
    editTitle: document.getElementById('editTitle'),
    editArtist: document.getElementById('editArtist'),
    editAlbum: document.getElementById('editAlbum'),
    editYear: document.getElementById('editYear'),
    editGenre: document.getElementById('editGenre'),
    moodTags: document.getElementById('moodTags'),
    activityTags: document.getElementById('activityTags'),
    editCoverUrl: document.getElementById('editCoverUrl'),
    coverPreview: document.getElementById('coverPreview'),
    cancelEdit: document.getElementById('cancelEdit'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// ==================== INITIALIZATION ====================
function init() {
    console.log('🛠️ Initializing Admin Panel...');
    
    // Handle redirect
    auth.getRedirectResult()
        .then(result => {
            if (result.user) console.log('✅ Admin redirect success');
        })
        .catch(error => console.error('Redirect error:', error));
    
    // Auth listener
    auth.onAuthStateChanged(onAuthChanged);
    
    // Setup listeners
    setupEventListeners();
    
    console.log('✅ Admin initialized');
}

// ==================== AUTHENTICATION ====================
function onAuthChanged(user) {
    if (user && isAdmin(user.email)) {
        AdminState.currentAdmin = user;
        console.log('✅ Admin:', user.email);
        showDashboard();
        loadSongs();
    } else if (user && !isAdmin(user.email)) {
        showToast('Access denied: Not an admin', 'error');
        auth.signOut();
    } else {
        AdminState.currentAdmin = null;
        showAuth();
    }
}

function showAuth() {
    DOM.authScreen.classList.add('active');
    DOM.dashboard.classList.remove('active');
}

function showDashboard() {
    DOM.authScreen.classList.remove('active');
    DOM.dashboard.classList.add('active');
}

function adminSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        auth.signInWithRedirect(provider);
    } else {
        auth.signInWithPopup(provider).catch(error => {
            if (error.code === 'auth/popup-blocked') {
                auth.signInWithRedirect(provider);
            } else if (error.code !== 'auth/popup-closed-by-user') {
                showToast('Sign in failed', 'error');
            }
        });
    }
}

function adminSignOut() {
    if (!confirm('Sign out?')) return;
    auth.signOut().then(() => showToast('Signed out'));
}

// ==================== LOAD SONGS ====================
function loadSongs() {
    DOM.adminSongList.innerHTML = '<div class="loading">Loading...</div>';
    
    database.ref('songs').on('value', snapshot => {
        const data = snapshot.val();
        AdminState.allSongs = [];
        
        if (data) {
            AdminState.allSongs = Object.entries(data).map(([id, song]) => ({
                id,
                ...song
            }));
        }
        
        renderSongs();
        updateStats();
    }, error => {
        console.error('Load error:', error);
        showToast('Failed to load songs', 'error');
    });
}

function renderSongs() {
    const filtered = filterAndSortSongs();
    
    if (filtered.length === 0) {
        DOM.adminSongList.innerHTML = '<div class="empty-state">No songs found</div>';
        return;
    }
    
    DOM.adminSongList.innerHTML = filtered.map(song => `
        <div class="admin-song-card" data-song-id="${song.id}">
            <img src="${song.coverUrl || 'https://via.placeholder.com/80?text=♪'}" 
                 alt="${escapeHtml(song.title)}" 
                 class="admin-song-cover"
                 onerror="this.src='https://via.placeholder.com/80?text=♪'">
            <div class="admin-song-details">
                <div class="admin-song-title">${escapeHtml(song.title)}</div>
                <div class="admin-song-artist">${escapeHtml(song.artist)}</div>
                <div class="admin-song-meta">
                    <span>Plays: ${song.playCount || 0}</span>
                    <span>${song.duration ? formatDuration(song.duration) : ''}</span>
                    <span>${formatDate(song.addedAt)}</span>
                </div>
            </div>
            <div class="admin-song-actions">
                <button class="btn-edit" onclick="editSong('${song.id}')">Edit</button>
                <button class="btn-delete" onclick="deleteSong('${song.id}', '${escapeHtml(song.title)}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function filterAndSortSongs() {
    let songs = [...AdminState.allSongs];
    
    // Filter by search
    const query = DOM.adminSearch.value.toLowerCase();
    if (query) {
        songs = songs.filter(s => 
            s.title.toLowerCase().includes(query) ||
            s.artist.toLowerCase().includes(query) ||
            (s.album || '').toLowerCase().includes(query)
        );
    }
    
    // Sort
    const sortBy = DOM.adminSort.value;
    switch (sortBy) {
        case 'title':
            songs.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'artist':
            songs.sort((a, b) => a.artist.localeCompare(b.artist));
            break;
        case 'plays':
            songs.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
            break;
        case 'recent':
        default:
            songs.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    }
    
    return songs;
}

// ==================== FILE UPLOAD ====================
function handleFileSelect(files) {
    if (!files || files.length === 0) return;
    
    DOM.uploadPlaceholder.style.display = 'none';
    DOM.uploadQueue.style.display = 'block';
    
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('audio/')) {
            showToast(`Skipped ${file.name}: Not an audio file`, 'warning');
            return;
        }
        
        processFile(file);
    });
}

async function processFile(file) {
    const uploadId = Date.now() + Math.random();
    
    // Add to UI
    const itemHtml = `
        <div class="upload-item" id="upload-${uploadId}">
            <div class="upload-item-icon">🎵</div>
            <div class="upload-item-info">
                <div class="upload-item-name">${escapeHtml(file.name)}</div>
                <div class="upload-item-meta">Extracting metadata...</div>
            </div>
            <div class="upload-item-progress">
                <div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div>
                <div class="progress-text">0%</div>
            </div>
        </div>
    `;
    
    DOM.uploadQueue.insertAdjacentHTML('beforeend', itemHtml);
    const uploadItem = document.getElementById(`upload-${uploadId}`);
    
    try {
        // Extract metadata
        const metadata = await extractMetadata(file);
        updateUploadMeta(uploadId, 'Uploading audio...');
        
        // Upload audio
        const audioUrl = await uploadFile(file, uploadId, 'audio');
        updateUploadMeta(uploadId, 'Uploading complete!');
        
        // Upload cover if embedded
        let coverUrl = metadata.coverUrl;
        if (metadata.coverBlob) {
            updateUploadMeta(uploadId, 'Uploading cover...');
            coverUrl = await uploadFile(metadata.coverBlob, uploadId, 'cover');
        }
        
        // Save to database
        const songData = {
            title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
            artist: metadata.artist || 'Unknown Artist',
            album: metadata.album || '',
            year: metadata.year || new Date().getFullYear(),
            genre: metadata.genre || '',
            duration: metadata.duration || 0,
            audioUrl,
            coverUrl: coverUrl || 'https://via.placeholder.com/400?text=♪',
            moods: [],
            activities: [],
            addedAt: Date.now(),
            addedBy: AdminState.currentAdmin.email,
            playCount: 0,
            cloudinaryId: audioUrl.split('/').pop().split('.')[0]
        };
        
        await database.ref('songs').push(songData);
        
        // Success
        uploadItem.querySelector('.upload-item-icon').textContent = '✅';
        uploadItem.querySelector('.upload-item-meta').textContent = 'Upload complete!';
        uploadItem.querySelector('.progress-fill').style.width = '100%';
        uploadItem.querySelector('.progress-text').textContent = '100%';
        
        setTimeout(() => uploadItem.remove(), 2000);
        showToast('Song uploaded successfully!', 'success');
        
    } catch (error) {
        console.error('Upload error:', error);
        uploadItem.querySelector('.upload-item-icon').textContent = '❌';
        uploadItem.querySelector('.upload-item-meta').textContent = `Error: ${error.message}`;
        showToast(`Upload failed: ${file.name}`, 'error');
    }
}

async function extractMetadata(file) {
    return new Promise((resolve) => {
        jsmediatags.read(file, {
            onSuccess: (tag) => {
                const tags = tag.tags;
                const metadata = {
                    title: tags.title,
                    artist: tags.artist,
                    album: tags.album,
                    year: tags.year,
                    genre: tags.genre,
                    duration: 0,
                    coverUrl: null,
                    coverBlob: null
                };
                
                // Extract cover art
                if (tags.picture) {
                    const picture = tags.picture;
                    const blob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
                    metadata.coverBlob = blob;
                    metadata.coverUrl = URL.createObjectURL(blob);
                }
                
                // Get duration
                const audio = new Audio();
                audio.addEventListener('loadedmetadata', () => {
                    metadata.duration = audio.duration;
                    resolve(metadata);
                });
                audio.src = URL.createObjectURL(file);
                
            },
            onError: () => {
                // No metadata found, resolve with defaults
                resolve({
                    title: null,
                    artist: null,
                    album: null,
                    year: null,
                    genre: null,
                    duration: 0,
                    coverUrl: null,
                    coverBlob: null
                });
            }
        });
    });
}

async function uploadFile(file, uploadId, type) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        formData.append('folder', type === 'cover' ? 'aurio/covers' : 'aurio/audio');
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                updateUploadProgress(uploadId, percent);
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                resolve(response.secure_url);
            } else {
                reject(new Error('Upload failed'));
            }
        });
        
        xhr.addEventListener('error', () => reject(new Error('Network error')));
        
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`);
        xhr.send(formData);
    });
}

function updateUploadProgress(uploadId, percent) {
    const item = document.getElementById(`upload-${uploadId}`);
    if (!item) return;
    
    const fill = item.querySelector('.progress-fill');
    const text = item.querySelector('.progress-text');
    
    if (fill) fill.style.width = `${percent}%`;
    if (text) text.textContent = `${Math.round(percent)}%`;
}

function updateUploadMeta(uploadId, message) {
    const item = document.getElementById(`upload-${uploadId}`);
    if (!item) return;
    
    const meta = item.querySelector('.upload-item-meta');
    if (meta) meta.textContent = message;
}

// ==================== EDIT SONG ====================
window.editSong = function(songId) {
    const song = AdminState.allSongs.find(s => s.id === songId);
    if (!song) return;
    
    AdminState.editingSong = { id: songId, ...song };
    
    // Populate form
    DOM.editTitle.value = song.title || '';
    DOM.editArtist.value = song.artist || '';
    DOM.editAlbum.value = song.album || '';
    DOM.editYear.value = song.year || '';
    DOM.editGenre.value = song.genre || '';
    DOM.editCoverUrl.value = song.coverUrl || '';
    
    // Mood tags
    DOM.moodTags.querySelectorAll('input').forEach(input => {
        input.checked = (song.moods || []).includes(input.value);
    });
    
    // Activity tags
    DOM.activityTags.querySelectorAll('input').forEach(input => {
        input.checked = (song.activities || []).includes(input.value);
    });
    
    // Cover preview
    if (song.coverUrl) {
        DOM.coverPreview.innerHTML = `<img src="${song.coverUrl}" alt="Cover">`;
    }
    
    DOM.editModal.style.display = 'flex';
};

function saveEditedSong(e) {
    e.preventDefault();
    
    const moods = Array.from(DOM.moodTags.querySelectorAll('input:checked')).map(i => i.value);
    const activities = Array.from(DOM.activityTags.querySelectorAll('input:checked')).map(i => i.value);
    
    const updates = {
        title: DOM.editTitle.value.trim(),
        artist: DOM.editArtist.value.trim(),
        album: DOM.editAlbum.value.trim(),
        year: parseInt(DOM.editYear.value) || null,
        genre: DOM.editGenre.value.trim(),
        coverUrl: DOM.editCoverUrl.value.trim(),
        moods,
        activities
    };
    
    database.ref(`songs/${AdminState.editingSong.id}`).update(updates)
        .then(() => {
            showToast('Song updated!', 'success');
            DOM.editModal.style.display = 'none';
            AdminState.editingSong = null;
        })
        .catch(error => {
            console.error('Update error:', error);
            showToast('Update failed', 'error');
        });
}

// ==================== DELETE SONG ====================
window.deleteSong = function(songId, title) {
    if (!confirm(`Delete "${title}"?\n\nThis cannot be undone.`)) return;
    
    database.ref(`songs/${songId}`).remove()
        .then(() => {
            showToast('Song deleted', 'success');
        })
        .catch(error => {
            console.error('Delete error:', error);
            showToast('Delete failed', 'error');
        });
};

// ==================== STATS ====================
function updateStats() {
    DOM.statTotalSongs.textContent = AdminState.allSongs.length;
    
    let totalPlays = 0;
    AdminState.allSongs.forEach(s => {
        totalPlays += s.playCount || 0;
    });
    DOM.statTotalPlays.textContent = totalPlays;
    
    // Storage calculation (rough estimate)
    const avgSongSize = 5; // MB
    const totalStorage = AdminState.allSongs.length * avgSongSize;
    DOM.statStorage.textContent = `${totalStorage} MB`;
}

// ==================== UTILITIES ====================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(seconds) {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Auth
    DOM.signInBtn.addEventListener('click', adminSignIn);
    DOM.signOutBtn.addEventListener('click', adminSignOut);
    
    // Upload area
    DOM.uploadArea.addEventListener('click', () => DOM.fileInput.click());
    DOM.fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files));
    
    // Drag & drop
    DOM.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        DOM.uploadArea.classList.add('dragging');
    });
    
    DOM.uploadArea.addEventListener('dragleave', () => {
        DOM.uploadArea.classList.remove('dragging');
    });
    
    DOM.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        DOM.uploadArea.classList.remove('dragging');
        handleFileSelect(e.dataTransfer.files);
    });
    
    // Search & sort
    DOM.adminSearch.addEventListener('input', renderSongs);
    DOM.adminSort.addEventListener('change', renderSongs);
    
    // Edit modal
    DOM.editForm.addEventListener('submit', saveEditedSong);
    DOM.closeEditModal.addEventListener('click', () => {
        DOM.editModal.style.display = 'none';
    });
    DOM.cancelEdit.addEventListener('click', () => {
        DOM.editModal.style.display = 'none';
    });
    
    // Cover preview
    DOM.editCoverUrl.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
            DOM.coverPreview.innerHTML = `<img src="${url}" alt="Cover" onerror="this.src='https://via.placeholder.com/200?text=Invalid'">`;
        } else {
            DOM.coverPreview.innerHTML = '';
        }
    });
}

// ==================== START ====================
init();
