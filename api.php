<?php
header("Content-Type: application/json; charset=UTF-8");

include("connessione.php");

function Login()
{
    global $conn;

    $json_ricevuto = file_get_contents("php://input");
    $dati = json_decode($json_ricevuto, true);

    if (isset($dati['username'])) 
    {
        if (isset($dati['password'])) 
        {
            $username = $dati['username'];
            $password = $dati['password'];

            try 
            {
                $query = "SELECT * FROM Giocatori WHERE username = ?";
                $params = array($username);
                $stmt = sqlsrv_query($conn, $query, $params);
                
                if ($stmt == false) 
                {
                    http_response_code(500);
                    echo json_encode(["errore" => "Errore nella query"]);
                    exit();
                }

                if ($riga = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) 
                {
                    if ($riga["password"] == $password) 
                    {
                        http_response_code(200);
                        echo json_encode([
                            "successo" => true,
                            "messaggio" => "Login effettuato con successo!",
                            "username" => $riga['username'],
                            "fazione" => $riga['fazione'],
                            "click" => $riga['click']
                        ]);
                    } 
                    else 
                    {
                        http_response_code(401);
                        echo json_encode(["errore" => "Password errata."]);
                    }
                } 
                else 
                {
                    http_response_code(404);
                    echo json_encode(["errore" => "Utente non trovato."]);
                }
            } 
            catch (Exception $e) 
            {
                http_response_code(500);
                echo json_encode(["errore" => "Errore interno del server."]);
            }
            
            exit();
        }
    }

    http_response_code(400);
    echo json_encode(["errore" => "Dati incompleti."]);
    exit();
}

function Registrati()
{
    global $conn;

    $json_ricevuto = file_get_contents("php://input");
    $dati = json_decode($json_ricevuto, true);

    if (isset($dati['username']) && isset($dati['password']) && isset($dati['fazione']))
    {
        $username = $dati['username'];
        $password = $dati['password'];
        $fazione = $dati['fazione'];
        $click_iniziali = 0;

        try
        {
            $query = "INSERT INTO Giocatori (username, password, fazione, click) VALUES (?, ?, ?, ?)";
            $params = array($username, $password, $fazione, $click_iniziali);
            
            $stmt = sqlsrv_query($conn, $query, $params);
            
            if ($stmt == false)
            {
                http_response_code(500);
                echo json_encode(["errore" => "Errore nella query"]);
                exit();
            }
            
            http_response_code(201);
            echo json_encode([
                "successo" => true,
                "messaggio" => "Registrazione completata con successo!"
            ]);
            exit(); 
        }   
        catch (Exception $e) 
        {
            http_response_code(500);
            echo json_encode(["errore" => "Errore interno del server durante la registrazione."]);
            exit();
        }
    }
    
    http_response_code(400);
    echo json_encode(["errore" => "Dati incompleti."]);
    exit();
}

function SalvaClick()
{
    global $conn;

    $json_ricevuto = file_get_contents("php://input");
    $dati = json_decode($json_ricevuto, true);

    if (isset($dati['username']))
    {
        $username = $dati['username'];

        try
        {
            $query = "UPDATE Giocatori SET click = click + 1 WHERE username = ?";
            $params = array($username);
            
            $stmt = sqlsrv_query($conn, $query, $params);
            
            if ($stmt == false)
            {
                http_response_code(500);
                echo json_encode(["errore" => "Errore nell'aggiornamento dei click"]);
                exit();
            }
            
            $query_check = "SELECT click FROM Giocatori WHERE username = ?";
            $stmt_check = sqlsrv_query($conn, $query_check, array($username));
            
            if ($riga = sqlsrv_fetch_array($stmt_check, SQLSRV_FETCH_ASSOC))
            {
                http_response_code(200);
                echo json_encode([
                    "successo" => true,
                    "nuovi_click" => $riga['click']
                ]);
                exit();
            }
        }   
        catch (Exception $e) 
        {
            http_response_code(500);
            echo json_encode(["errore" => "Errore interno del server durante il salvataggio."]);
            exit();
        }
    }
    
    http_response_code(400);
    echo json_encode(["errore" => "Dati incompleti."]);
    exit();
}

function Classifica()
{
    global $conn;

    try
    {
        $query = "SELECT fazione, SUM(click) AS totale_click 
                  FROM Giocatori 
                  GROUP BY fazione 
                  ORDER BY totale_click DESC";
                  
        $stmt = sqlsrv_query($conn, $query);
        
        if ($stmt == false)
        {
            http_response_code(500);
            echo json_encode(["errore" => "Errore nel calcolo della classifica"]);
            exit();
        }

        $classifica = array();
        
        while ($riga = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC))
        {
            $classifica[] = $riga;
        }

        http_response_code(200);
        echo json_encode($classifica);
        exit();
    }   
    catch (Exception $e) 
    {
        http_response_code(500);
        echo json_encode(["errore" => "Errore interno del server."]);
        exit();
    }
}

function ClassificaGiocatori()
{
    global $conn;

    $pagina = isset($_GET['pagina']) ? intval($_GET['pagina']) : 1;
    if ($pagina < 1)
    {
        $pagina = 1;
    }

    $quantita = 5; 
    $offset = ($pagina - 1) * $quantita;

    try
    {
        $query = "SELECT username, fazione, click 
                  FROM Giocatori 
                  ORDER BY click DESC 
                  OFFSET ? ROWS 
                  FETCH NEXT ? ROWS ONLY";
                  
        $params = array($offset, $quantita);
        $stmt = sqlsrv_query($conn, $query, $params);
        
        if ($stmt == false)
        {
            http_response_code(500);
            echo json_encode(["errore" => "Errore nel recupero della classifica dettagliata."]);
            exit();
        }

        $giocatori = array();
        while ($riga = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC))
        {
            $giocatori[] = $riga;
        }

        http_response_code(200);
        echo json_encode($giocatori);
        exit();
    }   
    catch (Exception $e) 
    {
        http_response_code(500);
        echo json_encode(["errore" => "Errore interno del server."]);
        exit();
    }
}

$rotta = '';

if (isset($_GET['azione']))
{
    $rotta = $_GET['azione'];
}

switch ($rotta) 
{
    case 'login':
        Login(); 
        break;

    case 'registrati':
        Registrati();
        break;

    case 'salva-click':
        SalvaClick();
        break;

    case 'classifica':
        Classifica();
        break;

    case 'classifica-giocatori': 
        ClassificaGiocatori();
        break;

    default:
        http_response_code(404);
        echo json_encode(["errore" => "Endpoint non trovato"]);
        break;
}
?>