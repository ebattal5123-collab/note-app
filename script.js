// DOM Elementleri
const addNoteBtn = document.getElementById('addNoteBtn');
const clearBtn = document.getElementById('clearBtn');
const noteTitleInput = document.getElementById('noteTitle');
const noteContentInput = document.getElementById('noteContent');
const notesContainer = document.getElementById('notesContainer');
const themeToggle = document.getElementById('themeToggle');
const searchToggle = document.getElementById('searchToggle');
const searchContainer = document.getElementById('searchContainer');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const noteCount = document.getElementById('noteCount');
const totalChars = document.getElementById('totalChars');
const emptyState = document.getElementById('emptyState');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const backupBtn = document.getElementById('backupBtn');
const importModal = document.getElementById('importModal');
const cancelImport = document.getElementById('cancelImport');
const confirmImport = document.getElementById('confirmImport');
const importData = document.getElementById('importData');

// Notları localStorage'dan yükle
let notes = JSON.parse(localStorage.getItem('not-defteri-notes')) || [];
let searchQuery = '';

// Temayı localStorage'dan yükle
const currentTheme = localStorage.getItem('not-defteri-theme') || 'light';
document.body.classList.toggle('dark-mode', currentTheme === 'dark');
updateThemeIcon();

// İstatistikleri güncelle
function updateStats() {
    const totalNotes = notes.length;
    const totalCharacters = notes.reduce((sum, note) => sum + note.content.length, 0);
    
    noteCount.textContent = `${totalNotes} not`;
    totalChars.textContent = `${totalCharacters} karakter`;
    
    // Empty state göster/gizle
    emptyState.style.display = totalNotes === 0 ? 'block' : 'none';
}

// Notları görüntüle
function displayNotes() {
    notesContainer.innerHTML = '';
    
    let filteredNotes = notes;
    
    // Arama filtresi uygula
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredNotes = notes.filter(note => 
            (note.title && note.title.toLowerCase().includes(query)) ||
            note.content.toLowerCase().includes(query)
        );
    }
    
    // Tarihe göre sırala (yeniden eskiye)
    filteredNotes.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    filteredNotes.forEach((note, index) => {
        const originalIndex = notes.findIndex(n => n.id === note.id);
        const noteElement = document.createElement('div');
        noteElement.className = 'note-card';
        noteElement.innerHTML = `
            <div class="note-header">
                <div class="note-title">${escapeHtml(note.title) || '<span style="color: #6c757d; font-style: italic;">Başlıksız Not</span>'}</div>
                <div class="note-date">${formatDate(note.date)}</div>
            </div>
            <div class="note-content">${escapeHtml(note.content).replace(/\n/g, '<br>')}</div>
            <div class="note-actions">
                <button class="edit-btn" onclick="editNote(${originalIndex})">
                    <i class="fas fa-edit"></i> Düzenle
                </button>
                <button class="delete-btn" onclick="deleteNote(${originalIndex})">
                    <i class="fas fa-trash"></i> Sil
                </button>
            </div>
        `;
        notesContainer.appendChild(noteElement);
    });
    
    updateStats();
}

// HTML escape function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Not ekle
addNoteBtn.addEventListener('click', () => {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    
    if (content) {
        const newNote = {
            id: Date.now().toString(),
            title: title,
            content: content,
            date: new Date().toISOString()
        };
        
        notes.push(newNote);
        saveNotes();
        displayNotes();
        
        // Inputları temizle
        noteTitleInput.value = '';
        noteContentInput.value = '';
        
        // Focus title input
        noteTitleInput.focus();
        
        // Toast bildirimi göster
        showToast('Not başarıyla eklendi!');
    } else {
        showToast('Lütfen not içeriği girin!', 'error');
    }
});

// Inputları temizle
clearBtn.addEventListener('click', () => {
    noteTitleInput.value = '';
    noteContentInput.value = '';
    noteTitleInput.focus();
});

// Not sil
function deleteNote(index) {
    if (confirm('Bu notu silmek istediğinize emin misiniz?')) {
        const deletedNote = notes.splice(index, 1)[0];
        saveNotes();
        displayNotes();
        
        // Geri al butonu için bilgi sakla
        setTimeout(() => {
            if (confirm('Not silindi. Geri almak ister misiniz?')) {
                notes.splice(index, 0, deletedNote);
                saveNotes();
                displayNotes();
                showToast('Not geri alındı!');
            }
        }, 1000);
    }
}

// Not düzenle
function editNote(index) {
    const note = notes[index];
    noteTitleInput.value = note.title || '';
    noteContentInput.value = note.content;
    
    // Mevcut notu sil ve buton metnini değiştir
    notes.splice(index, 1);
    addNoteBtn.innerHTML = '<i class="fas fa-save"></i> Notu Güncelle';
    
    // Inputlara focus
    noteContentInput.focus();
    
    // Click eventini geçici olarak değiştir
    const updateHandler = () => {
        if (noteContentInput.value.trim()) {
            const updatedNote = {
                id: note.id,
                title: noteTitleInput.value.trim(),
                content: noteContentInput.value.trim(),
                date: new Date().toISOString()
            };
            
            notes.splice(index, 0, updatedNote);
            saveNotes();
            displayNotes();
            
            // Inputları ve butonu sıfırla
            noteTitleInput.value = '';
            noteContentInput.value = '';
            addNoteBtn.innerHTML = '<i class="fas fa-plus"></i> Not Ekle';
            addNoteBtn.removeEventListener('click', updateHandler);
            addNoteBtn.addEventListener('click', arguments.callee);
            
            showToast('Not başarıyla güncellendi!');
        } else {
            showToast('Not içeriği boş olamaz!', 'error');
        }
    };
    
    addNoteBtn.removeEventListener('click', arguments.callee);
    addNoteBtn.addEventListener('click', updateHandler);
}

// Tema değiştir
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('not-defteri-theme', isDarkMode ? 'dark' : 'light');
    updateThemeIcon();
    showToast(isDarkMode ? 'Karanlık mod aktif' : 'Aydınlık mod aktif');
});

function updateThemeIcon() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    themeToggle.innerHTML = isDarkMode ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
}

// Arama özelliği
searchToggle.addEventListener('click', () => {
    const isVisible = searchContainer.style.display !== 'none';
    searchContainer.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
        searchInput.focus();
    }
});

searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    displayNotes();
});

clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    displayNotes();
    searchContainer.style.display = 'none';
});

// Notları kaydet
function saveNotes() {
    localStorage.setItem('not-defteri-notes', JSON.stringify(notes));
}

// Tarihi formatla
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Bugün
    if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Bu hafta
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        return days[date.getDay()];
    }
    
    // Daha eski
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Dışa aktar
exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `not-defteri-backup-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Notlar başarıyla dışa aktarıldı!');
});

// İçe aktar
importBtn.addEventListener('click', () => {
    importData.value = '';
    importModal.style.display = 'flex';
});

cancelImport.addEventListener('click', () => {
    importModal.style.display = 'none';
});

confirmImport.addEventListener('click', () => {
    try {
        const importedNotes = JSON.parse(importData.value);
        if (Array.isArray(importedNotes)) {
            const confirmed = confirm(`${importedNotes.length} not içe aktarılacak. Emin misiniz?`);
            if (confirmed) {
                notes = importedNotes;
                saveNotes();
                displayNotes();
                importModal.style.display = 'none';
                showToast('Notlar başarıyla içe aktarıldı!');
            }
        } else {
            throw new Error('Geçersiz veri formatı');
        }
    } catch (error) {
        showToast('Geçersiz JSON verisi!', 'error');
    }
});

// Yedekle (localStorage backup)
backupBtn.addEventListener('click', () => {
    const backupKey = `not-defteri-backup-${new Date().toISOString().slice(0,10)}`;
    localStorage.setItem(backupKey, JSON.stringify(notes));
    showToast('Yedekleme başarılı!');
    
    // Eski yedekleri temizle (30 günden eski)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('not-defteri-backup-')) {
            const dateStr = key.replace('not-defteri-backup-', '').split('T')[0];
            const backupDate = new Date(dateStr);
            if (backupDate.getTime() < thirtyDaysAgo) {
                localStorage.removeItem(key);
            }
        }
    });
});

// Toast bildirimi
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.background = type === 'error' ? 'var(--danger-color)' : 'var(--success-color)';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Klavye kısayolları
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter ile not ekle
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        addNoteBtn.click();
    }
    
    // Escape ile inputları temizle
    if (e.key === 'Escape') {
        if (importModal.style.display === 'flex') {
            importModal.style.display = 'none';
        } else if (searchContainer.style.display !== 'none') {
            searchContainer.style.display = 'none';
            searchInput.value = '';
            searchQuery = '';
            displayNotes();
        } else {
            noteTitleInput.value = '';
            noteContentInput.value = '';
        }
    }
    
    // Ctrl/Cmd + F ile arama
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchContainer.style.display = 'block';
        searchInput.focus();
    }
    
    // Ctrl/Cmd + S ile kaydet (form submit engelle)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        addNoteBtn.click();
    }
});

// Input'larda enter tuşu davranışı
noteTitleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        noteContentInput.focus();
    }
});

noteContentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
        // Shift+Enter ile yeni satır
        return;
    }
    if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        addNoteBtn.click();
    }
});

// PWA için service worker kaydı
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('Service Worker kaydı başarısız:', error);
        });
    });
}

// Online/offline durum takibi
window.addEventListener('online', () => {
    showToast('İnternet bağlantısı sağlandı');
});

window.addEventListener('offline', () => {
    showToast('İnternet bağlantısı kesildi - Çevrimdışı mod', 'error');
});

// Uygulamayı başlat
displayNotes();

// İlk açılışta demo not ekle (sadece boşsa)
if (notes.length === 0) {
    const demoNote = {
        id: 'demo-1',
        title: 'Hoş Geldiniz! 👋',
        content: 'Bu basit not defteri uygulamasına hoş geldiniz!\n\n📝 Not eklemek için yukarıdaki alanı kullanın\n🎨 Temayı değiştirmek için ay düğmesine tıklayın\n🔍 Notları aramak için arama butonunu kullanın\n💾 Notlar tarayıcınızda otomatik kaydedilir\n\nKeyifli not alma!',
        date: new Date().toISOString()
    };
    notes.push(demoNote);
    saveNotes();
    displayNotes();
}
