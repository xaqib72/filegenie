const Storage = {
    RECENT_KEY: 'filegenie_recent_tools',
    FAV_KEY: 'filegenie_favourite_tools',
    addRecent(tool) {
        let recents = this.getRecents();
        recents = recents.filter(t => t.id !== tool.id);
        recents.unshift(tool);
        if (recents.length > 8) recents.pop();
        localStorage.setItem(this.RECENT_KEY, JSON.stringify(recents));
    },
    getRecents() {
        try {
            return JSON.parse(localStorage.getItem(this.RECENT_KEY)) || [];
        } catch {
            return [];
        }
    },
    addFavourite(tool) {
        let favs = this.getFavourites();
        if (favs.some(t => t.id === tool.id)) return false;
        favs.unshift(tool);
        localStorage.setItem(this.FAV_KEY, JSON.stringify(favs));
        return true;
    },
    removeFavourite(id) {
        let favs = this.getFavourites().filter(t => t.id !== id);
        localStorage.setItem(this.FAV_KEY, JSON.stringify(favs));
    },
    isFavourite(id) {
        return this.getFavourites().some(t => t.id === id);
    },
    getFavourites() {
        try {
            return JSON.parse(localStorage.getItem(this.FAV_KEY)) || [];
        } catch {
            return [];
        }
    }
};
window.FileGenieStorage = Storage;
