document.querySelectorAll('.delete-event').forEach(button => {
    button.addEventListener('click', function(event) {
        event.preventDefault();
        const id = this.getAttribute('data-id');

        if (!id || id === 'null') {
            console.error('ID inválido');
            return;
        }

        fetch(`/eventos/delete/${id}`, { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    this.closest('.list-group-item').remove(); // Remove sem recarregar
                } else {
                    console.error('Erro ao deletar evento');
                }
            })
            .catch(error => console.error('Erro:', error));
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const botoesDesinscrever = document.querySelectorAll(".unsubscribe-event");

    botoesDesinscrever.forEach(botao => {
        botao.addEventListener("click", async () => {
            const eventoId = botao.getAttribute("data-id");

            const resposta = await fetch(`/eventos/desinscrever/${eventoId}`, {
                method: "POST", // Certifique-se de que está como POST
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({})
            });

            if (resposta.ok) {
                location.reload(); // Recarrega a página para atualizar a lista
            } else {
                alert("Erro ao desinscrever do evento.");
            }
        });
    });
});

document.getElementById("formAdicionarSaldo").addEventListener("submit", async (e) => {
    e.preventDefault();
    const valor = document.getElementById("valorSaldo").value;

    if (valor <= 0 || valor > 10000) {
        alert("O valor deve ser entre 1 e 10.000");
        return;
    }

    try {
        const response = await fetch("/usuarios/adicionar-saldo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ valor: Number(valor) }),
        });

        const data = await response.json();
        console.log("Novo saldo recebido:", data.saldo);

        if (data.mensagem) {
            document.getElementById("saldo").innerText = data.saldo.toFixed(2);
            saldoForm.style.display = "none"; // Esconde o formulário
        } else {
            alert("Erro ao adicionar saldo.");
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao adicionar saldo.");
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const toggleButton = document.getElementById("toggleSaldoForm");
    const saldoForm = document.getElementById("saldoForm");

    if (toggleButton && saldoForm) {
        toggleButton.addEventListener("click", () => {
            console.log("Botão de adicionar saldo clicado!"); // Para depuração
            saldoForm.style.display = saldoForm.style.display === "none" ? "block" : "none";
        });
    }
});