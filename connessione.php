<?php
    $servername="vps.edoardo.uk,1433";
    $connectionOption=array("Database"=>"GiocoInformatica","Uid"=>"giocoinformatica", "PWD"=>"giocoinformatica", "TrustServerCertificate"=>true);
    $conn=sqlsrv_connect($servername, $connectionOption);
?>