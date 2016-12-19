<?php
require_once('micro/autoload.php');

use Micro\App,
    Micro\Libs\Diagram,
    Micro\Libs\Uploader;

$app = new App(array(
    'database' => array(
        'host' => 'localhost',
        'user' => 'root',
        'pass' => 'secret',
        'name' => 'graph'
    )
));

/**
 * GET /diagrams/?
 */
$app->get('diagrams', function($req, $res){
    $result = Diagram::find();
    $res->responseJson($result);
});

/**
 * GET /diagrams/(\d+)/?
 */
$app->get('diagrams/{:id}', function($req, $res){
    $result = Diagram::export($req->getParam('id'));
    $res->responseJson($result);
});

/**
 * POST /diagrams/?
 */
$app->post('diagrams', function($req, $res){
    $post = $req->getPost();

    unset($post['props']['cover']);

    $result = Diagram::create($post);
    $res->responseJson($result);
});

/**
 * PUT /diagrams/(\d+)/?
 */
$app->put('diagrams/{:id}', function($req, $res){
    $post = $req->getPost();
    
    unset($post['props']['cover']);

    $result = Diagram::update($post, $req->getParam('id'));
    $res->responseJson($result);
});

/**
 * DELETE /diagrams/(\d+)/?
 */
$app->delete('diagrams/{:id}', function($req, $res){
    $result = Diagram::delete($req->getParam('id'));
    $res->responseJson($result);
});

/**
 * POST /upload/diagrams/(\d+)/?
 */
$app->post('upload/diagrams/{:id}', function($req, $res){
    if ($req->hasFiles()) {
        
        $uploader = new Uploader(array('path' => __DIR__.'/uploads/'));
        $post = $req->getPost();
        
        if (($upload = $uploader->upload())) {
            @unlink(__DIR__.'/uploads/'.$post['props']['cover']);

            $post['props']['cover'] = $upload['name'];
            Diagram::update($post, $req->getParam('id'));
        }
    }
});

$app->start();