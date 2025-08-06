
async function refreshTradeList(){
    debugger
    if (!window.api || !window.api.getTrades) return;
    const trades = await window.api.getTrades();
    const tradeList = document.getElementById('trade-list-body');
    tradeList.innerHTML = '';
    trades.forEach(trade => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${trade.symbol}</td>
            <td>${new Date(trade.date).toLocaleDateString()}</td>
            <td>${trade.quantity}</td>
            <td>${trade.price.toFixed(2)}</td>
            <td>${trade.notes || ''}</td>
            <td>${trade.strategy_name || 'N/A'}</td>
        `;
        tradeList.appendChild(tr);
    });
}

refreshTradeList();