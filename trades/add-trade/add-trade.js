let imagesWithTags = [];

document.addEventListener('DOMContentLoaded', () => {
    refreshTags();

    document.getElementById('add-image-btn').onclick = () => {
        document.getElementById('single-image').click();
    };

    document.getElementById('single-image').onchange = function () {
        const file = this.files[0];
        const tag = document.getElementById('tags').value;
        if (file && tag) {
            imagesWithTags.push({ path: file.path, name: file.name, tag });
            renderImageList();
            this.value = ''; // reset input
        } else if (!tag) {
            alert('Please select a tag for the image.');
            this.value = '';
        }
    };
});

function renderImageList() {
    const list = document.getElementById('image-list');
    list.innerHTML = '';
    imagesWithTags.forEach((img, idx) => {
        const div = document.createElement('div');
        div.className = 'd-flex align-items-center mb-1';
        div.innerHTML = `
            <span class="me-2">${img.name}</span>
            <span class="badge bg-info text-dark me-2">${img.tag}</span>
            <button class="btn btn-sm btn-danger" data-idx="${idx}">Remove</button>
        `;
        div.querySelector('button').onclick = function () {
            imagesWithTags.splice(idx, 1);
            renderImageList();
        };
        list.appendChild(div);
    });
}

// Optional: Dynamically load tags from backend
async function refreshTags() {
    if (!window.api || !window.api.getTags) return;
    const tags = await window.api.getTags();
    const tagSelect = document.getElementById('tags');
    tagSelect.innerHTML = '';
    tags.forEach(tag => {
        const opt = document.createElement('option');
        opt.value = tag.id;
        opt.textContent = tag.name;
        tagSelect.appendChild(opt);
    });
}
if (window.api && window.api.getTags) refreshTags();

async function refreshStrategies() {
    if (!window.api || !window.api.getStrategies) return;
    const strategies = await window.api.getStrategies();
    const strategySelect = document.getElementById('strategy');
    strategySelect.innerHTML = '';
    strategies.forEach(strategy => {
        const opt = document.createElement('option');
        opt.value = strategy.id;
        opt.textContent = strategy.name;
        strategySelect.appendChild(opt);
    });
}

if (window.api && window.api.getStrategies) refreshStrategies();

// Handle form submission
document.getElementById('trade-form').onsubmit = async (e) => {
    e.preventDefault();
    if (!window.api || !window.api.addTrade) return;
    const form = e.target;
    const trade = {
        symbol: form.symbol.value,
        date: form.date.value,
        quantity: form.quantity.value,
        strategy:form.strategy.value,
        price: form.price.value,
        notes: form.notes ? form.notes.value : ""
    };
    // Prepare images array with path and tag_id
    const images = imagesWithTags.map(img => ({
        path: img.path,
        tag_id: Number(img.tag) // img.tag should be tag_id
    }));
    await window.api.addTrade(trade, images);
    form.reset();
    imagesWithTags = [];
    renderImageList();
    alert('Trade added!');
};