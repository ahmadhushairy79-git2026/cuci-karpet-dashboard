// Storage manager for local & remote sync
const STORAGE_KEY = 'bisnes_servis_dashboard_data';

const FALLBACK_DATA = {
  "months": ["January", "February", "March", "April"],
  "jualan": {
    "karpet": [23931, 36479, 24325, 18237],
    "karpet_alt": [29212, 43485, 30541, 23100],
    "kasut": [605, 165, 600, 405],
    "langsir": [1956, 2974, 1034, 450],
    "sofa": [350, 450, 2445, 1310],
    "tilam": [0, 0, 0, 380]
  },
  "resit": {
    "karpet": [178, 218, 177, 151],
    "kasut": [4, 2, 2, 4],
    "langsir": [8, 9, 8, 5],
    "sofa_tilam": [2, 5, 4, 3]
  }
};

/**
 * Loads the dashboard data, either from localStorage or falls back to sample-data.json or hardcoded fallback.
 */
async function loadDashboardData() {
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
        try {
            return JSON.parse(localData);
        } catch (e) {
            console.error('Error parsing local storage data:', e);
        }
    }
    
    // Check if running on local file system (CORS restrictions prevent fetch)
    if (window.location.protocol === 'file:') {
        console.log('Running on file system. Using hardcoded fallback data.');
        saveDashboardData(FALLBACK_DATA);
        return FALLBACK_DATA;
    }

    // Fetch from sample-data.json
    try {
        const response = await fetch('./data/sample-data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const defaultData = await response.json();
        saveDashboardData(defaultData);
        return defaultData;
    } catch (e) {
        console.error('Failed to load sample data, falling back to embedded data:', e);
        saveDashboardData(FALLBACK_DATA);
        return FALLBACK_DATA;
    }
}

/**
 * Saves data to localStorage
 */
function saveDashboardData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Resets data to original sample-data.json
 */
async function resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    return await loadDashboardData();
}

/**
 * Syncs the local JSON database to a GitHub repository using the GitHub API
 * @param {Object} data - The database to sync
 * @param {string} token - GitHub Personal Access Token
 * @param {string} repo - Repository path, e.g. "username/repo"
 * @param {string} path - Target path in the repo, e.g. "data/sales-data.json"
 */
async function syncToGitHub(data, token, repo, path) {
    if (!token || !repo || !path) {
        throw new Error('GitHub configuration details are missing.');
    }

    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
    const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };

    let sha = '';
    
    // 1. Check if the file already exists to get its SHA hash (required for updates)
    try {
        const getResponse = await fetch(url, { headers });
        if (getResponse.ok) {
            const fileData = await getResponse.json();
            sha = fileData.sha;
        }
    } catch (e) {
        console.log('File does not exist on GitHub yet, creating new one...');
    }

    // 2. Put the new content
    const body = {
        message: 'Update sales data via Business Services Dashboard',
        content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
        sha: sha || undefined
    };

    const putResponse = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
    });

    if (!putResponse.ok) {
        const errDetails = await putResponse.json();
        throw new Error(errDetails.message || 'Failed to push to GitHub.');
    }

    return await putResponse.json();
}
