<?php
namespace Micro;

class App {

    private $_routes;
    private $_currentRoute;
    private $_cachedInput;
    private $_headers;
    private $_content;

    private $_db;
    private static $_default;

    public function __construct($config = array()) {
        $this->_routes = array();
        $this->_headers = array();
        $this->_currentRoute = NULL;
        $this->_cachedInput = NULL;
        $this->_content = NULL;

        $this->_db = Database\Mysql::factory($config['database']);
        $this->_db->connect();

        if (is_null(self::$_default)) {
            self::$_default = $this;
        }
    }

    public static function getDefault() {
        return self::$_default;
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
        $request = isset($_REQUEST['_uri']) ? $_REQUEST['_uri'] : '';
        $method = $_SERVER['REQUEST_METHOD'];
        $query = array();

        foreach($_REQUEST as $key => $val) {
            if ($key != '_uri') {
                $query[$key] = $val;
            }
        }

        if (empty($request)) {
            $request = 'index';
        }

        // cached input
        $this->_cachedInput = $this->getInput();

        if ( ! empty($this->_cachedInput)) {
            try {
                $decoded = json_decode($this->_cachedInput, TRUE);
                foreach($decoded as $key => $val) {
                    $_REQUEST[$key] = $val;
                    if ($method == 'GET') {
                        $_GET[$key] = $val;
                    } else if (in_array($method, array('POST', 'PUT', 'DELETE'))) {
                        $_POST[$key] = $val;
                    }
                }    
            } catch(\Exception $e) {

            }
        }

        ob_start();

        foreach($this->_routes as $item) {
            if ($method == $item['method']) {

                preg_match_all('#'.$item['pattern'].'#', $request, $matches, PREG_SET_ORDER);

                if (count($matches) > 0) {
                    $values = array_values($matches[0]);

                    if (count($values) > 1) {
                        $values = array_slice($values, 1);
                        $values = array_combine($item['params'], $values);

                        if (isset($values['params'])) {
                            $values['params'] = preg_replace('#(^/|/$)#', '', $values['params']);
                            $values['params'] = explode('/', $values['params']);
                        }

                    }

                    $this->_currentRoute = array(
                        'params' => $values,
                        'query'  => $query
                    );
                    
                    $item['callback']($this);
                }
            }
        }

        if (ob_get_length()) {
            $this->_content = ob_get_contents();
            ob_end_clean();
        }

        $this->response();
    }

    public function getParam($key = NULL) {
        if ($this->_currentRoute) {
            $params = $this->_currentRoute['params'];
            if (is_null($key)) {
                return $params;
            }
            return isset($params[$key]) ? $params[$key] : NULL;
        }
        return NULL;
    }

    public function getQuery($key = NULL) {
        if ($this->_currentRoute) {
            $query = $this->_currentRoute['query'];
            if (is_null($key)) {
                return $query;
            }
            return isset($query[$key]) ? $query[$key] : NULL;
        }
        return NULL;   
    }

    public function getInput() {
        if (is_null($this->_cachedInput)) {
            $this->_cachedInput = file_get_contents('php://input');
        }
        return $this->_cachedInput;
    }

    public function getPost($key = NULL) {
        if (is_null($key)) {
            return $_POST;
        }
        return isset($_POST[$key]) ? $_POST[$key] : NULL;
    }

    public function addHeader($header, $value) {
        if (is_null($value)) {
            $this->_headers[] = $header;
        } else {
            $this->_headers[] = "$header: $value";
        }
    }

    public function sendHeaders() {
        if ( ! headers_sent()) {
            foreach($this->_headers as $header) {
                header($header);
            }
        }
        $this->_headers = array();
    }

    public function responseJson($content) {
        $this->addHeader('Content-Type', 'application/json');
        $this->_content = json_encode($content, JSON_PRETTY_PRINT);
    }

    public function response() {
        $this->sendHeaders();
        echo $this->_content;
    }

    public function start() {
        // start database
        
        // disptach request
        $this->dispatch();
    }

}