<?php
require_once('micro/autoload.php');

$app = new Micro\App(array(
    'database' => array(
        'host' => 'localhost',
        'user' => 'root',
        'pass' => 'secret',
        'name' => 'graph'
    )
));

$app->get('diagrams', function($app){
    $result = Micro\Libs\Diagram::find();
    $app->responseJson($result);
});

$app->get('diagrams/{:id}', function($app){
    $result = Micro\Libs\Diagram::export($app->getParam('id'));
    $app->responseJson($result);
});

$app->post('diagrams', function($app){
    $post = $app->getPost();
    $result = Micro\Libs\Diagram::create($post);
    $app->responseJson($result);
});

$app->put('diagrams/{:id}', function($app){
    $post = $app->getPost();
    $result = Micro\Libs\Diagram::update($post, $app->getParam('id'));
    $app->responseJson($result);
});

$app->delete('diagrams/{:id}', function($app){
    $result = Micro\Libs\Diagram::delete($app->getParam('id'));
    $app->responseJson($result);
});

$app->start();