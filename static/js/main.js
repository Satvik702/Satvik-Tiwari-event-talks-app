// Application State
let releasesData = [];
let selectedUpdateId = null; // store "entryId-index" to identify uniquely
let activeCategory = 'ALL';
let searchQuery = '';

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const lastUpdatedTime = document.getElementById('last-updated-time');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const categoryFilters = document.getElementById('category-filters');
const loader = document.getElementById('loader');
const errorCard = document.getElementById('error-card');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const releasesTimeline = document.getElementById('releases-timeline');

// Tweet Drawer Elements
const tweetDrawer = document.getElementById('tweet-drawer');
const closeDrawerBtn = document.getElementById('close-drawer');
const deselectAllBtn = document.getElementById('deselect-all-btn');
const tweetSubmitBtn = document.getElementById('tweet-submit-btn');
const previewCategoryBadge = document.getElementById('preview-category-badge');
const previewUpdateDate = document.getElementById('preview-update-date');
const previewUpdateText = document.getElementById('preview-update-text');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const charWarning = document.getElementById('char-warning');

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchReleases();

    // Refresh Action
    refreshBtn.addEventListener('click', () => fetchReleases(true));
    retryBtn.addEventListener('click', () => fetchReleases(true));

    // Search Action
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = searchQuery.length > 0 ? 'block' : 'none';
        renderTimeline();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderTimeline();
    });

    // Category Filter Actions
    categoryFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-tag')) {
            // Remove active from all
            document.querySelectorAll('.filter-tag').forEach(tag => tag.classList.remove('active'));
            // Add active to target
            e.target.classList.add('active');
            
            activeCategory = e.target.getAttribute('data-category');
            renderTimeline();
        }
    });

    // Tweet Drawer Event Listeners
    closeDrawerBtn.addEventListener('click', closeDrawer);
    deselectAllBtn.addEventListener('click', closeDrawer);
    tweetTextarea.addEventListener('input', updateCharCounter);
    tweetSubmitBtn.addEventListener('click', submitTweet);

    // Close drawer when clicking overlay background
    tweetDrawer.addEventListener('click', (e) => {
        if (e.target === tweetDrawer) {
            closeDrawer();
        }
    });
});

// Fetch Release Notes from Flask Backend
async function fetchReleases(forceRefresh = false) {
    // Show Loading State
    loader.style.display = 'flex';
    releasesTimeline.style.display = 'none';
    errorCard.style.display = 'none';
    refreshIcon.classList.add('spinning');
    refreshBtn.disabled = true;

    try {
        const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        releasesData = data.entries || [];
        
        // Update last updated text
        lastUpdatedTime.textContent = `Updated: ${data.last_fetched}`;
        
        // Render timeline
        renderTimeline();
        
        releasesTimeline.style.display = 'block';
    } catch (error) {
        console.error('Error fetching release notes:', error);
        errorMessage.textContent = 'Could not load release notes. Please check your network connection or try again.';
        errorCard.style.display = 'block';
    } finally {
        // Stop Loading State
        loader.style.display = 'none';
        refreshIcon.classList.remove('spinning');
        refreshBtn.disabled = false;
    }
}

// Render Timeline Content based on Filters and Search
function renderTimeline() {
    releasesTimeline.innerHTML = '';
    let totalRendered = 0;

    releasesData.forEach(entry => {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'timeline-date-group';
        
        const dateHeader = document.createElement('div');
        dateHeader.className = 'timeline-date-header';
        dateHeader.innerHTML = `
            <h2>${entry.title_date}</h2>
            <div class="timeline-line"></div>
        `;
        
        const grid = document.createElement('div');
        grid.className = 'timeline-grid';
        
        let matchingUpdatesInDate = 0;

        entry.updates.forEach((update, idx) => {
            const categoryMatch = activeCategory === 'ALL' || update.category.toUpperCase() === activeCategory;
            const textMatch = !searchQuery || 
                              update.category.toLowerCase().includes(searchQuery) || 
                              update.content_text.toLowerCase().includes(searchQuery);

            if (categoryMatch && textMatch) {
                matchingUpdatesInDate++;
                totalRendered++;
                
                const uniqueId = `${entry.id}-${idx}`;
                const card = document.createElement('div');
                card.className = `update-card ${selectedUpdateId === uniqueId ? 'selected' : ''}`;
                card.setAttribute('data-id', uniqueId);
                
                // Set appropriate badge class
                const catLower = update.category.toLowerCase();
                let badgeClass = 'badge-general';
                if (catLower.includes('feature')) badgeClass = 'badge-feature';
                else if (catLower.includes('issue')) badgeClass = 'badge-issue';
                else if (catLower.includes('change')) badgeClass = 'badge-changed';
                else if (catLower.includes('deprecat')) badgeClass = 'badge-deprecated';
                
                card.innerHTML = `
                    <div class="card-header-row">
                        <span class="badge ${badgeClass}">${update.category}</span>
                        <span class="card-date">${entry.title_date}</span>
                    </div>
                    <div class="card-body">
                        ${update.content_html}
                    </div>
                    <div class="card-footer-row">
                        <button class="tweet-btn-direct" title="Tweet this update">
                            <i class="fa-brands fa-x-twitter"></i>
                            <span>Select & Tweet</span>
                        </button>
                    </div>
                `;
                
                // Card Click Event for Selection
                card.addEventListener('click', (e) => {
                    // Prevent select action trigger when clicking inside links in the body
                    if (e.target.tagName.toLowerCase() === 'a') {
                        return;
                    }
                    
                    e.stopPropagation();
                    selectUpdate(uniqueId, entry.title_date, update.category, update.content_text, entry.link);
                });
                
                grid.appendChild(card);
            }
        });

        if (matchingUpdatesInDate > 0) {
            dateGroup.appendChild(dateHeader);
            dateGroup.appendChild(grid);
            releasesTimeline.appendChild(dateGroup);
        }
    });

    if (totalRendered === 0) {
        releasesTimeline.innerHTML = `
            <div class="error-container" style="background: rgba(255, 255, 255, 0.02); border-color: rgba(255, 255, 255, 0.05); max-width: 100%;">
                <i class="fa-solid fa-magnifying-glass-minus" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 16px;"></i>
                <h3>No updates found</h3>
                <p>Try searching for different keywords or checking another category filter.</p>
            </div>
        `;
    }
}

// Select an Update and open the X-Share Drawer
function selectUpdate(id, dateText, category, textContent, link) {
    // Deselect if clicking the already selected card
    if (selectedUpdateId === id) {
        closeDrawer();
        return;
    }

    selectedUpdateId = id;
    
    // Update card selection UI states
    document.querySelectorAll('.update-card').forEach(c => {
        if (c.getAttribute('data-id') === id) {
            c.classList.add('selected');
        } else {
            c.classList.remove('selected');
        }
    });

    // Populate drawer values
    previewCategoryBadge.textContent = category;
    
    // Customize badge style in drawer
    previewCategoryBadge.className = 'preview-badge';
    const catLower = category.toLowerCase();
    if (catLower.includes('feature')) previewCategoryBadge.style.color = '#34d399';
    else if (catLower.includes('issue')) previewCategoryBadge.style.color = '#f87171';
    else if (catLower.includes('change')) previewCategoryBadge.style.color = '#c084fc';
    else if (catLower.includes('deprecat')) previewCategoryBadge.style.color = '#fbbf24';
    else previewCategoryBadge.style.color = 'var(--text-secondary)';

    previewUpdateDate.textContent = dateText;
    previewUpdateText.textContent = textContent;

    // Generate Default Tweet Text
    const generatedTweet = formatTweetText(dateText, category, textContent, link);
    tweetTextarea.value = generatedTweet;
    
    // Open drawer
    tweetDrawer.classList.add('active');
    updateCharCounter();
}

// Automatically construct a tweet text fitting within 280 characters
function formatTweetText(date, category, content, link) {
    // Twitter/X counts all links as 23 characters using its t.co wrapper
    const LINK_WEIGHT = 23;
    
    const prefix = `📢 #BigQuery Release (${date})\n[${category}]: `;
    const suffix = `\n\nDetails: ${link}`;
    
    // Max characters allowed for the main content block
    // 280 - prefix length - spacer/suffix length (LINK_WEIGHT + spacers)
    const spacersLength = 4; // for newlines and separators
    const allowedLength = 280 - prefix.length - LINK_WEIGHT - spacersLength;
    
    let tweetBody = content;
    if (content.length > allowedLength) {
        tweetBody = content.substring(0, allowedLength - 3) + '...';
    }
    
    return `${prefix}${tweetBody}${suffix}`;
}

// Update the character count logic and warnings
function updateCharCounter() {
    const text = tweetTextarea.value;
    
    // To accurately check character limits including Twitter's short link weight (23 chars)
    // Find URL matches and offset their lengths
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    
    let length = text.length;
    urls.forEach(url => {
        length = length - url.length + 23; // subtract original length, add 23
    });

    charCounter.textContent = `${length} / 280`;

    // Visual styles for thresholds
    if (length > 280) {
        charCounter.className = 'char-counter danger';
        charWarning.style.display = 'flex';
        tweetSubmitBtn.disabled = true;
        tweetSubmitBtn.style.opacity = '0.5';
    } else if (length > 250) {
        charCounter.className = 'char-counter warning';
        charWarning.style.display = 'none';
        tweetSubmitBtn.disabled = false;
        tweetSubmitBtn.style.opacity = '1';
    } else {
        charCounter.className = 'char-counter';
        charWarning.style.display = 'none';
        tweetSubmitBtn.disabled = false;
        tweetSubmitBtn.style.opacity = '1';
    }
}

// Close the Drawer and remove selection highlight
function closeDrawer() {
    selectedUpdateId = null;
    document.querySelectorAll('.update-card').forEach(c => c.classList.remove('selected'));
    tweetDrawer.classList.remove('active');
}

// Open X / Twitter share intent
function submitTweet() {
    const tweetText = tweetTextarea.value;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400,resizable=yes');
}
