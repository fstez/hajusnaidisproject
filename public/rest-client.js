const vue = Vue.createApp({
    data() {
        return {
            games: [],
            loading: false,
            error: '',
            filters: { q: '', order: 'asc' },

            // модалки
            gameInModal: {},
            formCreate: { name: '', price: 0 },
            creating: false,

            formEdit: { id: null, name: '', price: 0 },
            saving: false
        };
    },
    computed: {
        visibleGames() {
            let list = [...this.games];
            if (this.filters.q) {
                const s = this.filters.q.toLowerCase();
                list = list.filter(g => g.name.toLowerCase().includes(s));
            }
            list.sort((a, b) => a.name.localeCompare(b.name));
            if (this.filters.order === 'desc') list.reverse();
            return list;
        }
    },
    methods: {
        async refresh() {
            try {
                this.loading = true; this.error = '';
                const res = await fetch('/games');
                if (!res.ok) throw new Error('API error while loading games');
                this.games = await res.json();
            } catch (e) {
                this.error = e.message || 'Unknown error';
            } finally {
                this.loading = false;
            }
        },

        // CREATE
        async createGame() {
            try {
                this.creating = true; this.error = '';
                const res = await fetch('/games', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: this.formCreate.name,
                        price: Number(this.formCreate.price)
                    })
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Create failed');
                }
                const created = await res.json();
                this.games.push(created);
                // закрыть модалку
                bootstrap.Modal.getOrCreateInstance(document.getElementById('createModal')).hide();
                // сброс формы
                this.formCreate = { name: '', price: 0 };
            } catch (e) {
                this.error = e.message || 'Unknown error';
            } finally {
                this.creating = false;
            }
        },

        // READ single (для info)
        async openInfo(id) {
            const res = await fetch(`/games/${id}`);
            if (res.ok) {
                this.gameInModal = await res.json();
                bootstrap.Modal.getOrCreateInstance(document.getElementById('infoModal')).show();
            } else {
                const err = await res.json().catch(() => ({}));
                this.error = err.error || 'Failed to load game';
            }
        },

        // EDIT (open + save)
        openEdit(game) {
            this.formEdit = { id: game.id, name: game.name, price: Number(game.price) };
            bootstrap.Modal.getOrCreateInstance(document.getElementById('editModal')).show();
        },
        async saveEdit() {
            try {
                this.saving = true; this.error = '';
                const res = await fetch(`/games/${this.formEdit.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: this.formEdit.name,
                        price: Number(this.formEdit.price)
                    })
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Update failed');
                }
                const updated = await res.json();
                const idx = this.games.findIndex(g => g.id === updated.id);
                if (idx !== -1) this.games[idx] = updated;

                bootstrap.Modal.getOrCreateInstance(document.getElementById('editModal')).hide();
            } catch (e) {
                this.error = e.message || 'Unknown error';
            } finally {
                this.saving = false;
            }
        },

        // DELETE
        async confirmDelete(game) {
            if (!confirm(`Delete "${game.name}"?`)) return;
            const res = await fetch(`/games/${game.id}`, { method: 'DELETE' });
            if (res.status === 204) {
                this.games = this.games.filter(g => g.id !== game.id);
            } else {
                const err = await res.json().catch(() => ({}));
                this.error = err.error || 'Delete failed';
            }
        }
    },
    async created() {
        await this.refresh();
    }
}).mount('#app');
