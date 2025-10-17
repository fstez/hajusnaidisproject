const API_URL = '/games';

const tableBody = document.querySelector('#gamesTable tbody');
const form = document.querySelector('#addForm');
const nameInput = document.querySelector('#name');
const priceInput = document.querySelector('#price');

// загрузка списка
async function loadGames() {
    tableBody.innerHTML = '<tr><td colspan="4">Laadin andmeid...</td></tr>';
    const res = await fetch(API_URL);
    const data = await res.json();
    tableBody.innerHTML = '';

    // /games возвращает только имена → загрузим детали для каждого
    for (let i = 0; i < data.length; i++) {
        const res2 = await fetch(`${API_URL}/${i + 1}`);
        if (res2.ok) {
            const game = await res2.json();
            addRow(game);
        }
    }
}

function addRow(game) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
    <td>${game.id}</td>
    <td>${game.name}</td>
    <td>${game.price}</td>
    <td class="actions">
      <button onclick="editGame(${game.id})">Muuda</button>
      <button onclick="deleteGame(${game.id})">Kustuta</button>
    </td>
  `;
    tableBody.appendChild(tr);
}

// добавление
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newGame = {
        name: nameInput.value.trim(),
        price: parseFloat(priceInput.value)
    };
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGame)
    });
    if (res.ok) {
        form.reset();
        loadGames();
    } else {
        alert('Viga mängu lisamisel');
    }
});

// редактирование
async function editGame(id) {
    const newName = prompt('Uus mängu nimi:');
    const newPrice = prompt('Uus hind (€):');
    if (!newName || !newPrice) return;

    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, price: parseFloat(newPrice) })
    });
    if (res.ok) {
        loadGames();
    } else {
        alert('Viga muutmisel');
    }
}

// удаление
async function deleteGame(id) {
    if (!confirm('Kas kustutada see mäng?')) return;
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (res.ok) loadGames();
    else alert('Viga kustutamisel');
}

loadGames();
