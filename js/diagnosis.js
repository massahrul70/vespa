// Diagnosis functionality
document.addEventListener('DOMContentLoaded', () => {
  // Setup modal
  const resultDetailModal = setupModal('result-detail-modal', null, '.close-modal');
  
  // Load symptoms for diagnosis
  loadDiagnosisSymptoms();
  
  // Setup search functionality
  const searchInput = document.getElementById('search-symptoms');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      loadDiagnosisSymptoms(searchInput.value);
    });
  }
  
  // Handle run diagnosis button
  const runDiagnosisBtn = document.getElementById('run-diagnosis');
  if (runDiagnosisBtn) {
    addButtonEffect(
      runDiagnosisBtn,
      async () => {
        return await runDiagnosis();
      },
      {
        loadingText: 'Memproses diagnosis...',
        successMessage: 'Diagnosis berhasil dijalankan!',
        errorMessage: 'Gagal menjalankan diagnosis!'
      }
    );
  }
  
  // Handle reset button
  const resetDiagnosisBtn = document.getElementById('reset-diagnosis');
  if (resetDiagnosisBtn) {
    addButtonEffect(
      resetDiagnosisBtn,
      async () => {
        resetDiagnosis();
        return true;
      },
      {
        loadingText: 'Mereset...',
        successMessage: 'Diagnosis berhasil direset!',
        errorMessage: 'Gagal mereset diagnosis!'
      }
    );
  }
  
  function loadDiagnosisSymptoms(searchTerm = '') {
    const symptomsList = document.getElementById('symptoms-list');
    if (!symptomsList) return;
    
    // Get symptoms data
    let symptoms = getSymptoms();
    
    // Filter by search term if provided
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      symptoms = symptoms.filter(s => 
        s.code.toLowerCase().includes(term) || 
        s.description.toLowerCase().includes(term)
      );
    }
    
    // Clear existing items
    symptomsList.innerHTML = '';
    
    // Check if there are symptoms
    if (symptoms.length === 0) {
      symptomsList.innerHTML = `
        <div class="empty-table">
          <i class="fas fa-search"></i>
          <p>Tidak ada gejala ditemukan</p>
        </div>
      `;
      return;
    }
    
    // Add items for each symptom
    symptoms.forEach(symptom => {
      const item = document.createElement('div');
      item.className = 'symptom-item';
      item.dataset.code = symptom.code;
      
      item.innerHTML = `
        <button class="symptom-cancel" title="Batalkan pilihan">
          <i class="fas fa-times"></i>
        </button>
        <div class="symptom-header">
          <div class="symptom-title">${symptom.description}</div>
          <div class="symptom-code">${symptom.code}</div>
        </div>
        <div class="confidence-selector">
          <div class="confidence-label">Tingkat Keyakinan:</div>
          <div class="confidence-options">
            ${confidenceLevels.slice(0, 5).map((level, index) => `
              <div class="confidence-option" data-value="${level.value}" data-index="${index}">
                ${level.display}
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
      symptomsList.appendChild(item);
      
      // Setup confidence options
      const confidenceOptions = item.querySelectorAll('.confidence-option');
      confidenceOptions.forEach(option => {
        option.addEventListener('click', () => {
          // Remove selected class from all options
          confidenceOptions.forEach(opt => opt.classList.remove('selected'));
          
          // Add selected class to clicked option
          option.classList.add('selected');
          
          // Store the selected value on the item
          item.dataset.confidence = option.dataset.value;
          
          // Mark item as selected
          item.classList.add('selected');
          
          // Show notification
          notifications.info(`Tingkat keyakinan untuk ${symptom.code} diatur ke: ${option.textContent}`, 2000);
        });
      });
      
      // Setup cancel button
      const cancelBtn = item.querySelector('.symptom-cancel');
      cancelBtn.addEventListener('click', () => {
        // Remove all selections
        confidenceOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Remove confidence data
        delete item.dataset.confidence;
        
        // Remove selected class
        item.classList.remove('selected');
        
        // Show notification
        notifications.info(`Pilihan untuk ${symptom.code} dibatalkan`, 2000);
      });
    });
  }
  
  async function runDiagnosis() {
    // Get selected symptoms
    const selectedSymptoms = [];
    const symptomItems = document.querySelectorAll('.symptom-item');
    
    symptomItems.forEach(item => {
      const code = item.dataset.code;
      const confidence = parseFloat(item.dataset.confidence || 0);
      
      if (confidence > 0) {
        selectedSymptoms.push({
          code,
          confidence
        });
      }
    });
    
    // Check if any symptoms are selected
    if (selectedSymptoms.length === 0) {
      document.getElementById('diagnosis-loading').style.display = 'none';
      document.getElementById('no-results').style.display = 'flex';
      throw new Error('Pilih minimal satu gejala untuk diagnosis');
    }
    
    // Show loading
    document.getElementById('diagnosis-loading').style.display = 'flex';
    document.getElementById('no-results').style.display = 'none';
    document.getElementById('results-content').style.display = 'none';
    
    // Perform diagnosis with a slight delay to show loading effect
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const results = performDiagnosis(selectedSymptoms);
          
          // Check if there are results
          if (results.length === 0) {
            document.getElementById('diagnosis-loading').style.display = 'none';
            document.getElementById('no-results').style.display = 'flex';
            reject(new Error('Tidak ada hasil diagnosis yang ditemukan'));
            return;
          }
          
          // Display results
          displayResults(results, selectedSymptoms);
          
          // Hide loading, show results
          document.getElementById('diagnosis-loading').style.display = 'none';
          document.getElementById('no-results').style.display = 'none';
          document.getElementById('results-content').style.display = 'flex';
          
          // Increment diagnosis count
          incrementDiagnosisCount();
          
          resolve(true);
        } catch (error) {
          document.getElementById('diagnosis-loading').style.display = 'none';
          document.getElementById('no-results').style.display = 'flex';
          reject(error);
        }
      }, 1500);
    });
  }
  
  function displayResults(results, selectedSymptoms) {
    const topResultElement = document.getElementById('top-result');
    const resultsListElement = document.getElementById('results-list');
    
    // Clear existing results
    topResultElement.innerHTML = '';
    resultsListElement.innerHTML = '';
    
    // Get symptoms data for display
    const allSymptoms = getSymptoms();
    
    // Display top result
    const topResult = results[0];
    
    // Find the symptoms that contributed to this result
    const symptomsContributed = topResult.symptomsContributed.map(s => {
      const symptom = allSymptoms.find(sym => sym.code === s.code);
      return {
        ...s,
        description: symptom ? symptom.description : 'Gejala Tidak Dikenal'
      };
    });
    
    topResultElement.innerHTML = `
      <div class="top-result-header">
        <div class="top-result-title">${topResult.description}</div>
        <div class="result-percentage">${topResult.percentage}%</div>
      </div>
      <div class="top-result-description">
        <p>Diagnosis paling mungkin berdasarkan gejala yang dipilih.</p>
        <p>Kode: ${topResult.code}</p>
      </div>
      <div class="top-result-symptoms">
        <h4>Gejala yang Berkontribusi:</h4>
        <div>
          ${symptomsContributed.map(s => `
            <span class="symptom-chip">${s.code}</span>
          `).join('')}
        </div>
      </div>
      <button class="btn btn-primary view-detail-btn" data-code="${topResult.code}">
        <i class="fas fa-search"></i>
        <span>Lihat Detail</span>
      </button>
    `;
    
    // Add click handler for view detail button
    const viewDetailBtn = topResultElement.querySelector('.view-detail-btn');
    if (viewDetailBtn) {
      addButtonEffect(
        viewDetailBtn,
        async () => {
          showResultDetail(topResult, allSymptoms);
          return true;
        },
        {
          loadingText: 'Memuat detail...',
          successMessage: 'Detail kerusakan berhasil dimuat!',
          errorMessage: 'Gagal memuat detail kerusakan!'
        }
      );
    }
    
    // Display all results
    results.forEach(result => {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.dataset.code = result.code;
      
      item.innerHTML = `
        <div class="result-info">
          <div class="result-title">${result.description}</div>
          <div class="result-code">${result.code}</div>
        </div>
        <div class="result-percentage">${result.percentage}%</div>
      `;
      
      resultsListElement.appendChild(item);
      
      // Add click handler for result item
      item.addEventListener('click', () => {
        showResultDetail(result, allSymptoms);
        notifications.info(`Menampilkan detail untuk ${result.code}`, 2000);
      });
    });
  }
  
  function showResultDetail(result, allSymptoms) {
    // Set modal title
    document.getElementById('detail-modal-title').textContent = `${result.code} - ${result.description}`;
    
    // Get damage details element
    const damageDetailsElement = document.getElementById('damage-details');
    
    // Find the symptoms that contributed to this result
    const symptomsContributed = result.symptomsContributed.map(s => {
      const symptom = allSymptoms.find(sym => sym.code === s.code);
      return {
        ...s,
        description: symptom ? symptom.description : 'Gejala Tidak Dikenal'
      };
    });
    
    // Set damage details content
    damageDetailsElement.innerHTML = `
      <div class="damage-info">
        <h3>${result.description}</h3>
        <p class="damage-description">Kode Kerusakan: ${result.code}</p>
        <div class="damage-cf">Tingkat Keyakinan: ${result.percentage}%</div>
      </div>
      
      <div class="symptoms-contributed">
        <h3>Gejala yang Berkontribusi</h3>
        ${symptomsContributed.map(s => `
          <div class="symptom-contribution">
            <div class="symptom-contribution-info">
              <div class="symptom-contribution-title">${s.description}</div>
              <div class="symptom-contribution-code">${s.code}</div>
            </div>
            <div class="symptom-contribution-value">+${Math.round(s.cf * 100)}%</div>
          </div>
        `).join('')}
      </div>
      
      <div class="repair-suggestions">
        <h3>Saran Perbaikan</h3>
        <div class="repair-suggestion-item">
          <div class="repair-suggestion-description">${result.repairSuggestions || 'Konsultasikan dengan teknisi ahli untuk perbaikan yang tepat.'}</div>
        </div>
      </div>
    `;
    
    // Open modal
    resultDetailModal.open();
  }
  
  function resetDiagnosis() {
    // Reset all confidence selections
    const confidenceOptions = document.querySelectorAll('.confidence-option');
    confidenceOptions.forEach(option => {
      option.classList.remove('selected');
    });
    
    const symptomItems = document.querySelectorAll('.symptom-item');
    symptomItems.forEach(item => {
      delete item.dataset.confidence;
      item.classList.remove('selected');
    });
    
    // Hide results
    document.getElementById('diagnosis-loading').style.display = 'none';
    document.getElementById('results-content').style.display = 'none';
    document.getElementById('no-results').style.display = 'flex';
  }
});