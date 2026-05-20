// VARIABILI DI STATO GLOBALI (Sempre in cima al file)
let paginaCorrente = 1;
let classificaGiocatoriVisibile = false;

function MostraRegistrazione()
{
    document.getElementById('sezioneLogin').classList.add('d-none');
    document.getElementById('sezioneRegistrati').classList.remove('d-none');
    NascondiFeedback();
}

function MostraLogin()
{
    document.getElementById('sezioneRegistrati').classList.add('d-none');
    document.getElementById('sezioneLogin').classList.remove('d-none');
    NascondiFeedback();
}

function NascondiFeedback()
{
    document.getElementById('messaggioFeedback').classList.add('d-none');
}

function InviaLogin()
{
    let utente = document.getElementById('loginUser').value;
    let pass = document.getElementById('loginPass').value;
    let boxFeedback = document.getElementById('messaggioFeedback');

    let datiForm = {
        username: utente,
        password: pass
    };

    fetch('api.php?azione=login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datiForm)
    })
    .then(response => 
    {
        if (!response.ok) 
        {
            return response.json().then(err => { throw new Error(err.errore); });
        }
        return response.json();
    })
    .then(data => 
    {
        document.getElementById('nomeGiocatore').innerText = data.username;
        document.getElementById('fazioneGiocatore').innerText = data.fazione;
        document.getElementById('contatoreClick').innerText = data.click;
        
        document.getElementById('sezioneLogin').classList.add('d-none');
        document.getElementById('sezioneGioco').classList.remove('d-none');
        
        NascondiFeedback();
    })
    .catch(error => 
    {
        boxFeedback.className = "alert alert-danger text-center mb-3";
        boxFeedback.innerHTML = "<strong>Errore di Accesso:</strong> " + error.message;
        boxFeedback.classList.remove('d-none');
    });
}

function InviaRegistrazione()
{
    let utente = document.getElementById('regUser').value;
    let pass = document.getElementById('regPass').value;
    let faz = document.getElementById('regFazione').value;
    let boxFeedback = document.getElementById('messaggioFeedback');

    let datiForm = {
        username: utente,
        password: pass,
        fazione: faz
    };

    fetch('api.php?azione=registrati', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datiForm)
    })
    .then(response => 
    {
        if (!response.ok) 
        {
            return response.json().then(err => { throw new Error(err.errore); });
        }
        return response.json();
    })
    .then(data => 
    {
        boxFeedback.className = "alert alert-success text-center mb-3";
        boxFeedback.innerHTML = "<strong>Ottimo!</strong> " + data.messaggio;
        boxFeedback.classList.remove('d-none');
        
        document.getElementById('formRegistrati').reset();
        
        setTimeout(MostraLogin, 2000);
    })
    .catch(error => 
    {
        boxFeedback.className = "alert alert-danger text-center mb-3";
        boxFeedback.innerHTML = "<strong>Errore di Registrazione:</strong> " + error.message;
        boxFeedback.classList.remove('d-none');
    });
}

function EseguiLogout()
{
    document.getElementById('sezioneGioco').classList.add('d-none');
    document.getElementById('sezioneLogin').classList.remove('d-none');
    document.getElementById('formLogin').reset();
    NascondiFeedback();
}

function SpammaClick()
{
    let utente_corrente = document.getElementById('nomeGiocatore').innerText;
    let tagContatore = document.getElementById('contatoreClick');

    let datiInvio = {
        username: utente_corrente
    };

    fetch('api.php?azione=salva-click', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datiInvio)
    })
    .then(response => 
    {
        if (!response.ok) 
        {
            return response.json().then(err => { throw new Error(err.errore); });
        }
        return response.json();
    })
    .then(data => 
    {
        tagContatore.innerText = data.nuovi_click;
        AggiornaClassifica();
        
        if (classificaGiocatoriVisibile)
        {
            CaricaClassificaGiocatori();
        }
    })
    .catch(error => 
    {
        console.error("Errore durante il clicker:", error.message);
    });
}

function AggiornaClassifica()
{
    let container = document.getElementById('corpoClassifica');

    fetch('api.php?azione=classifica', {
        method: 'GET'
    })
    .then(response => 
    {
        if (!response.ok) 
        {
            throw new Error("Impossibile caricare la classifica");
        }
        return response.json();
    })
    .then(data => 
    {
        if (data.length === 0)
        {
            container.innerHTML = "<p class='text-secondary mb-0'>Nessun click registrato.</p>";
            return;
        }

        let htmlClassifica = "";
        
        for (let i = 0; i < data.length; i++)
        {
            let fazione = data[i].fazione;
            let click = data[i].totale_click;

            htmlClassifica += '<div class="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style="background-color: #252538;">' +
                                '<span class="fw-bold text-capitalize">' + fazione + '</span>' +
                                '<span class="badge bg-primary fs-6">' + click + ' click</span>' +
                              '</div>';
        }

        container.innerHTML = htmlClassifica;
    })
    .catch(error => 
    {
        container.innerHTML = '<p class="text-danger mb-0">' + error.message + '</p>';
    });
}

function ToggleClassificaGiocatori()
{
    let area = document.getElementById('areaGiocatori');
    let btn = document.getElementById('btnMostraGiocatori');

    if (classificaGiocatoriVisibile)
    {
        area.classList.add('d-none');
        btn.innerText = "Mostra Classifica Giocatori 🏆";
        classificaGiocatoriVisibile = false;
    }
    else
    {
        area.classList.remove('d-none');
        btn.innerText = "Nascondi Classifica Giocatori ❌";
        classificaGiocatoriVisibile = true;
        CaricaClassificaGiocatori();
    }
}

function CaricaClassificaGiocatori()
{
    let container = document.getElementById('corpoClassificaGiocatori');
    let testoPag = document.getElementById('testoPagina');
    let btnPrecedente = document.getElementById('btnPagPrecedente');
    let btnSuccessiva = document.getElementById('btnPagSuccessiva');

    btnPrecedente.disabled = (paginaCorrente === 1);

    fetch('api.php?azione=classifica-giocatori&pagina=' + paginaCorrente, {
        method: 'GET'
    })
    .then(response => 
    {
        if (!response.ok) 
        {
            throw new Error("Impossibile caricare i giocatori");
        }
        return response.json();
    })
    .then(data => 
    {
        testoPag.innerText = "Pagina " + paginaCorrente;

        if (data.length === 0)
        {
            container.innerHTML = "<p class='text-secondary text-center small mb-0'>Fine dei record o nessun giocatore trovato.</p>";
            btnSuccessiva.disabled = true;
            return;
        }

        btnSuccessiva.disabled = (data.length < 5);

        let html = "";
        
        for (let i = 0; i < data.length; i++)
        {
            let posizione = ((paginaCorrente - 1) * 5) + (i + 1);
            let utente = data[i].username;
            let click = data[i].click;

            // Grafica modificata: mostra il nome dell'utente in evidenza senza il badge della fazione
            html += '<div class="d-flex justify-content-between align-items-center mb-2 p-2 rounded small" style="background-color: #212130; border-left: 3px solid #ffc107;">' +
                        '<div>' +
                            '<span class="text-secondary me-2">#' + posizione + '</span>' +
                            '<span class="fw-bold text-warning">' + utente + '</span>' +
                        '</div>' +
                        '<span class="text-success fw-bold">' + click + ' click</span>' +
                    '</div>';
        }

        container.innerHTML = html;
    })
    .catch(error => 
    {
        container.innerHTML = '<p class="text-danger text-center small mb-0">' + error.message + '</p>';
    });
}

function PaginaPrecedente()
{
    if (paginaCorrente > 1)
    {
        paginaCorrente--;
        CaricaClassificaGiocatori();
    }
}

function PaginaSuccessiva()
{
    paginaCorrente++;
    CaricaClassificaGiocatori();
}

window.onload = function()
{
    AggiornaClassifica();
};