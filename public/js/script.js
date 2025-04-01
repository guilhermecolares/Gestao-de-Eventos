document.querySelectorAll('.btn-danger').forEach(button => {
    button.addEventListener('click', function(event) {
        event.preventDefault();
        const id = this.getAttribute('data-id');
        fetch(`/eventos/delete/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                location.reload();
            } else {
                console.error('Erro ao deletar evento');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
        });
    });
});