let loadingId = null;

function addMessage(role, text, id) {
    const chat = document.getElementById('chat');
    const el = document.createElement('div');
    el.className = `message ${role}`;
    if (id) el.dataset.id = id;
    const pre = document.createElement('pre');
    pre.textContent = text;
    el.appendChild(pre);
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
    return el;
}

function removeMessage(id) {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) el.remove();
}

async function sendMessage() {
    const action = document.getElementById('action').value;
    const inputEl = document.getElementById('input');
    const input = inputEl.value.trim();
    const btn = document.getElementById('send-btn');

    if (!input) {
        const err = addMessage('error', 'Input is required.', 'validation-err');
        setTimeout(() => err.remove(), 2000);
        return;
    }

    addMessage('user', `[${action}]\n${input}`);
    inputEl.value = '';
    btn.disabled = true;

    const msgId = `loading-${Date.now()}`;
    addMessage('loading', 'Thinking...', msgId);

    const body = action === 'generate-feature'
        ? { feature: input }
        : { code: input };

    try {
        console.log('Calling:', `http://localhost:5000/${action}`, body);
        const res = await fetch(`http://localhost:5000/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        removeMessage(msgId);

        if (data.success) {
            addMessage('ai', data.result);
        } else {
            addMessage('error', `Error: ${data.error}`);
        }
    } catch (err) {
        console.error('FETCH ERROR:', err);
        removeMessage(msgId);
        addMessage('error', `Network error: ${err.message}`);
    } finally {
        btn.disabled = false;
    }
}

document.getElementById('input').addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});
