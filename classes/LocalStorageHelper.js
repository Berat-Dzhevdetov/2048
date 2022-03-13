const LOCAL_STORAGE_KEY = "bestscore";

export default class LocalStorageHelper {
    constructor() {
        checkLocalStorage();
    }

    getBestScore() {
        checkLocalStorage();
        return localStorage.getItem(LOCAL_STORAGE_KEY);
    }

    saveBestScore(currentScore) {
        let bestScore = this.getBestScore();
        if (currentScore > bestScore) {
            localStorage.setItem(LOCAL_STORAGE_KEY, currentScore);
        }
    }
}

function checkLocalStorage() {
    if (localStorage.getItem(LOCAL_STORAGE_KEY) == undefined) {
        localStorage.setItem(LOCAL_STORAGE_KEY, 0);
    }
}