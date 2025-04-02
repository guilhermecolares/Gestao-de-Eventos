document.querySelectorAll('.delete-event').forEach(button => {
    button.addEventListener('click', function(event) {
        event.preventDefault();
        const id = this.getAttribute('data-id');
        if (!id || id === 'null') {
            console.error('ID inválido');
            return;
        }
        fetch(`/eventos/delete/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.ok ? location.reload() : console.error('Erro ao deletar evento'))
        .catch(error => console.error('Erro:', error));
    });
});

document.querySelectorAll('.unsubscribe-event').forEach(button => {
    button.addEventListener('click', function(event) {
        event.preventDefault();
        const id = this.getAttribute('data-id');
        if (!id || id === 'null') {
            console.error('ID inválido');
            return;
        }
        fetch(`/eventos/inscrever/${id}`, { method: 'POST' })
        .then(response => response.ok ? location.reload() : console.error('Erro ao desinscrever'))
        .catch(error => console.error('Erro:', error));
    });
});