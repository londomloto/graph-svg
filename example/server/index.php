<?php

$conn = new Mysqli('127.0.0.1', 'root', 'secret', 'easyflow');

$action = isset($_GET['action']) ? $_GET['action'] : 'index';

switch($action) {
    case 'create':
        break;
    case 'update':
        break;
    default:
        break;
}