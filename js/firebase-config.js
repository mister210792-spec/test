// Глобальные переменные
let currentUser = null;
let selectedRegPlan = 'free';
let db;
let auth;

// Инициализация сервисов Firebase
function initFirebaseServices() {
    if (typeof firebase !== 'undefined') {
        auth = firebase.auth();
        db = firebase.firestore();
        console.log("✅ Firebase сервисы готовы");
    } else {
        console.error("❌ Firebase не загрузился");
        alert("Ошибка загрузки облачных сервисов. Проверьте интернет-соединение.");
    }
}

// Экспортируем для использования в других файлах
window.currentUser = currentUser;
window.selectedRegPlan = selectedRegPlan;
window.db = db;
window.auth = auth;
window.initFirebaseServices = initFirebaseServices;