<?php
namespace Micro;

class App implements IApp {

    private $_routes;
    private $_db;

    private static $_default;

    public function __construct($config = array()) {
        $this->_url = array();
        $this->_routes = array();
        
        $this->_db = Database\Mysql::factory($config['database']);
        $this->_db->connect();

        if (is_null(self::$_default)) {
            self::$_default = $this;
        }
    }

    public static function getDefault() {
        return self::$_default;
    }

    public function getRootPath() {
        static $path;
        if (is_null($path)) {
            $path = dirname(__DIR__).DIRECTORY_SEPARATOR;
        }
        return $path;
    }

    public function getSysPath() {
        static $path;
        if (is_null($path)) {
            $path = __DIR__;
        }
        return $path;
    }

    public function getBaseUrl() {
        static $url;
        if (is_null($url)) {
            $scheme = (( ! empty($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) != 'off') || $_SERVER['SERVER_PORT'] === 443) ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'];
            $uri = substr($_SERVER['SCRIPT_NAME'], 0, strpos($_SERVER['SCRIPT_NAME'], basename($_SERVER['SCRIPT_FILENAME'])));
            $url = "{$scheme}://{$host}{$uri}";
        }
        return $url;
    }

    public function db() {
        return $this->_db;
    }

    public function get($route, $callback) {
        $this->addRoute('GET', $route, $callback);
    }

    public function post($route, $callback) {
        $this->addRoute('POST', $route, $callback);   
    }

    public function put($route, $callback) {
        $this->addRoute('PUT', $route, $callback);
    }

    public function delete($route, $callback) {
        $this->addRoute('DELETE', $route, $callback);   
    }

    public function addRoute($method, $route, $callback) {
        $params  = array();

        $pattern = preg_replace_callback(
            '#\{:([a-z]+)\}#', 
            function($match) use (&$params){
                if ($match[1] == 'id') {
                    $replacement = '(\d+)';
                } else if ($match[1] == 'params') {
                    $replacement = '([a-zA-Z0-9-/.]+)';
                } else {
                    $replacement = '(\w+)';
                }

                $params[] = $match[1];
                return $replacement;
            }, 
            $route
        );

        // strict
        $pattern = '^'.$pattern.'/?$';

        $item = array(
            'method' => $method,
            'route' => $route,
            'pattern' => $pattern,
            'params' => $params,
            'callback' => $callback
        );

        $this->_routes[] = $item;
    }

    public function dispatch() {
        $req = new Http\Request();
        $res = new Http\Response();

        $method = $req->getMethod();
        $path = isset($_REQUEST['_uri']) ? $_REQUEST['_uri'] : '';

        if (empty($path)) {
            $path = 'index';
        }

        ob_start();

        foreach($this->_routes as $item) {
            if ($method == $item['method']) {

                preg_match_all('#'.$item['pattern'].'#', $path, $matches, PREG_SET_ORDER);

                if (count($matches) > 0) {
                    $values = array_values($matches[0]);

                    if (count($values) > 1) {
                        $values = array_slice($values, 1);
                        $values = array_combine($item['params'], $values);

                        if (isset($values['params'])) {
                            $values['params'] = preg_replace('#(^/|/$)#', '', $values['params']);
                            $values['params'] = explode('/', $values['params']);
                        }
                        $req->setParam($values);
                    }

                    $item['callback']($req, $res);
                    break;
                }
            }
        }

        if (ob_get_length()) {
            $res->setContent(ob_get_contents());
            ob_end_clean();
        }

        $res->send();
    }

    public function start() {
        $this->dispatch();
    }

}