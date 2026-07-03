/**
 * Validates the uploaded JSON schema to ensure compatibility with the dashboard
 * @param {Object} data 
 * @returns {boolean}
 */
function validateDashboardData(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Check required fields
    if (!Array.isArray(data.months) || !data.jualan || !data.resit) {
        return false;
    }

    // Check that months is not empty
    if (data.months.length === 0) return false;

    // Check jualan structure
    const requiredJualan = ['karpet', 'karpet_alt', 'kasut', 'langsir', 'sofa', 'tilam'];
    for (const key of requiredJualan) {
        if (!Array.isArray(data.jualan[key]) || data.jualan[key].length !== data.months.length) {
            return false;
        }
    }

    // Check resit structure
    const requiredResit = ['karpet', 'kasut', 'langsir', 'sofa_tilam'];
    for (const key of requiredResit) {
        if (!Array.isArray(data.resit[key]) || data.resit[key].length !== data.months.length) {
            return false;
        }
    }

    return true;
}

/**
 * Reads a JSON file upload and returns parsed/validated data
 * @param {File} file 
 * @returns {Promise<Object>}
 */
function processImportFile(file) {
    return new Promise((resolve, reject) => {
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            reject(new Error('Hanya fail format .json dibenarkan.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (validateDashboardData(parsed)) {
                    resolve(parsed);
                } else {
                    reject(new Error('Format kandungan JSON tidak sepadan dengan struktur data jualan.'));
                }
            } catch (err) {
                reject(new Error('Gagal membaca fail JSON: Format JSON tidak sah.'));
            }
        };
        reader.onerror = () => reject(new Error('Gagal membaca fail.'));
        reader.readAsText(file);
    });
}
