// Global State
let currentUser = null;
let audioFile = null;
let coverFile = null;
let allSongs = [];
let currentEditSongId = null;

// DOM Elements
const authCheckScreen = document.getElementById('authCheckScreen');
const adminPanel = document.getElementById('adminPanel');
const loadingSpinner = document.getElementById('loadingSpinner');
const toast = document.getElementById('toast');

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

// Upload Elements
const audioUploadArea = document.getElementById('audioUploadArea');
const audioFileInput = document.getElementById('audioFileInput');
const audioFileName = document.getElementById('audioFileName');
const coverUploadArea = document.getElementById('coverUploadArea');
const coverFileInput = document.getElementById('coverFileInput');
const coverFileName = document.getElementById('coverFileName');
const coverPreview = document.getElementById('coverPreview');

// Form Elements
const songMetadataForm = document.getElementById('songMetadataForm');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const songAlbum = document.getElementById('songAlbum');
const songLanguage = document.getElementById('songLanguage');
const songDuration = document.getElementById('songDuration');
const artistImage = document.getElementById('artistImage');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const uploadStatus = document.getElementById('uploadStatus');
const uploadSongBtn = document.getElementById('uploadSongBtn');

// Songs List
const searchSongsInput = document.getElementById('searchSongs');
const songsList = document.getElementById('songsList');

// Edit Modal
const editSongModal = document.getElementById('editSongModal');
const editSongForm = document.getElementById('editSongForm');
const editTitle = document.getElementById('editTitle');
const editArtist = document.getElementById('editArtist');
const editAlbum = document.getElementById('editAlbum');
const editLanguage = document.getElementById('editLanguage');
const editArtistImage = document.getElementById('editArtistImage');
const editPlayCount = document.getElementById('editPlayCount');
const editLikes = document.getElementById('editLikes');

// Playlists
const createPlaylistBtn = document.getElementById('createPlaylistBtn');
const createPlaylistModal = document.getElementById('createPlaylistModal');
const createPlaylistForm = document.getElementById('createPlaylistForm');
const playlistsList = document.getElementById('playlistsList');

// Sign Out
const adminSignOutBtn = document.getElementById('adminSignOutBtn');

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    setupAuthCheck();
    setupTabNavigation();
    setupFileUpload();
    setupFormHandlers();
});

// Auth Check
async function setupAuthCheck() {
    firebaseAuth.auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            
            // Check if user is admin
            const isAdminUser = await firebaseDB.isAdmin(user.uid);
            
            if (isAdminUser) {
                authCheckScreen.classList.remove('active');
                adminPanel.classList.add('active');
                await loadAdminData();
            } else {
                showToast('Access denied: Admin only');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            }
        } else {
            showToast('Please sign in as admin');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        }
    });
}

// Load Admin Data
async function loadAdminData() {
    showLoading();
    try {
        await loadAllSongs();
        await loadPlaylists();
    } catch (error) {
        console.error('Error loading admin data:', error);
        showToast('Error loading data');
    } finally {
        hideLoading();
    }
}

// Setup Tab Navigation
function setupTabNavigation() {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });
}

// Setup File Upload
function setupFileUpload() {
    // Audio Upload
    audioUploadArea.addEventListener('click', () => audioFileInput.click());
    
    audioUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        audioUploadArea.classList.add('dragging');
    });
    
    audioUploadArea.addEventListener('dragleave', () => {
        audioUploadArea.classList.remove('dragging');
    });
    
    audioUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        audioUploadArea.classList.remove('dragging');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio/')) {
            handleAudioFile(file);
        } else {
            showToast('Please drop an audio file');
        }
    });
    
    audioFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleAudioFile(file);
        }
    });
    
    // Cover Upload
    coverUploadArea.addEventListener('click', () => coverFileInput.click());
    
    coverUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        coverUploadArea.classList.add('dragging');
    });
    
    coverUploadArea.addEventListener('dragleave', () => {
        coverUploadArea.classList.remove('dragging');
    });
    
    coverUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        coverUploadArea.classList.remove('dragging');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleCoverFile(file);
        } else {
            showToast('Please drop an image file');
        }
    });
    
    coverFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleCoverFile(file);
        }
    });
}

// Handle Audio File
async function handleAudioFile(file) {
    audioFile = file;
    audioFileName.textContent = file.name;
    audioFileName.classList.add('show');
    
    try {
        // Extract metadata
        const metadata = await cloudinaryService.extractAudioMetadata(file);
        const parsedInfo = cloudinaryService.parseFilenameMetadata(file.name);
        
        songTitle.value = parsedInfo.title;
        songArtist.value = parsedInfo.artist;
        songDuration.value = cloudinaryService.formatDuration(metadata.duration);
        
        showToast('Audio file loaded successfully');
    } catch (error) {
        console.error('Error extracting metadata:', error);
        showToast('Audio loaded (metadata extraction failed)');
    }
}

// Handle Cover File
function handleCoverFile(file) {
    coverFile = file;
    coverFileName.textContent = file.name;
    coverFileName.classList.add('show');
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        coverPreview.innerHTML = `<img src="${e.target.result}" alt="Cover">`;
        coverPreview.classList.add('show');
    };
    reader.readAsDataURL(file);
    
    showToast('Cover image loaded');
}

// Setup Form Handlers
function setupFormHandlers() {
    songMetadataForm.addEventListener('submit', handleSongUpload);
    editSongForm.addEventListener('submit', handleSongUpdate);
    createPlaylistForm.addEventListener('submit', handlePlaylistCreate);
    
    searchSongsInput.addEventListener('input', debounce(filterSongs, 300));
    
    createPlaylistBtn.addEventListener('click', () => {
        createPlaylistModal.classList.add('active');
    });
    
    adminSignOutBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to sign out?')) {
            await firebaseAuth.signOut();
            window.location.href = '/';
        }
    });
}

// Handle Song Upload
async function handleSongUpload(e) {
    e.preventDefault();
    
    if (!audioFile) {
        showToast('Please select an audio file');
        return;
    }
    
    if (!coverFile) {
        showToast('Please select a cover image');
        return;
    }
    
    uploadSongBtn.disabled = true;
    uploadProgress.style.display = 'block';
    
    try {
        // Upload audio
        uploadStatus.textContent = 'Uploading audio...';
        progressFill.style.width = '30%';
        const audioData = await cloudinaryService.uploadAudio(audioFile);
        
        // Upload cover
        uploadStatus.textContent = 'Uploading cover image...';
        progressFill.style.width = '60%';
        const coverData = await cloudinaryService.uploadImage(coverFile);
        
        // Save to Firestore
        uploadStatus.textContent = 'Saving to database...';
        progressFill.style.width = '90%';
        
        const songData = {
            title: songTitle.value.trim(),
            artist: songArtist.value.trim(),
            album: songAlbum.value.trim() || null,
            language: songLanguage.value,
            duration: songDuration.value,
            audioUrl: audioData.url,
            coverUrl: coverData.url,
            artistImage: artistImage.value.trim() || coverData.url,
            playCount: 0,
            likes: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            uploadedBy: currentUser.uid
        };
        
        await firebaseAuth.db.collection('songs').add(songData);
        
        progressFill.style.width = '100%';
        uploadStatus.textContent = 'Upload complete!';
        
        showToast('Song uploaded successfully');
        
        // Reset form
        setTimeout(() => {
            resetUploadForm();
            loadAllSongs();
        }, 1500);
        
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Upload failed: ' + error.message);
        uploadSongBtn.disabled = false;
        uploadProgress.style.display = 'none';
    }
}

// Reset Upload Form
function resetUploadForm() {
    songMetadataForm.reset();
    audioFile = null;
    coverFile = null;
    audioFileName.classList.remove('show');
    coverFileName.classList.remove('show');
    coverPreview.classList.remove('show');
    uploadProgress.style.display = 'none';
    uploadSongBtn.disabled = false;
    progressFill.style.width = '0%';
}

// Load All Songs
async function loadAllSongs() {
    try {
        allSongs = await firebaseDB.getAllSongs();
        renderSongsList(allSongs);
    } catch (error) {
        console.error('Error loading songs:', error);
        showToast('Error loading songs');
    }
}

// Render Songs List
function renderSongsList(songs) {
    if (songs.length === 0) {
        songsList.innerHTML = '<p style="color: var(--text-secondary); padding: 20px;">No songs available</p>';
        return;
    }
    
    songsList.innerHTML = songs.map(song => `
        <div class="song-item" data-song-id="${song.id}">
            <img src="${song.coverUrl}" alt="${song.title}" class="song-cover-small">
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-details">${song.artist} • ${song.language || 'Unknown'} • ${song.duration}</div>
            </div>
            <div class="song-stats">
                <span>▶ ${song.playCount || 0}</span>
                <span>♥ ${song.likes || 0}</span>
            </div>
            <div class="song-actions">
                <button class="action-btn" onclick="openEditModal('${song.id}')">Edit</button>
            </div>
        </div>
    `).join('');
}

// Filter Songs
function filterSongs() {
    const query = searchSongsInput.value.toLowerCase().trim();
    
    if (!query) {
        renderSongsList(allSongs);
        return;
    }
    
    const filtered = allSongs.filter(song => {
        return song.title.toLowerCase().includes(query) ||
               song.artist.toLowerCase().includes(query) ||
               (song.album && song.album.toLowerCase().includes(query));
    });
    
    renderSongsList(filtered);
}

// Open Edit Modal
window.openEditModal = function(songId) {
    const song = allSongs.find(s => s.id === songId);
    if (!song) return;
    
    currentEditSongId = songId;
    
    editTitle.value = song.title;
    editArtist.value = song.artist;
    editAlbum.value = song.album || '';
    editLanguage.value = song.language || 'English';
    editArtistImage.value = song.artistImage || '';
    editPlayCount.textContent = song.playCount || 0;
    editLikes.textContent = song.likes || 0;
    
    editSongModal.classList.add('active');
};

// Close Edit Modal
window.closeEditModal = function() {
    editSongModal.classList.remove('active');
    currentEditSongId = null;
};

// Handle Song Update
async function handleSongUpdate(e) {
    e.preventDefault();
    
    if (!currentEditSongId) return;
    
    showLoading();
    
    try {
        const updateData = {
            title: editTitle.value.trim(),
            artist: editArtist.value.trim(),
            album: editAlbum.value.trim() || null,
            language: editLanguage.value,
            artistImage: editArtistImage.value.trim() || null
        };
        
        await firebaseAuth.db.collection('songs').doc(currentEditSongId).update(updateData);
        
        showToast('Song updated successfully');
        closeEditModal();
        await loadAllSongs();
        
    } catch (error) {
        console.error('Update error:', error);
        showToast('Update failed');
    } finally {
        hideLoading();
    }
}

// Delete Song
window.deleteSong = async function() {
    if (!currentEditSongId) return;
    
    if (!confirm('Are you sure you want to delete this song? This action cannot be undone.')) {
        return;
    }
    
    showLoading();
    
    try {
        await firebaseAuth.db.collection('songs').doc(currentEditSongId).delete();
        
        showToast('Song deleted successfully');
        closeEditModal();
        await loadAllSongs();
        
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Delete failed');
    } finally {
        hideLoading();
    }
};

// Load Playlists
async function loadPlaylists() {
    try {
        const playlists = await firebaseDB.getPlaylists();
        renderPlaylistsList(playlists);
    } catch (error) {
        console.error('Error loading playlists:', error);
    }
}

// Render Playlists List
function renderPlaylistsList(playlists) {
    if (playlists.length === 0) {
        playlistsList.innerHTML = '<p style="color: var(--text-secondary); padding: 20px;">No playlists created yet</p>';
        return;
    }
    
    playlistsList.innerHTML = playlists.map(playlist => `
        <div class="playlist-card">
            <img src="${playlist.coverUrl || 'https://via.placeholder.com/200'}" alt="${playlist.name}" class="playlist-cover-img">
            <div class="playlist-name">${playlist.name}</div>
            <div class="playlist-count">${(playlist.songs || []).length} songs</div>
        </div>
    `).join('');
}

// Close Create Playlist Modal
window.closeCreatePlaylistModal = function() {
    createPlaylistModal.classList.remove('active');
    createPlaylistForm.reset();
};

// Handle Playlist Create
async function handlePlaylistCreate(e) {
    e.preventDefault();
    
    const name = document.getElementById('playlistName').value.trim();
    const description = document.getElementById('playlistDescription').value.trim();
    const coverUrl = document.getElementById('playlistCover').value.trim();
    const isPublic = document.getElementById('playlistPublic').checked;
    
    if (!name) {
        showToast('Please enter playlist name');
        return;
    }
    
    showLoading();
    
    try {
        const playlistData = {
            name,
            description: description || null,
            coverUrl: coverUrl || 'https://via.placeholder.com/300',
            isPublic,
            songs: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.uid
        };
        
        await firebaseAuth.db.collection('playlists').add(playlistData);
        
        showToast('Playlist created successfully');
        closeCreatePlaylistModal();
        await loadPlaylists();
        
    } catch (error) {
        console.error('Create playlist error:', error);
        showToast('Failed to create playlist');
    } finally {
        hideLoading();
    }
}

// Utility Functions
function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
