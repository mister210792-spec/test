// js/init.js
// Этот файл должен загружаться самым первым

// Глобальные переменные
let currentUser = null;
let selectedRegPlan = 'free';
let db = null;
let auth = null;

// Функция инициализации Firebase
function initializeFirebase() {
    if (typeof firebase !== 'undefined') {
        auth = firebase.auth();
        db = firebase.firestore();
        console.log("✅ Firebase сервисы готовы");
        
        // Настраиваем персистентность
        firebase.firestore().enablePersistence()
            .catch((err) => {
                console.log("⚠️ Режим оффлайн не доступен:", err);
            });
            
        return true;
    } else {
        console.error("❌ Firebase не загружен");
        return false;
    }
}

// Экспортируем в глобальную область
window.currentUser = currentUser;
window.selectedRegPlan = selectedRegPlan;
window.db = db;
window.auth = auth;
window.initializeFirebase = initializeFirebase;