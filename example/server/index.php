<?php
require_once ("libs/database.php");
dispatch();

///////// SIMPLE APP /////////

function db() {
    static $db;

    if (is_null($db)) {
        
        $db = new Database(
            'localhost',
            'root',
            'secret',
            'graph'
        );

        $db->connect();
    }

    return $db;
}

function dispatch() {
    $uri = isset($_REQUEST['_uri']) ? $_REQUEST['_uri'] : '';
    $segments = explode('/', $uri);
    $action = (empty($segments[0]) ? 'index' : $segments['0']) . 'Action';
    
    if (function_exists($action)) {
        $action();
    }
}

function responseJson($data) {
    header('Content-Type: application/json;charset=utf-8');
    print(json_encode($data, JSON_PRETTY_PRINT));
    exit();
}

function loadAction() {

    $result = array(
        'success' => TRUE,
        'data' => array(),
        'total' => 0
    );

    $query = "SELECT SQL_CALC_FOUND_ROWS * FROM diagrams";
    $db = db();

    $result['data'] = $db->fetchAll($query);
    $result['total'] = $db->foundRows();

    responseJson($result);
}