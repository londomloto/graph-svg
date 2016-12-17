<?php

spl_autoload_register(function($name){
    $name = strtolower(str_replace(array('\\', '/'), DIRECTORY_SEPARATOR, $name));
    $file = dirname(__DIR__).DIRECTORY_SEPARATOR.$name.'.php';
    if (file_exists($file)) {
        require_once($file);
    }
});