# Home Tab Implementation - Testing Checklist

This document provides a comprehensive testing checklist for the Home Tab rebuild.

## Pre-Testing Setup

### 1. Import Sample Data
- [ ] Follow instructions in `SAMPLE_DATA_SETUP.md`
- [ ] Import `sample-songs-data.json` to Firebase Realtime Database
- [ ] Verify 20 songs are visible in Firebase Console
- [ ] Verify artist metadata is imported (optional but recommended)

### 2. Create Test Account
- [ ] Create a new user account or use existing
- [ ] Ensure account is approved by admin
- [ ] Successfully log in to the app

## Section-by-Section Testing

### Recently Played Section

**Layout & Display:**
- [ ] Section title "Recently Played" is visible
- [ ] Grid displays in 2 columns × 4 rows
- [ ] Maximum of 8 items are shown
- [ ] Each item shows:
  - [ ] Cover art thumbnail
  - [ ] Song title (truncated if too long)
  - [ ] Artist name (truncated if too long)
- [ ] Empty state displays when no songs have been played

**Functionality:**
- [ ] Play at least 8 different songs
- [ ] Return to Home tab
- [ ] Verify recently played section shows last 8 songs in order
- [ ] Most recent song appears first
- [ ] Clicking a song plays it immediately
- [ ] Section updates after playing new songs

### For You Section (AI Recommendations)

**Layout & Display:**
- [ ] Section shows dynamic title based on time:
  - [ ] "Morning Picks" (6am-12pm)
  - [ ] "Afternoon Vibes" (12pm-6pm)
  - [ ] "Evening Mix" (6pm-10pm)
  - [ ] "Night Mode" (10pm-6am)
- [ ] Badge displays "AI Picks"
- [ ] 10-15 songs displayed in horizontal slider
- [ ] Partial next card visible on right edge
- [ ] Smooth momentum scrolling works
- [ ] Snap-to-card behavior functions

**AI Logic Testing:**
- [ ] **Cold Start (No History):**
  - [ ] Random selection of songs displayed
  - [ ] Variety of genres shown
  
- [ ] **After Playing 5+ Songs:**
  - [ ] Play songs from specific genre (e.g., rock)
  - [ ] Return to home and refresh
  - [ ] Verify recommendations favor that genre
  
- [ ] **Mood Matching:**
  - [ ] Play songs with specific mood (e.g., calm, peaceful)
  - [ ] Verify recommendations include similar moods
  
- [ ] **Time-of-Day Awareness:**
  - [ ] Test at different times (morning, afternoon, evening, night)
  - [ ] Verify morning shows energetic songs
  - [ ] Verify night shows calm/ambient songs
  
- [ ] **Discovery Factor:**
  - [ ] After establishing preferences, verify mix includes:
    - [ ] Songs matching preferences (heard)
    - [ ] New songs user hasn't played (discovery)
  
- [ ] **Tempo Matching:**
  - [ ] Play several high-tempo songs (>120 BPM)
  - [ ] Verify recommendations include similar tempo songs

### Old Is Gold Section

**Layout & Display:**
- [ ] Section title "Old Is Gold" visible
- [ ] Badge displays "Pre-2005"
- [ ] 10-15 songs displayed in horizontal slider
- [ ] Smooth horizontal scrolling
- [ ] Each card shows cover, title, artist

**Functionality:**
- [ ] All displayed songs are from before 2005
- [ ] Selection is randomized on each home visit
- [ ] Navigate away and return - verify different songs shown
- [ ] Clicking a song plays it

**Data Verification:**
- [ ] Check year field for each displayed song
- [ ] Verify: Bohemian Rhapsody (1975) ✓
- [ ] Verify: Hotel California (1977) ✓
- [ ] Verify: Imagine (1971) ✓
- [ ] Verify: No songs from 2005 or later appear

### Most Played Section

**Layout & Display:**
- [ ] Section title "Most Played" visible
- [ ] Badge displays "Popular"
- [ ] Exactly 10 songs displayed in horizontal slider
- [ ] Rank badges visible on each card:
  - [ ] 1st place: Gold badge with "1"
  - [ ] 2nd place: Silver badge with "2"
  - [ ] 3rd place: Bronze badge with "3"
  - [ ] 4-10: Purple badges with numbers
- [ ] Badges positioned at top-left of cover art
- [ ] Smooth horizontal scrolling

**Functionality:**
- [ ] Songs are ordered by globalPlayCount (highest to lowest)
- [ ] Play a song multiple times
- [ ] Wait for Firebase to update
- [ ] Verify song moves up in ranking
- [ ] Clicking a song plays it

**Expected Order (from sample data):**
1. [ ] Blinding Lights (4200 plays) - Gold
2. [ ] Shape of You (3500 plays) - Silver
3. [ ] Levitating (2800 plays) - Bronze
4. [ ] Billie Jean (2100 plays) - #4
5. [ ] Hey Jude (1890 plays) - #5
6. [ ] Smells Like Teen Spirit (1680 plays) - #6
7. [ ] Imagine (1540 plays) - #7
8. [ ] Thriller (1450 plays) - #8
9. [ ] Come As You Are (1320 plays) - #9
10. [ ] Bohemian Rhapsody (1250 plays) - #10

### Artists Section

**Layout & Display:**
- [ ] Section title "Artists" visible
- [ ] Grid displays 3 columns × 2 rows (6 artists total)
- [ ] Each artist shows:
  - [ ] Circular avatar/profile picture
  - [ ] Artist name below avatar
- [ ] On mobile, maintains 3 columns
- [ ] On larger screens, maintains grid layout

**Functionality:**
- [ ] Artists shown are based on user's listening history
- [ ] Most-played artist appears first
- [ ] Clicking an artist opens artist detail view
- [ ] Artist detail view shows:
  - [ ] Artist name
  - [ ] Profile picture/cover
  - [ ] Bio (if available)
  - [ ] List of songs by artist
  - [ ] Back button to return to home

**Artist Profile Pictures:**
- [ ] Queen - Shows band photo
- [ ] Michael Jackson - Shows MJ portrait
- [ ] The Weeknd - Shows artist photo
- [ ] For artists without profilePictureUrl:
  - [ ] Shows first letter in circular gradient

### Playlists Section

**Layout & Display:**
- [ ] Section title "Playlists" visible
- [ ] Shows up to 10 playlists in horizontal slider
- [ ] Each playlist shows:
  - [ ] Cover (from first song in playlist)
  - [ ] Playlist name
  - [ ] Song count
- [ ] Empty state if no playlists exist

**Functionality:**
- [ ] Create a playlist
- [ ] Add songs to playlist
- [ ] Verify playlist appears in section
- [ ] Cover shows first song's artwork
- [ ] Clicking playlist opens playlist view

## Horizontal Slider Testing

### Desktop Testing
- [ ] Mouse wheel scrolling works smoothly
- [ ] Drag to scroll works
- [ ] Scrollbar appears at bottom
- [ ] Snap-to-card behavior on scroll stop
- [ ] Partial next card visible as affordance

### Mobile/Touch Testing
- [ ] Smooth touch scrolling
- [ ] Momentum/inertia scrolling works
- [ ] Snap-to-card after swipe
- [ ] Can swipe left and right
- [ ] Partial next card visible
- [ ] No overscroll issues
- [ ] Works in both portrait and landscape

### Performance
- [ ] No lag when scrolling
- [ ] No frame drops
- [ ] Smooth at 60fps
- [ ] Images load progressively
- [ ] No layout shift during image load

## General UI/UX Testing

### Navigation
- [ ] Bottom navigation works correctly
- [ ] Home tab is selected by default
- [ ] Switching tabs maintains state
- [ ] Back button returns to home

### Greeting Text
- [ ] Dynamic greeting appears in top bar
- [ ] Greeting changes based on time:
  - [ ] "Good Morning 🌅" (5am-12pm)
  - [ ] "Good Afternoon ☀️" (12pm-5pm)
  - [ ] "Good Evening 🌆" (5pm-9pm)
  - [ ] "Good Night 🌙" (9pm-5am)

### Responsive Design
- [ ] All sections work on phone screens (320px-480px)
- [ ] All sections work on tablets (768px-1024px)
- [ ] All sections work on desktop (1280px+)
- [ ] Grid layouts adjust appropriately
- [ ] Text truncates properly
- [ ] Images scale correctly

### Loading States
- [ ] Sections show loading state on first load
- [ ] Empty states display when no data
- [ ] Error states handle Firebase errors gracefully

### Performance
- [ ] Initial page load < 3 seconds
- [ ] All sections render without blocking
- [ ] Images lazy load
- [ ] No memory leaks when navigating

## Firebase Data Verification

### Recently Played Tracking
- [ ] Open Firebase Console → Realtime Database
- [ ] Navigate to `users/{your-uid}/recentlyPlayed`
- [ ] Verify structure:
  ```json
  {
    "timestamp": {
      "type": "song",
      "id": "song1",
      "songId": "song1",
      "timestamp": 1234567890,
      "playedAt": 1234567890
    }
  }
  ```
- [ ] Verify entries are added when songs play
- [ ] Verify timestamp is accurate

### Global Play Count
- [ ] Navigate to `songs/{song-id}`
- [ ] Verify `globalPlayCount` field exists
- [ ] Play a song multiple times
- [ ] Verify count increments
- [ ] Verify count persists across sessions

### Artist Metadata
- [ ] Navigate to `artists/` in database
- [ ] Verify artist entries exist:
  - [ ] `profilePictureUrl`
  - [ ] `bio`
  - [ ] `genres` array

## Edge Cases & Error Handling

### Empty States
- [ ] New user with no listening history
- [ ] User with no liked songs
- [ ] User with no playlists
- [ ] No songs in database
- [ ] All sections show appropriate empty states

### Error Scenarios
- [ ] Network disconnection during load
- [ ] Firebase connection timeout
- [ ] Missing song metadata
- [ ] Corrupted image URLs
- [ ] Invalid song data

### Data Integrity
- [ ] Songs without year field
- [ ] Songs without mood/genre tags
- [ ] Songs without tempo
- [ ] Songs without cover images
- [ ] Playlists with deleted songs

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Mobile Safari (iOS 14+)
- [ ] Chrome Mobile (Android 10+)
- [ ] Samsung Internet
- [ ] Firefox Mobile

### PWA Features
- [ ] Add to Home Screen works
- [ ] Offline mode (basic functionality)
- [ ] Splash screen shows
- [ ] Status bar styled correctly

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Screen reader announces sections
- [ ] Images have alt text
- [ ] Buttons have labels
- [ ] Color contrast meets WCAG AA

## Performance Benchmarks

Use Chrome DevTools Performance tab:
- [ ] Page load < 3s
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Largest Contentful Paint < 2.5s

## Known Issues to Document

List any issues found during testing:
1. 
2. 
3. 

## Sign-off

- [ ] All critical tests passed
- [ ] No blocking issues found
- [ ] Ready for user testing
- [ ] Ready for production deployment

**Tested by:** ________________
**Date:** ________________
**Device/Browser:** ________________
**Build/Commit:** ________________

---

## Quick Test (5 Minutes)

For rapid verification:
1. [ ] Import sample data
2. [ ] Create/login user
3. [ ] Play 3-5 songs
4. [ ] Verify Recently Played shows songs
5. [ ] Verify For You section has recommendations
6. [ ] Verify Old Is Gold shows pre-2005 songs
7. [ ] Verify Most Played shows top 10 with badges
8. [ ] Verify Artists shows 6 artists in 3×2 grid
9. [ ] Test horizontal scrolling on all sliders
10. [ ] Open artist detail view
11. [ ] Verify no console errors

If all quick tests pass, proceed with comprehensive testing.
